// src/organisms/FormRenderer/components/RenderSection/index.tsx
import React, { useMemo } from "react";
import {
  Controller,
  UseFormSetError,
  UseFormClearErrors,
  useWatch,
} from "react-hook-form";

import {
  SettingsItem,
  FieldGroup,
  FieldSetting,
  DataTableSection,
} from "../../interface";

import {
  flattenForSchema,
  buildSchema,
  isZodRequired,
  resolveDisabled,
  getDeepValue,
  setDeepValue,
  debounce,
  containsFieldPath,
  firstTabIndexContainingPath,
  prefixItems,
  shiftNestedTableKeys,
  dropNestedKeysForIndex,
  normalizeByType,
  coerceChangeValue,
  emptyFor,
  escapeRegExp,
  hasAccordion,
  hasTabs,
  hasFields,
  hasDataTable,
  toLeafFieldSettings,
  isBooleanControl,
} from "../../utils";

import FieldErrorBoundary from "../FieldErrorBoundary";
import VirtualizedItem from "../VirtualizedItem";

import { FormControl } from "../../../../atoms/FormControl";
import { DatePicker } from "../../../../molecules/DatePicker";
import { Panel } from "../../../../molecules/Panel";
import { Dropdown } from "../../../../molecules/Dropdown";
import { Grid, GridItem } from "../../../../atoms/Grid";
import { Tabs } from "../../../../organisms/Tabs";
import { Accordion } from "../../../../molecules/Accordion";
import { DataTable } from "../../../../organisms/DataTable";
import { Button } from "../../../../atoms/Button";

import { Description, SectionWrapper, ButtonContainer } from "../../styled";

/* ──────────────────────────────────────────────────────────────────────────────
 * Built-in progressive field chunking (inside a single section/tab)
 * Renders the first N simple fields immediately, then hydrates the rest on idle.
 * Ensures the field containing `focusPath` is mounted if needed.
 * ────────────────────────────────────────────────────────────────────────────*/
function ChunkedGrid({
  fields,
  renderItem,
  focusPath,
}: {
  fields: Array<FieldSetting>;
  renderItem: (fs: FieldSetting) => React.ReactNode;
  focusPath?: string | null;
}) {
  const CHUNK_THRESHOLD = 48; // only chunk if a section has >48 simple fields
  const FIRST_CHUNK = 16;     // mount immediately
  const STEP = 24;            // add per idle tick

  const needsChunking = fields.length > CHUNK_THRESHOLD;

  const [count, setCount] = React.useState<number>(
    needsChunking ? Math.min(FIRST_CHUNK, fields.length) : fields.length
  );

  // Idle hydrator to progressively reveal more fields
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
      // schedule next tick if there are more to reveal
      if (!cancelled && count + STEP < fields.length) {
        cleanup = schedule(tick);
      }
    };

    let cleanup = schedule(tick);
    return () => {
      cancelled = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsChunking, fields.length, count]);

  // Ensure a focused/errored field is mounted
  React.useEffect(() => {
    if (!needsChunking || !focusPath) return;
    const idx = fields.findIndex(
      (f) => f?.name && (focusPath === f.name || focusPath.startsWith(f.name + "."))
    );
    if (idx >= 0 && idx + 1 > count) {
      setCount(idx + 1);
    }
  }, [needsChunking, focusPath, fields, count]);

  return <Grid>{fields.slice(0, count).map((fs) => renderItem(fs))}</Grid>;
}

/* ──────────────────────────────────────────────────────────────────────────────
 * RenderSection as a memoized component (subscribes to visible/draft names)
 * ────────────────────────────────────────────────────────────────────────────*/
type RenderSectionProps = {
  items: SettingsItem[];
  errors: any;
  onChange: () => void;
  control: any;
  z: typeof import("zod") | any;
  globalDisabled: boolean;
  originalData: Record<string, any>;
  getValues: () => Record<string, any>;
  setValue: (name: string, value: any, opts?: any) => void;
  trigger: (name?: string | string[], opts?: any) => Promise<boolean>;
  setError: UseFormSetError<any>;
  clearErrors: UseFormClearErrors<any>;
  conditionalKeys: string[];
  activeRowIndexMap: Record<string, number | null>;
  setActiveRowIndexMap: React.Dispatch<
    React.SetStateAction<Record<string, number | null>>
  >;
  tableDataMap: Record<string, any[]>;
  setTableDataMap: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  rowSnapshots: React.MutableRefObject<Record<string, any>>;
  lastProcessedRef: React.MutableRefObject<Record<string, number | null>>;
  ancestorRowSelected?: boolean | null;
  tableVersionMap?: Record<string, number>;
  setTableVersionMap?: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  focusPath?: string | null;

  /** Optional progressive helpers (defaulted internally) */
  pathKey?: string;
  heavyReady?: boolean;
  tabsActiveIndexRef?: React.MutableRefObject<Map<string, number>>;
  mountedTabsRef?: React.MutableRefObject<Map<string, Set<number>>>;
  onTabEnter?: (groupKey: string, index: number) => void;
};

