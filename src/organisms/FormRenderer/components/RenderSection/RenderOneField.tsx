// src/organisms/FormRenderer/components/RenderSection/RenderOneField.tsx
import React from "react";
import { Controller, useWatch } from "react-hook-form";

import { FieldSetting } from "../../interface";

import {
  isZodRequired,
  resolveDisabled,
  getDeepValue,
  normalizeByType,
  coerceChangeValue,
  isBooleanControl,
} from "../../utils";

import FieldErrorBoundary from "../FieldErrorBoundary";
import VirtualizedItem from "../VirtualizedItem";

import { FormControl } from "../../../../atoms/FormControl";
import { DatePicker } from "../../../../molecules/DatePicker";
import { Dropdown } from "../../../../molecules/Dropdown";
import { Grid, GridItem } from "../../../../atoms/Grid";

// ──────────────────────────────────────────────────────────────────────────────
// Thrower used so the error is caught by FieldErrorBoundary (must render inside it)
const ThrowMissingFieldName: React.FC = () => {
  throw new Error(`Missing required property: "name"`);
};

// Props kept minimal and stable for better memoization
type RenderOneFieldProps = {
  fs: FieldSetting;
  index: number;
  control: any;
  z: any;
  globalDisabled: boolean;
  getValues: () => Record<string, any>;
  setValue: (name: string, value: any, opts?: any) => void;
  trigger: (name?: string | string[], opts?: any) => Promise<boolean>;
  onChange: () => void;
  tableDataMap: Record<string, any[]>;
  conditionalKeys: string[];
  queueTriggers: (names: string[]) => void;
};

const RenderOneFieldBase: React.FC<RenderOneFieldProps> = ({
  fs,
  index,
  control,
  z,
  globalDisabled,
  getValues,
  setValue,
  trigger,
  onChange,
  tableDataMap,
  conditionalKeys,
  queueTriggers,
}) => {
  // Re-render when relevant values in the same namespace change.
  // e.g., for "conditional.conditionalInput", watch "conditional"
  const namespaceToWatch = React.useMemo(() => {
    const n = (fs as any)?.name as string | undefined;
    if (!n) return undefined;
    const firstSegment = n.split(".")[0]; // coarse but reliable
    return firstSegment; // e.g., "conditional"
  }, [fs]);

  // Subscribe to that namespace, so disabled/required predicates recompute
  useWatch({ control, name: namespaceToWatch as any });

  // (Optional) also watch explicit conditional keys if you pass them
  if (Array.isArray(conditionalKeys) && conditionalKeys.length) {
    useWatch({ control, name: conditionalKeys });
  }

  // NOTE: reading once per render; RHF keeps this cheap
  const values = getValues();

  // Missing name → throw inside boundary, keep colspans intact
  if (!fs || typeof (fs as any).name !== "string" || !(fs as any).name.trim()) {
    const fallbackKey = `__missing-name__-${index}`;
    return (
      <GridItem
        key={fallbackKey}
        xs={(fs as any)?.col?.xs ?? 12}
        sm={(fs as any)?.col?.sm ?? 6}
        md={(fs as any)?.col?.md ?? 4}
        lg={(fs as any)?.col?.lg ?? 3}
      >
        <VirtualizedItem fieldKey={fallbackKey}>
          <FieldErrorBoundary label={(fs as any)?.label ?? "Unnamed Field"}>
            <ThrowMissingFieldName />
          </FieldErrorBoundary>
        </VirtualizedItem>
      </GridItem>
    );
  }

  const key = (fs as any).name as string;

  // Required?
  const schemaForRequired = (fs as any).validation
    ? (fs as any).validation(z, values)
    : z.any();
  const isReq = isZodRequired(schemaForRequired);

  return (
    <GridItem
      key={key}
      xs={(fs as any).col?.xs ?? 12}
      sm={(fs as any).col?.sm ?? 6}
      md={(fs as any).col?.md ?? 4}
      lg={(fs as any).col?.lg ?? 3}
    >
      <VirtualizedItem fieldKey={key}>
        <FieldErrorBoundary label={(fs as any).label}>
          <Controller
            name={key as any}
            control={control}
            shouldUnregister={false}
            defaultValue={
              getDeepValue(getValues(), key) ??
              (isBooleanControl(fs as any) ? false : "")
            }
            render={({ field, fieldState }) => {
              const errorMsg = fieldState.error?.message;

              // Normalize display value for inputs
              let displayValue: any = field.value;
              if (!isBooleanControl(fs as any) && (fs as any).type !== "number") {
                if (displayValue === undefined || displayValue === null) displayValue = "";
              } else if ((fs as any).type === "number") {
                displayValue =
                  typeof displayValue === "number" && !isNaN(displayValue)
                    ? displayValue
                    : "";
              }

              const wrapped = (raw: any) => {
                let next = coerceChangeValue(fs as any, raw);

                const isClearedNumber =
                  (fs as any).type === "number" &&
                  (next === "" ||
                    next === null ||
                    (typeof next === "number" && Number.isNaN(next)));

                if (!isClearedNumber) next = normalizeByType(fs as any, next);
                else next = "";

                if (
                  !isBooleanControl(fs as any) &&
                  (fs as any).type !== "number" &&
                  (next === undefined || next === null)
                ) {
                  next = "";
                }

                const inAnyTable = Object.keys(tableDataMap).some((tableKey) =>
                  key.startsWith(`${tableKey}.`)
                );

                if (inAnyTable) {
                  setValue(key as any, next, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: false,
                  });
                  queueTriggers([key]);
                  return;
                }

                setValue(key as any, next, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: false,
                });
                onChange();
                queueTriggers([key, ...conditionalKeys]);
              };

              const handleBlur = () => {
                void trigger(key as any);
              };

              const testId = `${(fs as any).type ?? "text"}-${key.replace(/\./g, "-")}`;

              const common: any = {
                ...field,
                showDisabledIcon: true,
                name: key,
                testId,
                "data-testid": testId,
                ...(isBooleanControl(fs as any)
                  ? { checked: !!field.value }
                  : { value: displayValue }),
                onChange: wrapped,
                onBlur: handleBlur,
                label: (fs as any).label,
                placeholder: (fs as any).placeholder,
                helpText: errorMsg,
                required: isReq,
                color: errorMsg ? "danger" : undefined,
                disabled: resolveDisabled((fs as any).disabled, values, globalDisabled),
              };

              if ((fs as any).render) return (fs as any).render({ field, fieldState, common });
              if ((fs as any).type === "date") return <DatePicker {...common} />;
              if ((fs as any).type === "dropdown")
                return <Dropdown {...common} options={(fs as any).options || []} />;
              return <FormControl {...common} type={(fs as any).type!} options={(fs as any).options} />;
            }}
          />
        </FieldErrorBoundary>
      </VirtualizedItem>
    </GridItem>
  );
};

