// src/organisms/FormRenderer/index.tsx
import React, { forwardRef, useImperativeHandle, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  SettingsItem,
  FieldSetting,
  FormRendererProps,
  FormRendererRef,
  SubmitResult,
  DataTableSection,
} from "./interface";

import {
  flattenForSchema,
  buildSchema,
  getScrollableAncestor,
  getDeepValue,
  setDeepValue,
  hash,
  cssEscape,
  scrollToCenter,
  waitForStableLayout,
  FOCUSABLE_SEL,
  filterVisibleSettings,
  collectAbsoluteLeafFields,
  prefixItems,
  emptyFor,
  collectDataTableContexts,
  hasDataTable,
  toLeafFieldSettings,
  toSummaryItems,
  scheduleIdle,
  cancelIdle
} from "./utils";

import renderSkeletonSection from "./components/Skeleton";

import { ErrorSummary } from "./components/ErrorSummary";
import { RenderSection } from "./components/RenderSection";
import { FormWrapper } from "./styled";
import "./validation";

/* ──────────────────────────────────────────────────────────────────────────────
 * Component: FormRenderer
 * ────────────────────────────────────────────────────────────────────────────*/
export const FormRenderer = forwardRef(
  <T extends Record<string, any>>(
    props: FormRendererProps<T>,
    ref: React.Ref<FormRendererRef<T>>,
  ) => {
    const {
      fieldSettings,
      dataSource,
      onSubmit,
      onChange,
      disabled: globalDisabled = false,
      loading = false,
      stickyHeader = true,
      className = "",
      enableErrorBox = true,
      errorBoxConfig,
    } = props;

    /** ────────────────────────────────────────────────────────────────────────
     * NEW: built-in progressive mount state (no external props)
     *  - heavyReady flips shortly after first paint to allow initial shell
     *  - tabsActiveIndexRef remembers active tab per tabs-group
     *  - mountedTabsRef tracks which tab indices have been mounted already
     * ─────────────────────────────────────────────────────────────────────── */
    const [heavyReady, setHeavyReady] = React.useState(false);
    const idleHandleRef = React.useRef<any>(null);
    React.useEffect(() => {
      idleHandleRef.current = scheduleIdle(() => setHeavyReady(true), 120);
      return () => { if (idleHandleRef.current) cancelIdle(idleHandleRef.current); };
    }, []);

    // Keyed by a stable group key we pass down during render
    const tabsActiveIndexRef = React.useRef<Map<string, number>>(new Map());
    const mountedTabsRef = React.useRef<Map<string, Set<number>>>(new Map());
    const markTabMounted = React.useCallback((groupKey: string, index: number) => {
      let set = mountedTabsRef.current.get(groupKey);
      if (!set) { set = new Set<number>(); mountedTabsRef.current.set(groupKey, set); }
      set.add(index);
      tabsActiveIndexRef.current.set(groupKey, index); // remember last active
    }, []);

    const rowSnapshots = React.useRef<Record<string, any>>({});
    const lastProcessedRef = React.useRef<Record<string, number | null>>({});
    const prevDataHashRef = React.useRef<string>("");
    const lastSubmitHashRef = React.useRef<string | null>(null);
    const [focusPath, setFocusPath] = React.useState<string | null>(null);
    const [summaryTriggered, setSummaryTriggered] = React.useState(false);
    const [summaryOpen, setSummaryOpen] = React.useState(false);

    // Try to focus an input by name, with retries (virtualized content may mount late)
    const focusAfterOpen = React.useCallback((name: string) => {
      const MAX_TRIES = 120; // ~2s at 60fps
      let tries = 0;
      let scrolledOnce = false;

      const attempt = () => {
        tries++;

        const wrapperSel = `[data-field-key="${cssEscape(name)}"]`;
        const inputSel = `[name="${cssEscape(name)}"]`;

        const wrapper = document.querySelector<HTMLElement>(wrapperSel) || null;
        const input =
          document.querySelector<HTMLElement>(inputSel) ||
          (wrapper ? wrapper.querySelector<HTMLElement>(FOCUSABLE_SEL) : null);

        // If we can see the wrapper but not the input yet, center once to help mount virtualized content.
        if (wrapper && !scrolledOnce) {
          const container = getScrollableAncestor(wrapper);
          scrollToCenter(wrapper, container);
          scrolledOnce = true;
        }

        if (input) {
          const target = wrapper ?? input;
          const container = getScrollableAncestor(target);
          void waitForStableLayout(container, 2, 45).then(() => {
            scrollToCenter(target, container);
            // Double RAF ensures scroll & layout are committed before focusing
            requestAnimationFrame(() =>
              requestAnimationFrame(() => {
                (input as HTMLElement).focus?.({ preventScroll: true } as any);
              }),
            );
          });
          return;
        }

        if (tries < MAX_TRIES) {
          requestAnimationFrame(attempt);
        }
      };

      requestAnimationFrame(attempt);
    }, []);

    const initialTableMap: Record<string, any[]> = {};
    fieldSettings.forEach((item) => {
      if ((item as any).dataTable) {
        const key = (item as any).dataTable.config.dataSource;
        initialTableMap[key] = getDeepValue(dataSource, key) || [];
      }
    });

    const [tableDataMap, setTableDataMap] = React.useState(initialTableMap);
    const [activeRowIndexMap, setActiveRowIndexMap] = React.useState<
      Record<string, number | null>
    >({});
    const [tableVersionMap, setTableVersionMap] = React.useState<
      Record<string, number>
    >({});
    const [summaryPulseKey, setSummaryPulseKey] = React.useState(0);

    const baseSchema = buildSchema(flattenForSchema(fieldSettings), dataSource);
    type FormData = z.infer<typeof baseSchema>;

    /** Dynamic resolver with narrow-by-changed-names optimization */
    const dynamicResolver: Resolver<FormData> = async (
      values,
      context,
      options,
    ) => {
      const changed = options?.names ? Array.from(options.names) : null;

      // Work on the visibility-pruned tree
      const visibleSettings = filterVisibleSettings(fieldSettings, values);

      const collectFor = (settings: SettingsItem[]) =>
        flattenForSchema(settings) as Array<FieldSetting & { name: string }>;

      const allFlatTop = collectFor(visibleSettings);

      let itemsForSchema: SettingsItem[] = [];

      if (changed && changed.length) {
        // Intersect top-level non-table fields
        const intersectTop = allFlatTop
          .filter((fs) => !(fs as any).dataTable)
          .filter((fs) =>
            changed.some(
              (n) =>
                n === fs.name ||
                n.startsWith(fs.name + ".") ||
                fs.name.startsWith(n + "."),
            ),
          );
        if (intersectTop.length) itemsForSchema.push(...intersectTop);

        // Table contexts: include only related (visible) fields
        const contexts = collectDataTableContexts(
          values as any,
          visibleSettings,
        );
        for (const ctx of contexts) {
          const leafFS = toLeafFieldSettings(ctx.fields);
          const relatedChanged = changed.filter(
            (n) => n === ctx.tableKey || n.startsWith(ctx.tableKey + "."),
          );
          if (relatedChanged.length === 0) continue;

          const rowIndex = activeRowIndexMap[ctx.tableKey];
          if (rowIndex != null)
            itemsForSchema.push(
              ...prefixItems(leafFS, `${ctx.tableKey}.${rowIndex}`),
            );

          const hasDraft = leafFS.some((fs) => {
            const v = getDeepValue(values, `${ctx.tableKey}.${fs.name}`);
            return (
              v != null && v !== "" && !(typeof v === "boolean" && v === false)
            );
          });
          if (hasDraft)
            itemsForSchema.push(...prefixItems(leafFS, ctx.tableKey));
        }

        if (itemsForSchema.length === 0) {
          itemsForSchema = visibleSettings.filter((s) =>
            collectFor([s]).some((fs) =>
              changed.some(
                (n) =>
                  n === fs.name ||
                  n.startsWith(fs.name + ".") ||
                  fs.name.startsWith(n + "."),
              ),
            ),
          );
        }
      } else {
        // Submit / programmatic triggers → full visible behavior
        visibleSettings.forEach((item) => {
          if (!(item as any).dataTable) itemsForSchema.push(item);
        });

        const contexts = collectDataTableContexts(
          values as any,
          visibleSettings,
        );
        for (const ctx of contexts) {
          const leafFS = toLeafFieldSettings(ctx.fields);

          const hasDraft = leafFS.some((fs) => {
            const v = getDeepValue(values, `${ctx.tableKey}.${fs.name}`);
            return (
              v != null && v !== "" && !(typeof v === "boolean" && v === false)
            );
          });
          if (hasDraft)
            itemsForSchema.push(...prefixItems(ctx.fields, ctx.tableKey));

          const rowIndex = activeRowIndexMap[ctx.tableKey];
          if (rowIndex != null)
            itemsForSchema.push(
              ...prefixItems(ctx.fields, `${ctx.tableKey}.${rowIndex}`),
            );
        }
      }

      const flatFields = flattenForSchema(itemsForSchema);
      const schema = buildSchema(flatFields, values);
      return zodResolver(schema)(values, context, options);
    };

    // Build complete defaultValues so getValues() is never {}
    const initialDefaults = React.useMemo(() => {
      const leaves = collectAbsoluteLeafFields(fieldSettings);
      let base: any = {};
      for (const { name, fs } of leaves) {
        const fromData = getDeepValue(dataSource as any, name);
        const seeded = fromData !== undefined ? fromData : emptyFor(fs as any);
        base = setDeepValue(base, name, seeded);
      }
      // Ensure table arrays exist
      fieldSettings.forEach((item) => {
        if ((item as any).dataTable) {
          const key = (item as any).dataTable.config.dataSource;
          const rows = getDeepValue(dataSource, key);
          if (!Array.isArray(getDeepValue(base, key))) {
            base = setDeepValue(base, key, Array.isArray(rows) ? rows : []);
          }
        }
      });
      return base;
    }, [fieldSettings, dataSource]);

    const {
      control,
      handleSubmit,
      getValues,
      setValue,
      trigger,
      setError,
      clearErrors,
      formState: { errors },
      reset,
      register,
    } = useForm<FormData>({
      defaultValues: initialDefaults as any,
      resolver: dynamicResolver,
      mode: "onChange",
      reValidateMode: "onChange",
      shouldUnregister: false, // keep state even if never mounted
    });

    // Pre-register *all* absolute names so submit works even if nothing mounted yet.
    React.useLayoutEffect(() => {
      const leaves = collectAbsoluteLeafFields(fieldSettings);
      // Seed any missing values (in case dataSource changed) and register the names
      for (const { name, fs } of leaves) {
        const current = getDeepValue(getValues() as any, name);
        if (current === undefined) {
          const seeded =
            getDeepValue(dataSource as any, name) ?? emptyFor(fs as any);
          setValue(name as any, seeded, {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: false,
          });
        }
        try {
          register(name as any);
        } catch {}
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fieldSettings, dataSource]); // register is stable inside RHF; omit from deps on purpose

    // Compute the hashed payload using given base values and a table map.
    // Avoids async setState races by not reading tableDataMap from state.
    const hashWithTableMap = React.useCallback(
      (baseValues: any, tmap: Record<string, any[]>) => {
        let full = { ...baseValues };
        for (const [path, rows] of Object.entries(tmap)) {
          full = setDeepValue(full, path, rows);
        }
        return hash(full);
      },
      [],
    );

    React.useEffect(() => {
      const nextHash = hash(dataSource ?? {});
      if (nextHash === prevDataHashRef.current) return;
      prevDataHashRef.current = nextHash;

      // a) reset RHF values from fully seeded defaults
      reset(initialDefaults as any, {
        keepErrors: true,
        keepDirty: true,
        keepTouched: true,
        keepSubmitCount: false,
      });

      // b) rebuild table data map from fresh data (unchanged)
      const nextTableMap: Record<string, any[]> = {};
      fieldSettings.forEach((item) => {
        if ((item as any).dataTable) {
          const key = (item as any).dataTable.config.dataSource;
          nextTableMap[key] = getDeepValue(dataSource, key) || [];
        }
      });
      setTableDataMap(nextTableMap);

      // c) clear selections/snapshots and force DataTable re-render (unchanged)
      setActiveRowIndexMap({});
      rowSnapshots.current = {};
      lastProcessedRef.current = {};
      setTableVersionMap((m) => {
        const bumped: Record<string, number> = {};
        Object.keys(nextTableMap).forEach((k) => (bumped[k] = (m[k] ?? 0) + 1));
        return { ...m, ...bumped };
      });

      // d) NEW: pre-seed the "last submitted" hash to the baseline
      // so first submit is only "updated: true" if user actually changed something.
      lastSubmitHashRef.current = hashWithTableMap(initialDefaults as any, nextTableMap);
    }, [dataSource, fieldSettings, reset, initialDefaults, hashWithTableMap]);

    React.useEffect(() => {
      if (!focusPath) return;
      // allow Tabs/Accordion to open in the same paint, then focus
      const id = requestAnimationFrame(() => focusAfterOpen(focusPath));
      return () => cancelAnimationFrame(id);
    }, [focusPath, focusAfterOpen]);

    const getAllFieldNames = React.useCallback(() => {
      const vals = getValues();
      const visible = filterVisibleSettings(fieldSettings, vals);

      const names: string[] = [];
      const leaves = collectAbsoluteLeafFields(visible);
      for (const l of leaves) names.push(l.name);

      const contexts = collectDataTableContexts(vals as any, visible);
      for (const ctx of contexts) {
        const idx = activeRowIndexMap?.[ctx.tableKey] ?? null;
        if (idx != null) {
          const leafs = toLeafFieldSettings(ctx.fields as any);
          for (const lf of leafs)
            names.push(`${ctx.tableKey}.${idx}.${lf.name}`);
        }
      }
      return names;
    }, [fieldSettings, activeRowIndexMap, getValues]);

    // Ensure RHF knows every field name up front (even if never mounted yet)
    React.useEffect(() => {
      const leaves = collectAbsoluteLeafFields(fieldSettings);
      const curr = getValues() as Record<string, any>;

      for (const { name, fs } of leaves) {
        // If form state doesn't have a value yet, seed from dataSource or sensible empty
        const hasValue = getDeepValue(curr, name) !== undefined;
        if (!hasValue) {
          const seeded =
            getDeepValue(dataSource as any, name) ?? emptyFor(fs as any); // '' for text/number, false for boolean
          setValue(name as any, seeded, {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: false,
          });
        }

        // Pre-register so resolver can attach errors on submit even if the field never mounted
        try {
          register(name as any);
        } catch {
          // No-op
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fieldSettings, dataSource, getValues, setValue]);

    const conditionalKeys = useMemo(
      () =>
        flattenForSchema(fieldSettings)
          .filter((fs: any) => fs.validation?.length === 2)
          .map((fs: any) => fs.name!),
      [fieldSettings],
    );

    // Scoped reactivity at parent (optional; main subscription is inside RenderSection)
    useWatch({ control, name: conditionalKeys });

    // Subscribe to visibility drivers
    const _condWatch = useWatch({ control, name: conditionalKeys });

    // Prevent loops: only run when the *visible name set* truly changes
    const lastVisibleHashRef = React.useRef<string>("");

    // When visibility changes, clear errors for fields that are now hidden
    React.useEffect(() => {
      // 1) Compute current visible leaf names (pruned by visibility)
      const vals = getValues(); // ok to read without being a dep
      const visibleNames = collectAbsoluteLeafFields(
        filterVisibleSettings(fieldSettings, vals),
      ).map((x) => x.name);

      // 2) Stable hash to detect real visibility changes
      // Stable, order-agnostic; avoids in-place mutation
      const visibleHash = [...visibleNames]
        .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
        .join("|");

      if (visibleHash === lastVisibleHashRef.current) return; // nothing changed → bail

      // 3) Compute hidden names vs. the full leaf set
      const allNames = collectAbsoluteLeafFields(fieldSettings).map(
        (x) => x.name,
      );
      const visSet = new Set(visibleNames);
      const hiddenNow = allNames.filter((n) => !visSet.has(n));

      // 4) Only clear if those hidden fields actually have errors
      if (hiddenNow.length) {
        const hasErr = (name: string) => !!getDeepValue(errors as any, name);
        const toClear = hiddenNow.filter(hasErr);
        if (toClear.length) clearErrors(toClear as any);
      }

      // 5) Remember the last visible set
      lastVisibleHashRef.current = visibleHash;
      // eslint-disable-next-line react-hooks/exhaustive-comments
    }, [_condWatch, fieldSettings]); // intentionally minimal deps

    const buildFullPayload = (): T => {
      const formValues = getValues() as any;
      let full = { ...formValues };
      Object.entries(tableDataMap).forEach(([path, rows]) => {
        full = setDeepValue(full, path, rows);
      });
      return full as T;
    };

    // Resets RHF values + table state back to props.dataSource with minimal churn
    const resetToDataSource = React.useCallback(() => {
      reset(initialDefaults as any);

      const nextTableMap: Record<string, any[]> = {};
      fieldSettings.forEach((item) => {
        if ((item as any).dataTable) {
          const key = (item as any).dataTable.config.dataSource;
          nextTableMap[key] = getDeepValue(dataSource, key) || [];
        }
      });

      setTableDataMap(nextTableMap);

      lastSubmitHashRef.current = hashWithTableMap(initialDefaults as any, nextTableMap);

      setActiveRowIndexMap({});
      rowSnapshots.current = {};
      lastProcessedRef.current = {};
      setTableVersionMap((m) => {
        const bumped: Record<string, number> = {};
        Object.keys(nextTableMap).forEach((k) => (bumped[k] = (m[k] ?? 0) + 1));
        return { ...m, ...bumped };
      });

      clearErrors();
      setSummaryOpen(false);
      setSummaryTriggered(false);
      setFocusPath(null);
    }, [
      reset,
      initialDefaults,
      fieldSettings,
      dataSource,
      setTableDataMap,
      setActiveRowIndexMap,
      setTableVersionMap,
      clearErrors,
    ]);

    useImperativeHandle(
      ref,
      () => ({
        submit: async () => {
          const finish = (
            valid: boolean,
            invalidFields: SubmitResult<T>["invalidFields"],
          ) => {
            const payload = buildFullPayload();
            const h = hash(payload);
            const updated =
              lastSubmitHashRef.current === null ||
              lastSubmitHashRef.current !== h;
            lastSubmitHashRef.current = h;

            const res: SubmitResult<T> = {
              valid,
              values: payload,
              invalidFields,
              updated,
            };
            onSubmit?.(res);
            return res;
          };

          const valsNow = getValues();
          const visibleNow = filterVisibleSettings(fieldSettings, valsNow);
          const visibleCtx = collectDataTableContexts(
            valsNow as any,
            visibleNow,
          );
          const visibleTableKeys = new Set(visibleCtx.map((c) => c.tableKey));

          // 0) Validate all known names
          const allNames = getAllFieldNames();
          const allOk = await trigger(allNames as any, { shouldFocus: true });

          if (!allOk) {
            // Wrap handleSubmit to resolve with the result
            return await new Promise<SubmitResult<T>>((resolve) => {
              handleSubmit(
                () => {
                  setSummaryOpen(false);
                  setSummaryTriggered(false);
                  resolve(finish(true, []));
                },
                (errs) => {
                  const invalid: SubmitResult<T>["invalidFields"] = [];
                  const curr = getValues() as any;
                  const walk = (path: string, node: any) => {
                    if (node?.message) {
                      const value = path
                        .split(".")
                        .reduce((a: any, k: string) => a?.[k], curr);
                      invalid.push({ field: path, error: node.message, value });
                    } else if (typeof node === "object") {
                      Object.entries(node).forEach(([k, v]) =>
                        walk(path ? `${path}.${k}` : k, v),
                      );
                    }
                  };
                  Object.entries(errs).forEach(([k, v]) => walk(k, v));

                  if (invalid.length) {
                    const firstField = invalid[0].field;
                    setFocusPath(firstField);
                    setSummaryTriggered(true);
                    setSummaryPulseKey((k) => k + 1);
                    requestAnimationFrame(() =>
                      requestAnimationFrame(() => focusAfterOpen(firstField)),
                    );
                    requestAnimationFrame(() =>
                      requestAnimationFrame(() => setFocusPath(null)),
                    );
                  }

                  resolve(finish(false, invalid));
                },
              )();
            });
          }

          // 1) DataTable validations (active row, then drafts)
          for (const item of fieldSettings.filter(hasDataTable)) {
            const dt = (item as { dataTable: DataTableSection }).dataTable;
            const tableKey = dt.config.dataSource;
            if (!visibleTableKeys.has(tableKey)) continue;

            const leafFS = toLeafFieldSettings(dt.fields as any);
            const activeIdx = activeRowIndexMap?.[tableKey] ?? null;

            if (activeIdx != null) {
              clearErrors(`${tableKey}`);

              let rowValuesRel: Record<string, any> = {};
              leafFS.forEach((fs) => {
                const abs = `${tableKey}.${activeIdx}.${fs.name}`;
                const v = getDeepValue(getValues(), abs);
                rowValuesRel = setDeepValue(rowValuesRel, fs.name, v);
              });

              let ctx = { ...getValues(), ...rowValuesRel };
              for (const [relKey, v] of Object.entries(rowValuesRel)) {
                ctx = setDeepValue(
                  ctx,
                  `${tableKey}.${activeIdx}.${relKey}`,
                  v,
                );
              }

              const rowSchema = buildSchema(leafFS, ctx);
              const result = await rowSchema.safeParseAsync(rowValuesRel);

              if (!result.success) {
                const invalid = result.error.errors.map((err) => {
                  const relPath = Array.isArray(err.path)
                    ? err.path.join(".")
                    : String(err.path ?? "");
                  const absPath = `${tableKey}.${activeIdx}.${relPath}`;
                  const value = getDeepValue(rowValuesRel, relPath);
                  setError(absPath as any, {
                    type: "manual",
                    message: err.message,
                  });
                  return { field: absPath, error: err.message, value };
                });

                const first = invalid[0]?.field;
                if (first) {
                  setFocusPath(first);
                  setSummaryTriggered(true);
                  setSummaryPulseKey((k) => k + 1);
                  requestAnimationFrame(() =>
                    requestAnimationFrame(() => focusAfterOpen(first)),
                  );
                  requestAnimationFrame(() =>
                    requestAnimationFrame(() => setFocusPath(null)),
                  );
                }

                return finish(false, invalid);
              }
              continue;
            }

            // Draft (no active row)
            let draftValues: Record<string, any> = {};
            let hasDraftValue = false;
            leafFS.forEach((fs) => {
              const val = getDeepValue(getValues(), `${tableKey}.${fs.name}`);
              draftValues = setDeepValue(draftValues, fs.name!, val);
              if (
                val != null &&
                val !== "" &&
                !(typeof val === "boolean" && val === false)
              )
                hasDraftValue = true;
            });
            if (!hasDraftValue) continue;

            const draftSchema = buildSchema(leafFS, draftValues);
            const result = await draftSchema.safeParseAsync(draftValues);

            if (!result.success) {
              const invalid = result.error.errors.map((err) => {
                const relPath = Array.isArray(err.path)
                  ? err.path.join(".")
                  : String(err.path ?? "");
                return {
                  field: `${tableKey}.${relPath}`,
                  error: err.message,
                  value: getDeepValue(draftValues, relPath),
                };
              });

              result.error.errors.forEach((err) => {
                const relPath = Array.isArray(err.path)
                  ? err.path.join(".")
                  : String(err.path ?? "");
                setError(`${tableKey}.${relPath}` as any, {
                  type: "manual",
                  message: err.message,
                });
              });

              const firstRel = Array.isArray(result.error.errors[0].path)
                ? result.error.errors[0].path.join(".")
                : String(result.error.errors[0].path ?? "");
              const el = document.querySelector<HTMLElement>(
                `[name="${tableKey}.${firstRel}"]`,
              );
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
              el?.focus();

              setSummaryTriggered(true);
              setSummaryPulseKey((k) => k + 1);
              return finish(false, invalid);
            }
          }

          // 2) Final submit through RHF
          return await new Promise<SubmitResult<T>>((resolve) => {
            handleSubmit(
              () => {
                setSummaryOpen(false);
                setSummaryTriggered(false);
                resolve(finish(true, []));
              },
              (errs) => {
                const invalid: SubmitResult<T>["invalidFields"] = [];
                const curr = getValues() as any;
                const traverse = (path: string, node: any) => {
                  if (node?.message) {
                    const value = path
                      .split(".")
                      .reduce((a: any, k: string) => a?.[k], curr);
                    invalid.push({ field: path, error: node.message, value });
                  } else if (typeof node === "object") {
                    Object.entries(node).forEach(([k, v]) =>
                      traverse(path ? `${path}.${k}` : k, v),
                    );
                  }
                };
                Object.entries(errs).forEach(([k, v]) => traverse(k, v));
                if (invalid.length) {
                  const firstField = invalid[0].field;
                  setFocusPath(firstField);
                  setSummaryTriggered(true);
                  setSummaryPulseKey((k) => k + 1);
                  requestAnimationFrame(() =>
                    requestAnimationFrame(() => focusAfterOpen(firstField)),
                  );
                  requestAnimationFrame(() =>
                    requestAnimationFrame(() => setFocusPath(null)),
                  );
                }
                resolve(finish(false, invalid));
              },
            )();
          });
        },
        getValues: () => getValues() as T,
        reset: resetToDataSource,
      }),
      [
        handleSubmit,
        onSubmit,
        getValues,
        activeRowIndexMap,
        tableDataMap,
        trigger,
        setError,
        resetToDataSource
      ],
    );

    const handleChange = () => onChange?.(getValues() as T);

    return (
      <FormWrapper
        className={`form-wrapper ${className}`}
        onSubmit={(e) => e.preventDefault()}
        $stickyHeader={stickyHeader}
      >
        {loading ? (
          renderSkeletonSection(fieldSettings, getValues())
        ) : (
          <RenderSection
            /** NEW: built-in progressive controls */
            pathKey="root"
            heavyReady={heavyReady}
            tabsActiveIndexRef={tabsActiveIndexRef}
            mountedTabsRef={mountedTabsRef}
            onTabEnter={markTabMounted}
            /** existing props */
            items={fieldSettings}
            errors={errors}
            onChange={handleChange}
            control={control}
            z={z}
            globalDisabled={globalDisabled}
            originalData={dataSource}
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
            ancestorRowSelected={null}
            tableVersionMap={tableVersionMap}
            setTableVersionMap={setTableVersionMap}
            focusPath={focusPath}
          />
        )}

        {(() => {
          const items = summaryTriggered
            ? toSummaryItems(errors, getValues)
            : [];
          return summaryTriggered && items.length > 0 && enableErrorBox ? (
            <ErrorSummary
              visible={summaryTriggered}
              open={summaryOpen}
              items={items}
              onToggle={(open) => setSummaryOpen(open)}
              bottomOffset={errorBoxConfig?.bottomOffset}
              title={errorBoxConfig?.title}
              width={errorBoxConfig?.width}
              onItemClick={(fieldPath) => {
                setFocusPath(fieldPath);
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => {
                    focusAfterOpen(fieldPath);
                    setFocusPath(null);
                  }),
                );
              }}
              pulseKey={summaryPulseKey}
            />
          ) : null;
        })()}
      </FormWrapper>
    );
  },
);