export const RenderSection = React.memo(function RenderSection(
  props: RenderSectionProps,
) {
  const {
    items,
    errors,
    onChange,
    control,
    z,
    globalDisabled,
    originalData,
    getValues,
    setValue,
    trigger,
    setError,
    clearErrors,
    conditionalKeys,
    activeRowIndexMap,
    setActiveRowIndexMap,
    tableDataMap,
    setTableDataMap,
    rowSnapshots,
    lastProcessedRef,
    ancestorRowSelected = null,
    tableVersionMap,
    setTableVersionMap,
    focusPath = null,

    // Optional progressive props with safe defaults
    pathKey = "root",
    heavyReady = true,
    tabsActiveIndexRef: tabsIdxRefProp,
    mountedTabsRef: mountedTabsRefProp,
    onTabEnter: onTabEnterProp,
  } = props;

  // Default holders if parent didn’t pass refs/handlers
  const localTabsIdxRef = React.useRef<Map<string, number>>(new Map());
  const tabsActiveIndexRef = tabsIdxRefProp ?? localTabsIdxRef;

  const localMountedTabsRef = React.useRef<Map<string, Set<number>>>(new Map());
  const mountedTabsRef = mountedTabsRefProp ?? localMountedTabsRef;

  const onTabEnter =
    onTabEnterProp ??
    ((groupKey: string, idx: number) => {
      let set = mountedTabsRef.current.get(groupKey);
      if (!set) {
        set = new Set<number>();
        mountedTabsRef.current.set(groupKey, set);
      }
      set.add(idx);
    });

  /** Build the list of field names this section renders, including DataTable DRAFT names. */
  const namesToWatch = useMemo(() => {
    const names: string[] = [];

    const walk = (nodes: SettingsItem[], basePath = "") => {
      for (const it of nodes) {
        if (hasDataTable(it)) {
          const mapKey = (it as any).dataTable.config.dataSource;
          const leafs = toLeafFieldSettings((it as any).dataTable.fields);
          for (const lf of leafs)
            names.push(`${basePath ? basePath + "." : ""}${mapKey}.${lf.name}`); // DRAFT inputs
          // Active row inputs are handled by recursion when rendered (prefixItems with index)
          continue;
        }
        if (hasFields(it)) {
          walk((it as FieldGroup).fields!, basePath);
          continue;
        }
        if (hasAccordion(it)) {
          for (const sec of (it as any).accordion) walk(sec.fields, basePath);
          continue;
        }
        if (hasTabs(it)) {
          for (const tab of (it as any).tabs) walk(tab.fields, basePath);
          continue;
        }
        const fs = it as FieldSetting;
        if (typeof fs?.name === "string")
          names.push(`${basePath ? basePath + "." : ""}${fs.name}`);
      }
    };
    walk(items);
    // Also watch conditional keys that influence visibility/disabled
    for (const k of conditionalKeys) if (!names.includes(k)) names.push(k);
    return names;
  }, [items, conditionalKeys]);

  // Subscribe locally so this section re-renders when its own fields change (fixes enable/disable & draft detection).
  useWatch({ control, name: namesToWatch });

  const values = getValues();
  const nodes: React.ReactNode[] = [];
  let standalone: FieldSetting[] = [];
  let flushCount = 0;

  /** debounced, batched trigger queue (component-local) */
  const pendingNamesRef = React.useRef<Set<string>>(new Set());
  const flushTriggers = React.useCallback(
    (names: string[]) => {
      void trigger(names);
      pendingNamesRef.current.clear();
    },
    [trigger],
  );
  const debouncedFlush = React.useMemo(
    () => debounce(flushTriggers, 150),
    [flushTriggers],
  );
  const queueTriggers = React.useCallback(
    (names: string[]) => {
      const set = pendingNamesRef.current;
      for (const n of names) set.add(n);
      debouncedFlush(Array.from(set));
    },
    [debouncedFlush],
  );

  /** Render a single simple field (used by ChunkedGrid) */
  const renderOneField = (fs: FieldSetting) => {
    const key = fs.name!;
    const err = getDeepValue(errors, key)?.message;
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
                const errorMsg = fieldState.error?.message ?? err;

                // Display value normalization
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

                  // keep '' during number clearing
                  const isClearedNumber =
                    (fs as any).type === "number" &&
                    (next === "" ||
                      next === null ||
                      (typeof next === "number" && Number.isNaN(next)));

                  if (!isClearedNumber) {
                    next = normalizeByType(fs as any, next);
                  } else {
                    next = "";
                  }

                  if (
                    !isBooleanControl(fs as any) &&
                    (fs as any).type !== "number" &&
                    (next === undefined || next === null)
                  )
                    next = "";

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
                  disabled: resolveDisabled(
                    (fs as any).disabled,
                    values,
                    globalDisabled
                  ),
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

  /** Flush buffered simple fields, with progressive chunking */
  const flush = () => {
    if (!standalone.length) return;
    nodes.push(
      <SectionWrapper className="fields-wrapper" key={`flush-${flushCount++}`}>
        <ChunkedGrid
          fields={standalone}
          renderItem={renderOneField}
          focusPath={focusPath}
        />
      </SectionWrapper>,
    );
    standalone = [];
  };

  items.forEach((item, idx) => {
    const hideProp = (item as any).hidden;
    const isHidden =
      typeof hideProp === "function" ? hideProp(values) : hideProp === true;
    const isContainer =
      hasDataTable(item) ||
      hasAccordion(item) ||
      hasTabs(item) ||
      hasFields(item);

    // Hidden simple fields should NOT break grouping; hidden containers flush.
    if (isHidden) {
      if (isContainer) flush();
      return;
    }

    /* ────────────────────────────────────────────────────────────────────────
     * DataTable section — always render nested draft inputs
     * ──────────────────────────────────────────────────────────────────────*/
    if (hasDataTable(item)) {
      flush();
      const { dataTable } = item as { dataTable: DataTableSection };
      const {
        header,
        isSubHeader,
        description,
        config,
        fields: dtFields,
        hidden,
        disabled,
      } = dataTable;

      const mapKey = config.dataSource;
      const activeIdx = activeRowIndexMap?.[mapKey] ?? null;

      // if the table is nested (e.g., "parent.items"), merge parent context for predicates
      const parentKey = mapKey.includes(".")
        ? mapKey.split(".").slice(0, -1).join(".")
        : "";
      let ctxForPred: any = values;
      if (parentKey) {
        const fromOrig = getDeepValue(originalData, parentKey);
        const fromVals = getDeepValue(values, parentKey);
        const mergedParent = { ...(fromOrig ?? {}), ...(fromVals ?? {}) };
        ctxForPred = setDeepValue({ ...values }, parentKey, mergedParent);
      }

      const isBlockedByAncestor = ancestorRowSelected === false;
      const isHiddenDt =
        typeof hidden === "function" ? hidden(ctxForPred) : !!hidden;
      const isDisabled =
        globalDisabled ||
        (typeof disabled === "function" ? disabled(ctxForPred) : !!disabled) ||
        isBlockedByAncestor;

      if (isHiddenDt) {
        flush();
        return;
      }

      const canonicalTable: any[] =
        tableDataMap[mapKey] ?? getDeepValue(originalData, mapKey) ?? [];

      // child path for nested field names (active row → prefix with index)
      const childPath = activeIdx != null ? `${mapKey}.${activeIdx}` : mapKey;

      nodes.push(
        <React.Fragment key={`tbl-${idx}`}>
          <Panel
            title={header}
            isSubHeader={isSubHeader}
            hideShadow
            className={`${!!header ? "has-header" : "no-header"}`}
          >
            {description && <Description>{description}</Description>}

            <SectionWrapper
              className="data-table-wrapper-section"
              $hasHeader={!!header}
            >
              <VirtualizedItem fieldKey={`table:${mapKey}`}>
                <DataTable
                  key={`dt:${mapKey}:${tableVersionMap?.[mapKey] ?? 0}`}
                  maxHeight="176px"
                  pageSize={5}
                  dataSource={canonicalTable}
                  columnSettings={config.columnSettings}
                  disabled={isDisabled}
                  activeRow={activeRowIndexMap[mapKey]?.toString()}
                  onChange={(newData) => {
                    if (isBlockedByAncestor) return;
                    setTableDataMap((prev) => ({ ...prev, [mapKey]: newData }));
                    setValue(mapKey, newData);
                    setTableVersionMap?.((m) => ({
                      ...m,
                      [mapKey]: (m[mapKey] ?? 0) + 1,
                    }));
                    onChange();
                  }}
                  onActiveRowChange={(_, rowIndex) => {
                    const selIdx = rowIndex != null ? Number(rowIndex) : null;
                    const canonicalRow =
                      selIdx != null ? (canonicalTable[selIdx] ?? null) : null;

                    // skip if same selection & unchanged snapshot
                    if (
                      lastProcessedRef.current[mapKey] === selIdx &&
                      JSON.stringify(rowSnapshots.current[mapKey] ?? null) ===
                        JSON.stringify(canonicalRow ?? null)
                    ) {
                      return;
                    }

                    setActiveRowIndexMap((prev) =>
                      prev[mapKey] === selIdx
                        ? prev
                        : { ...prev, [mapKey]: selIdx },
                    );
                    rowSnapshots.current[mapKey] = canonicalRow
                      ? { ...canonicalRow }
                      : null;
                    lastProcessedRef.current[mapKey] = selIdx;

                    clearErrors(mapKey as any);

                    // seed all leaf inputs for the selected row
                    const namedFields = flattenForSchema(dtFields as any).filter(
                      (fs: any): fs is FieldSetting & { name: string } =>
                        typeof fs?.name === "string" && fs.name.length > 0,
                    );

                    const toTrigger: string[] = [];

                    const getFromRow = (path: string, row: any) => {
                      if (!row) return undefined;
                      const parts = path.split(".");
                      const full = parts.reduce((o: any, seg) => o?.[seg], row);
                      if (full !== undefined) return full;
                      const leaf = parts[parts.length - 1];
                      return row?.[leaf];
                    };

                    namedFields.forEach((fs) => {
                      const raw = fs.name;
                      const full =
                        selIdx != null
                          ? `${mapKey}.${selIdx}.${raw}`
                          : `${mapKey}.${raw}`;
                      const from = canonicalRow ? getFromRow(raw, canonicalRow) : undefined;
                      const val =
                        from !== undefined && from !== null
                          ? from
                          : emptyFor(fs);
                      setValue(full, val, {
                        shouldDirty: false,
                        shouldTouch: false,
                        shouldValidate: false,
                      });
                      if (selIdx != null) toTrigger.push(full);
                    });

                    if (toTrigger.length) void trigger(toTrigger);
                  }}
                />

                {(() => {
                  const leafDraftFS = toLeafFieldSettings(dtFields as any);
                  const draftValues = leafDraftFS.map((fs: any) =>
                    getDeepValue(getValues(), `${mapKey}.${fs.name}`),
                  );
                  const hasDraft = draftValues.some(
                    (v) =>
                      v != null &&
                      v !== "" &&
                      !(typeof v === "boolean" && v === false),
                  );
                  const canAdd =
                    activeIdx == null && hasDraft && !isBlockedByAncestor;
                  const canCancel = activeIdx != null || hasDraft;

                  return (
                    <ButtonContainer className="button-wrapper">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!canAdd}
                        data-testid={`btn-add-${mapKey}`}
                        onClick={async () => {
                          if (isBlockedByAncestor) return;

                          const absDraftItems = prefixItems(
                            dtFields as any,
                            mapKey,
                          );
                          const absFlatAll = (
                            flattenForSchema(absDraftItems) as any[]
                          ).filter(
                            (fs: any) => typeof fs?.name === "string",
                          ) as Array<FieldSetting & { name: string }>;
                          const absFlatLeaves = absFlatAll.filter(
                            (fs) =>
                              !absFlatAll.some(
                                (other) =>
                                  other !== fs &&
                                  other.name.startsWith(fs.name + "."),
                              ),
                          );

                          const relFlat = absFlatLeaves.map((fs) => ({
                            ...fs,
                            name: fs.name.replace(
                              new RegExp(`^${escapeRegExp(mapKey)}\\.`),
                              "",
                            ),
                          }));

                          // gather draft values
                          let draftValuesObj: Record<string, any> = {};
                          absFlatLeaves.forEach((abs) => {
                            const relName = abs.name.replace(
                              new RegExp(`^${escapeRegExp(mapKey)}\\.`),
                              "",
                            );
                            const v = getDeepValue(getValues(), abs.name);
                            draftValuesObj = setDeepValue(
                              draftValuesObj,
                              relName,
                              v,
                            );
                          });

                          // validate draft as a row
                          let ctx = { ...getValues(), ...draftValuesObj };
                          for (const [relKey, v] of Object.entries(
                            draftValuesObj,
                          )) {
                            ctx = setDeepValue(ctx, `${mapKey}.${relKey}`, v);
                          }
                          const draftSchema = buildSchema(relFlat as any, ctx);
                          const result =
                            await draftSchema.safeParseAsync(draftValuesObj);

                          if (!result.success) {
                            result.error.errors.forEach((err) => {
                              const relPath = Array.isArray(err.path)
                                ? err.path.join(".")
                                : String(err.path ?? "");
                              setError(`${mapKey}.${relPath}` as any, {
                                type: "manual",
                                message: err.message,
                              });
                            });
                            const firstRel = Array.isArray(
                              result.error.errors[0].path,
                            )
                              ? result.error.errors[0].path.join(".")
                              : String(result.error.errors[0].path ?? "");
                            const el = document.querySelector<HTMLElement>(
                              `[name="${mapKey}.${firstRel}"]`,
                            );
                            el?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                            el?.focus();
                            return;
                          }

                          // normalize & prepend new row
                          let newRow: Record<string, any> = {};
                          absFlatLeaves.forEach((abs) => {
                            const relName = abs.name.replace(
                              new RegExp(`^${escapeRegExp(mapKey)}\\.`),
                              "",
                            );
                            let v = getDeepValue(getValues(), abs.name);
                            v = normalizeByType(abs, v);
                            newRow = setDeepValue(newRow, relName, v);
                          });

                          // ensure nested child tables are present
                          const childTableKeys = (dtFields as any)
                            .filter((it: any) => "dataTable" in it)
                            .map(
                              (it: any) =>
                                it.dataTable.config.dataSource as string,
                            );
                          for (const key of childTableKeys)
                            if (newRow[key] == null) newRow[key] = [];

                          const prevFormRows: any[] = Array.isArray(
                            tableDataMap[mapKey],
                          )
                            ? tableDataMap[mapKey]
                            : [];
                          const newTable = [newRow, ...prevFormRows];

                          const shifted = shiftNestedTableKeys(
                            tableDataMap,
                            mapKey,
                            0,
                            +1,
                          );

                          setTableDataMap({ ...shifted, [mapKey]: newTable });
                          setValue(mapKey, newTable);

                          // reset selection caches so reseed after prepend isn’t skipped
                          rowSnapshots.current[mapKey] = null as any;
                          lastProcessedRef.current[mapKey] = null;

                          setTableVersionMap?.((m) => ({
                            ...m,
                            [mapKey]: (m[mapKey] ?? 0) + 1,
                          }));
                          onChange();

                          // clear draft inputs
                          absFlatLeaves.forEach((abs) => {
                            setValue(
                              `${abs.name}`,
                              isBooleanControl(abs) ? false : "",
                              {
                                shouldDirty: false,
                                shouldTouch: false,
                                shouldValidate: false,
                              },
                            );
                          });
                        }}
                      >
                        Add
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        disabled={activeIdx == null || isBlockedByAncestor}
                        data-testid={`btn-update-${mapKey}`}
                        onClick={async () => {
                          if (isBlockedByAncestor || activeIdx == null) return;
                          (
                            document.activeElement as HTMLElement | null
                          )?.blur?.();

                          const flatFS: Array<FieldSetting & { name: string }> =
                            flattenForSchema(dtFields as any).filter(
                              (fs: any) =>
                                typeof fs?.name === "string" &&
                                fs.name.length > 0,
                            ) as any[];

                          const fieldNames = flatFS.map(
                            (fs) => `${mapKey}.${activeIdx}.${fs.name}`,
                          );
                          const isValid = await trigger(fieldNames, {
                            shouldFocus: true,
                          });
                          if (!isValid) return;

                          const prevFormRows: any[] = Array.isArray(
                            tableDataMap[mapKey],
                          )
                            ? tableDataMap[mapKey]
                            : (getDeepValue(getValues(), mapKey) ?? []);
                          let updatedRow: Record<string, any> = {
                            ...(prevFormRows[activeIdx] ?? {}),
                          };

                          flatFS.forEach((fs) => {
                            const fullPath = `${mapKey}.${activeIdx}.${fs.name}`;
                            let v = getDeepValue(getValues(), fullPath);
                            v = normalizeByType(fs as any, v);
                            updatedRow = setDeepValue(updatedRow, fs.name, v);
                          });

                          const newTable = prevFormRows.slice();
                          newTable[activeIdx] = updatedRow;

                          setTableDataMap((m) => ({
                            ...m,
                            [mapKey]: newTable,
                          }));
                          setValue(mapKey, newTable);

                          const leafDraftFS2 = toLeafFieldSettings(
                            dtFields as any,
                          );
                          clearErrors([
                            mapKey,
                            ...leafDraftFS2.map(
                              (fs) => `${mapKey}.${activeIdx}.${fs.name}`,
                            ),
                          ] as any);
                          setActiveRowIndexMap((prev) => ({
                            ...prev,
                            [mapKey]: null,
                          }));
                          rowSnapshots.current[mapKey] = null as any;
                          lastProcessedRef.current[mapKey] = null;

                          // clear drafts
                          leafDraftFS2.forEach((fs: any) => {
                            setValue(
                              `${mapKey}.${fs.name}`,
                              isBooleanControl(fs) ? false : "",
                              {
                                shouldDirty: false,
                                shouldTouch: false,
                                shouldValidate: false,
                              },
                            );
                          });

                          setTableVersionMap?.((m) => ({
                            ...m,
                            [mapKey]: (m[mapKey] ?? 0) + 1,
                          }));
                          onChange();
                          void trigger(mapKey as any);
                        }}
                      >
                        Update
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        color="danger"
                        disabled={activeIdx == null || isBlockedByAncestor}
                        variant={activeIdx !== null ? "outlined" : undefined}
                        data-testid={`btn-delete-${mapKey}`}
                        onClick={() => {
                          if (isBlockedByAncestor || activeIdx == null) return;

                          const prevFormRows: any[] = Array.isArray(
                            tableDataMap[mapKey],
                          )
                            ? tableDataMap[mapKey]
                            : (getDeepValue(getValues(), mapKey) ?? []);
                          const newTable = prevFormRows.filter(
                            (_, i) => i !== activeIdx,
                          );

                          let nextMap = dropNestedKeysForIndex(
                            tableDataMap,
                            mapKey,
                            activeIdx,
                          );
                          nextMap = shiftNestedTableKeys(
                            nextMap,
                            mapKey,
                            activeIdx + 1,
                            -1,
                          );

                          setTableDataMap({ ...nextMap, [mapKey]: newTable });
                          rowSnapshots.current[mapKey] = null as any;
                          setActiveRowIndexMap((prev) => ({
                            ...prev,
                            [mapKey]: null,
                          }));
                          lastProcessedRef.current[mapKey] = null;
                          setValue(mapKey, newTable);

                          setTableVersionMap?.((m) => ({
                            ...m,
                            [mapKey]: (m[mapKey] ?? 0) + 1,
                          }));
                          onChange();
                        }}
                      >
                        Delete
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        color="default"
                        variant={canCancel ? "outlined" : undefined}
                        disabled={!canCancel}
                        data-testid={`btn-cancel-${mapKey}`}
                        onClick={() => {
                          setActiveRowIndexMap((prev) => ({
                            ...prev,
                            [mapKey]: null,
                          }));
                          const leafDraftFS2 = toLeafFieldSettings(
                            dtFields as any,
                          );
                          clearErrors(
                            leafDraftFS2.map(
                              (fs: any) => `${mapKey}.${fs.name}`,
                            ),
                          );
                          leafDraftFS2.forEach((fs: any) => {
                            setValue(
                              `${mapKey}.${fs.name}`,
                              isBooleanControl(fs) ? false : "",
                              {
                                shouldDirty: false,
                                shouldTouch: false,
                                shouldValidate: false,
                              },
                            );
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </ButtonContainer>
                  );
                })()}
              </VirtualizedItem>

              {/* Always render nested fields so draft inputs exist immediately */}
              {dtFields && dtFields.length > 0 && (
                <RenderSection
                  items={prefixItems(dtFields as any, childPath)}
                  errors={errors}
                  onChange={onChange}
                  control={control}
                  z={z}
                  globalDisabled={globalDisabled || isBlockedByAncestor}
                  originalData={getValues()}
                  getValues={getValues}
                  setValue={setValue}
                  trigger={trigger}
                  setError={setError}
                  clearErrors={clearErrors}
                  conditionalKeys={conditionalKeys}
                  activeRowIndexMap={activeRowIndexMap}
                  setActiveRowIndexMap={setActiveRowIndexMap}
                  tableDataMap={tableDataMap}
                  setTableDataMap={setTableDataMap}
                  rowSnapshots={rowSnapshots}
                  lastProcessedRef={lastProcessedRef}
                  ancestorRowSelected={activeIdx != null}
                  tableVersionMap={tableVersionMap}
                  setTableVersionMap={setTableVersionMap}
                  focusPath={focusPath}
                  // progressive wiring (optional)
                  pathKey={`${pathKey}::dt-${mapKey}`}
                  heavyReady={heavyReady}
                  tabsActiveIndexRef={tabsActiveIndexRef}
                  mountedTabsRef={mountedTabsRef}
                  onTabEnter={onTabEnter}
                />
              )}
            </SectionWrapper>
          </Panel>
        </React.Fragment>,
      );
      return;
    }

    /* ────────────────────────────────────────────────────────────────────────
     * Accordion
     * ──────────────────────────────────────────────────────────────────────*/
    if (hasAccordion(item)) {
      flush();
      const group = item;

      // filter visible sections
      const visible = group.accordion.filter((sec) => {
        const hide = sec.hidden;
        return typeof hide === "function" ? !hide(values) : hide !== true;
      });
      if (visible.length === 0) return;

      // Build per-section error counts + find index that contains the current focusPath
      const keys = visible.map(
        (sec, i) => sec.id ?? `${group.header}-sec-${i}`,
      );
      const errorCounts = visible.map((sec) => {
        const flat = flattenForSchema(sec.fields) as any[];
        return flat.reduce((count, fs) => {
          const errObj = getDeepValue(errors, fs.name as string);
          return count + (errObj?.message ? 1 : 0);
        }, 0);
      });

      const indexWithFocus = focusPath
        ? visible.findIndex((sec) => containsFieldPath(sec.fields, focusPath))
        : -1;

      // Decide which sections must be open (forced)
      let forcedOpenKeys: string[] = [];
      if (group.allowMultiple) {
        forcedOpenKeys = keys.filter((_, i) => errorCounts[i] > 0);
        if (indexWithFocus >= 0)
          forcedOpenKeys = Array.from(
            new Set([...forcedOpenKeys, keys[indexWithFocus]]),
          );
      } else {
        const firstErrIdx = errorCounts.findIndex((c) => c > 0);
        const idx2 = indexWithFocus >= 0 ? indexWithFocus : firstErrIdx;
        if (idx2 >= 0) forcedOpenKeys = [keys[idx2]];
      }

      nodes.push(
        <React.Fragment key={`hdr-acc-${idx}`}>
          <Panel
            title={group.header}
            isSubHeader={group.isSubHeader}
            hideShadow
            className={`${!!group.header ? "has-header" : "no-header"}`}
          >
            {group.description && (
              <Description>{group.description}</Description>
            )}

            <SectionWrapper
              className="accordion-wrapper"
              $hasHeader={!!group.header}
            >
              <Accordion
                allowMultiple={group.allowMultiple}
                forcedOpenKeys={forcedOpenKeys}
                items={visible.map((sec, i) => {
                  const secHasError = errorCounts[i] > 0;
                  return {
                    id: keys[i],
                    title: sec.title,
                    rightDetails: secHasError
                      ? [
                          ...(sec.rightDetails ?? []),
                          {
                            value: String(errorCounts[i]),
                            valueColor: "danger",
                          },
                        ]
                      : sec.rightDetails,
                    disabled:
                      typeof sec.disabled === "function"
                        ? sec.disabled(values)
                        : sec.disabled,
                    children: (
                      <RenderSection
                        key={keys[i]}
                        items={sec.fields}
                        errors={errors}
                        onChange={onChange}
                        control={control}
                        z={z}
                        globalDisabled={globalDisabled}
                        originalData={originalData}
                        getValues={getValues}
                        setValue={setValue}
                        trigger={trigger}
                        setError={setError}
                        clearErrors={clearErrors}
                        conditionalKeys={conditionalKeys}
                        activeRowIndexMap={activeRowIndexMap}
                        setActiveRowIndexMap={setActiveRowIndexMap}
                        tableDataMap={tableDataMap}
                        setTableDataMap={setTableDataMap}
                        rowSnapshots={rowSnapshots}
                        lastProcessedRef={lastProcessedRef}
                        ancestorRowSelected={ancestorRowSelected}
                        tableVersionMap={tableVersionMap}
                        setTableVersionMap={setTableVersionMap}
                        focusPath={focusPath}
                        // progressive wiring (optional)
                        pathKey={`${pathKey}::acc-${keys[i]}`}
                        heavyReady={heavyReady}
                        tabsActiveIndexRef={tabsActiveIndexRef}
                        mountedTabsRef={mountedTabsRef}
                        onTabEnter={onTabEnter}
                      />
                    ),
                  };
                })}
              />
            </SectionWrapper>
          </Panel>
        </React.Fragment>,
      );
      return;
    }

    /* ────────────────────────────────────────────────────────────────────────
     * Tabs — keeps local active index & remembers visited; content always rendered,
     * but virtualization + chunking still control per-field mounting/cost.
     * (If you want “render active/visited only”, you can gate with mountedTabsRef/heavyReady.)
     * ──────────────────────────────────────────────────────────────────────*/
    if (hasTabs(item)) {
      flush();
      const group = item as FieldGroup;

      const visibleTabs = group.tabs!.filter((tab) => {
        const hideTab = tab.hidden;
        return typeof hideTab === "function"
          ? !hideTab(values)
          : hideTab !== true;
      });

      if (visibleTabs.length === 0) return;

      const groupKey = `${pathKey}::tabs-${idx}`;

      // prefer focusPath; otherwise use remembered; fallback to 0
      const forcedIndex =
        focusPath != null
          ? firstTabIndexContainingPath(visibleTabs as any, focusPath)
          : -1;

      const remembered = tabsActiveIndexRef.current.get(groupKey) ?? 0;

      const [activeIndex, setActiveIndex] = React.useState<number>(
        forcedIndex >= 0 ? forcedIndex : remembered,
      );

      React.useEffect(() => {
        const next =
          forcedIndex >= 0
            ? forcedIndex
            : tabsActiveIndexRef.current.get(groupKey) ?? 0;
        setActiveIndex(next);
      }, [forcedIndex, groupKey]);

      React.useEffect(() => {
        tabsActiveIndexRef.current.set(groupKey, activeIndex);
        onTabEnter(groupKey, activeIndex);
      }, [groupKey, activeIndex, onTabEnter]);

      nodes.push(
        <React.Fragment key={`hdr-tabs-${idx}`}>
          <Panel
            title={group.header}
            isSubHeader={group.isSubHeader}
            hideShadow
            className={`${!!group.header ? "has-header" : "no-header"}`}
          >
            {group.description && (
              <Description>{group.description}</Description>
            )}

            <SectionWrapper className="tabs-wrapper" $hasHeader={!!group.header}>
              <Tabs
                variant={group?.tabVariant}
                activeTab={activeIndex}
                onTabChange={(nextIdx: number) => {
                  setActiveIndex(nextIdx);
                  tabsActiveIndexRef.current.set(groupKey, nextIdx);
                  onTabEnter(groupKey, nextIdx);
                }}
                tabs={visibleTabs.map((tab, i) => {
                  const errorCount = (
                    flattenForSchema(tab.fields) as any[]
                  ).reduce((count, fs) => {
                    const errObj = getDeepValue(errors, fs.name as string);
                    return count + (errObj?.message ? 1 : 0);
                  }, 0);

                  // Always render content; ChunkedGrid + VirtualizedItem keep it cheap
                  return {
                    title: tab.title,
                    badgeValue: errorCount > 0 ? errorCount : undefined,
                    content: (
                      <RenderSection
                        key={`tab-${idx}-${i}`}
                        items={tab.fields}
                        errors={errors}
                        onChange={onChange}
                        control={control}
                        z={z}
                        globalDisabled={globalDisabled}
                        originalData={originalData}
                        getValues={getValues}
                        setValue={setValue}
                        trigger={trigger}
                        setError={setError}
                        clearErrors={clearErrors}
                        conditionalKeys={conditionalKeys}
                        activeRowIndexMap={activeRowIndexMap}
                        setActiveRowIndexMap={setActiveRowIndexMap}
                        tableDataMap={tableDataMap}
                        setTableDataMap={setTableDataMap}
                        rowSnapshots={rowSnapshots}
                        lastProcessedRef={lastProcessedRef}
                        ancestorRowSelected={ancestorRowSelected}
                        tableVersionMap={tableVersionMap}
                        setTableVersionMap={setTableVersionMap}
                        focusPath={focusPath}
                        // progressive wiring (optional)
                        pathKey={`${groupKey}::tab-${i}`}
                        heavyReady={heavyReady}
                        tabsActiveIndexRef={tabsActiveIndexRef}
                        mountedTabsRef={mountedTabsRef}
                        onTabEnter={onTabEnter}
                      />
                    ),
                  };
                })}
              />
            </SectionWrapper>
          </Panel>
        </React.Fragment>,
      );
      return;
    }

    /* ────────────────────────────────────────────────────────────────────────
     * Group with fields
     * ──────────────────────────────────────────────────────────────────────*/
    if (hasFields(item)) {
      flush();
      const group = item as FieldGroup;
      nodes.push(
        <React.Fragment key={`hdr-${idx}`}>
          <Panel
            title={group.header}
            isSubHeader={group.isSubHeader}
            hideShadow
            className={`${!!group.header ? "has-header" : "no-header"}`}
          >
            {group.description && (
              <Description>{group.description}</Description>
            )}
            <SectionWrapper
              className="fields-wrapper"
              $hasHeader={!!group.header}
            >
              <RenderSection
                items={group.fields!}
                errors={errors}
                onChange={onChange}
                control={control}
                z={z}
                globalDisabled={globalDisabled}
                originalData={originalData}
                getValues={getValues}
                setValue={setValue}
                trigger={trigger}
                setError={setError}
                clearErrors={clearErrors}
                conditionalKeys={conditionalKeys}
                activeRowIndexMap={activeRowIndexMap}
                setActiveRowIndexMap={setActiveRowIndexMap}
                tableDataMap={tableDataMap}
                setTableDataMap={setTableDataMap}
                rowSnapshots={rowSnapshots}
                lastProcessedRef={lastProcessedRef}
                ancestorRowSelected={ancestorRowSelected}
                tableVersionMap={tableVersionMap}
                setTableVersionMap={setTableVersionMap}
                focusPath={focusPath}
                // progressive wiring (optional)
                pathKey={`${pathKey}::group-${idx}`}
                heavyReady={heavyReady}
                tabsActiveIndexRef={tabsActiveIndexRef}
                mountedTabsRef={mountedTabsRef}
                onTabEnter={onTabEnter}
              />
            </SectionWrapper>
          </Panel>
        </React.Fragment>,
      );
      return;
    }

    // simple field → buffer to be flushed in a chunked grid
    const fs = item as FieldSetting;
    const isFieldHidden =
      typeof (fs as any).hidden === "function"
        ? (fs as any).hidden(values)
        : (fs as any).hidden === true;
    if (!isFieldHidden) standalone.push(fs);
  });

  flush();
  return nodes;
});