// Custom comparator: re-render only when relevant parts change.
// We avoid comparing global `values` (we subscribe via useWatch instead).
const areEqual = (prev: RenderOneFieldProps, next: RenderOneFieldProps) => {
  const a = prev.fs as any;
  const b = next.fs as any;

  // Core identity + layout-affecting bits
  if ((a?.name ?? "") !== (b?.name ?? "")) return false;
  if ((a?.type ?? "") !== (b?.type ?? "")) return false;

  const aCol = a?.col ?? {};
  const bCol = b?.col ?? {};
  if (aCol.xs !== bCol.xs || aCol.sm !== bCol.sm || aCol.md !== bCol.md || aCol.lg !== bCol.lg) {
    return false;
  }

  // Renderer / disabled predicate / options / labels changes
  if (a?.render !== b?.render) return false;
  if (a?.disabled !== b?.disabled) return false;
  if (a?.label !== b?.label) return false;
  if (a?.placeholder !== b?.placeholder) return false;

  // Table keys membership (affects inAnyTable check)
  const prevKeys = Object.keys(prev.tableDataMap ?? {});
  const nextKeys = Object.keys(next.tableDataMap ?? {});
  if (prevKeys.length !== nextKeys.length) return false;
  for (let i = 0; i < prevKeys.length; i++) {
    if (prevKeys[i] !== nextKeys[i]) return false;
  }

  // Global disable flag
  if (prev.globalDisabled !== next.globalDisabled) return false;

  // Stable refs/functions expected (from RHF / parent); if these change, re-render
  if (prev.control !== next.control) return false;
  if (prev.z !== next.z) return false;
  if (prev.setValue !== next.setValue) return false;
  if (prev.trigger !== next.trigger) return false;
  if (prev.onChange !== next.onChange) return false;
  if (prev.queueTriggers !== next.queueTriggers) return false;

  // We intentionally do NOT compare getValues or conditionalKeys (we subscribe via useWatch).
  return true;
};

export const RenderOneField = React.memo(RenderOneFieldBase, areEqual);

/* ──────────────────────────────────────────────────────────────────────────────
 * Built-in progressive field chunking (inside a single section/tab)
 * Renders the first N simple fields immediately, then hydrates the rest on idle.
 * Ensures the field containing `focusPath` is mounted if needed.
 * ────────────────────────────────────────────────────────────────────────────*/
export function ChunkedGrid({
  fields,
  renderItem,
  focusPath,
}: {
  fields: Array<FieldSetting>;
  renderItem: (fs: FieldSetting, index: number) => React.ReactNode; // index added
  focusPath?: string | null;
}) {
  const CHUNK_THRESHOLD = 48;
  const FIRST_CHUNK = 16;
  const STEP = 24;

  const needsChunking = fields.length > CHUNK_THRESHOLD;

  const [count, setCount] = React.useState<number>(
    needsChunking ? Math.min(FIRST_CHUNK, fields.length) : fields.length
  );

  React.useEffect(() => {
    if (!needsChunking || count >= fields.length) return;
    let cancelled = false;
    const w: any = window;
    const schedule = (fn: () => void) => {
      if (typeof w.requestIdleCallback === "function") {
        const id = w.requestIdleCallback(fn, { timeout: 800 });
        return () => w.cancelIdleCallback?.(id);
      }
      const id = window.setTimeout(fn, 50);
      return () => window.clearTimeout(id);
    };
    const tick = () => {
      if (cancelled) return;
      setCount((c) => Math.min(fields.length, c + STEP));
      if (!cancelled && count + STEP < fields.length) cleanup = schedule(tick);
    };
    let cleanup = schedule(tick);
    return () => {
      cancelled = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsChunking, fields.length, count]);

  React.useEffect(() => {
    if (!needsChunking || !focusPath) return;
    const idx = fields.findIndex(
      (f) => f?.name && (focusPath === f.name || focusPath.startsWith(f.name + "."))
    );
    if (idx >= 0 && idx + 1 > count) setCount(idx + 1);
  }, [needsChunking, focusPath, fields, count]);

  return <Grid>{fields.slice(0, count).map((fs, i) => renderItem(fs, i))}</Grid>;
}
