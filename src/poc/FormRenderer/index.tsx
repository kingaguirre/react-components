// src/poc/Form/index.tsx
import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import { useForm, Controller, UseFormSetError, UseFormClearErrors, useWatch } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  SettingsItem, FieldGroup, FieldSetting, AccordionSection,
  FormRendererProps, FormRendererRef, SubmitResult, DataTableSection,
} from './interface';

import {
  flattenForSchema, buildSchema, isZodRequired, resolveDisabled,
  getDeepValue, setDeepValue
} from './utils';

import FieldErrorBoundary from './components/FieldErrorBoundary';
import VirtualizedItem from './components/VirtualizedItem';
import renderSkeletonSection from './components/Skeleton';

import { FormControl } from '../../atoms/FormControl';
import { DatePicker } from '../../molecules/DatePicker';
import { Panel } from '../../molecules/Panel';
import { Dropdown } from '../../molecules/Dropdown';
import { Grid, GridItem } from '../../atoms/Grid';
import { Tabs } from '../../organisms/Tabs';
import { Accordion } from '../../molecules/Accordion';
import { DataTable } from '../../organisms/DataTable';
import { Button } from '../../atoms/Button';

import {
  FormWrapper, Description,
  SectionWrapper, ButtonContainer
} from './styled';

import './validation';

/** ───────── small util: debounce ───────── */
const debounce = <F extends (...args: any[]) => void>(fn: F, ms = 150) => {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

// ───────── Type guards ─────────
const isFieldGroup = (item: SettingsItem): item is FieldGroup =>
  ('fields' in item && Array.isArray(item.fields)) ||
  ('tabs' in item && Array.isArray(item.tabs)) ||
  ('accordion' in item && Array.isArray(item.accordion));
const hasAccordion = (item: SettingsItem): item is FieldGroup & { accordion: AccordionSection[] } =>
  isFieldGroup(item) && Array.isArray(item.accordion) && item.accordion.length > 0;
const hasTabs = (item: SettingsItem): item is FieldGroup =>
  isFieldGroup(item) && Array.isArray(item.tabs) && item.tabs.length > 0;
const hasFields = (item: SettingsItem): item is FieldGroup =>
  isFieldGroup(item) && Array.isArray(item.fields) && item.fields.length > 0;
const hasDataTable = (item: SettingsItem): item is { dataTable: DataTableSection } =>
  Boolean((item as any).dataTable);

const toLeafFieldSettings = (items: SettingsItem[]) => {
  const flat = (flattenForSchema(items) as any[])
    .filter((fs: any) => typeof fs?.name === 'string') as Array<FieldSetting & { name: string }>;
  return flat.filter(fs => !flat.some(other => other !== fs && other.name.startsWith(fs.name + '.')));
};

// ───────── Helpers ─────────
function prefixItems(items: SettingsItem[], path: string): SettingsItem[] {
  const cleanPath = path.replace(/\.(?:null|undefined)$/, '');
  return items.map(item => {
    if ('dataTable' in item && item.dataTable) {
      const dt = item.dataTable;
      return {
        ...item,
        dataTable: {
          ...dt,
          config: { ...dt.config, dataSource: `${cleanPath}.${dt.config.dataSource}` },
          fields: dt.fields,
        },
      };
    }
    if ('fields' in item && Array.isArray(item.fields)) {
      return { ...(item as FieldGroup), fields: prefixItems(item.fields, cleanPath) };
    }
    if ('accordion' in item && Array.isArray((item as any).accordion)) {
      const grp = item as FieldGroup & { accordion: AccordionSection[] };
      return { ...grp, accordion: grp.accordion.map(sec => ({ ...sec, fields: prefixItems(sec.fields, cleanPath) })) };
    }
    if ('tabs' in item && Array.isArray((item as any).tabs)) {
      const grp = item as FieldGroup & { tabs: { title: string; fields: SettingsItem[] }[] };
      return { ...grp, tabs: grp.tabs.map(tab => ({ ...tab, fields: prefixItems(tab.fields, cleanPath) })) };
    }
    const fs = item as FieldSetting;
    return { ...fs, name: `${cleanPath}.${fs.name}` };
  });
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function shiftNestedTableKeys(map: Record<string, any[]>, baseKey: string, startIndex: number, delta: number) {
  const next: Record<string, any[]> = { ...map };
  const re = new RegExp(`^${escapeRegExp(baseKey)}\\.(\\d+)\\.`);
  const keys = Object.keys(next).sort((a, b) => (delta > 0 ? b.localeCompare(a) : a.localeCompare(b)));
  for (const k of keys) {
    const m = k.match(re);
    if (!m) continue;
    if (Number(m[1]) < startIndex) continue;
    const idx = Number(m[1]);
    const newKey = k.replace(re, `${baseKey}.${idx + delta}.`);
    next[newKey] = next[k];
    delete next[k];
  }
  return next;
}

function dropNestedKeysForIndex(map: Record<string, any[]>, baseKey: string, index: number) {
  const next: Record<string, any[]> = { ...map };
  const re = new RegExp(`^${escapeRegExp(baseKey)}\\.${index}\\.`);
  Object.keys(next).forEach(k => { if (re.test(k)) delete next[k]; });
  return next;
}

const isBooleanControl = (fs: any) =>
  fs.type === 'switch' || fs.type === 'checkbox' || fs.type === 'radio';

function normalizeByType(fs: FieldSetting & { name: string }, v: any) {
  if (fs.type === 'date' && v instanceof Date) return v.toISOString();
  if (fs.type === 'number') {
    if (v === '' || v == null) return undefined;
    if (typeof v === 'string') return v.trim() === '' ? undefined : Number(v);
  }
  return v;
}

function coerceChangeValue(fs: FieldSetting & { name: string }, v: any) {
  if (v && typeof v === 'object' && 'target' in v) {
    const t: any = (v as any).target;
    if (isBooleanControl(fs)) return !!t?.checked;
    if (t?.value !== undefined) return t.value; // preserve '' for clear
    return undefined;
  }
  if (fs.type === 'dropdown') {
    if (Array.isArray(v)) return v.map(opt => (opt && typeof opt === 'object' && 'value' in opt) ? (opt as any).value : opt);
    if (v && typeof v === 'object' && 'value' in v) return (v as any).value;
    return v ?? '';
  }
  if (fs.type === 'date' && v instanceof Date) return v;
  return v;
}

// For reseed when value is missing in row
function emptyFor(fs: FieldSetting & { name: string }) {
  if (isBooleanControl(fs)) return false;
  if (fs.type === 'number') return '';
  return '';
}

// Discover every DataTable instance in the current form values, including nested ones.
function collectDataTableContexts(
  values: Record<string, any>,
  items: SettingsItem[],
  basePath = ''
): Array<{ tableKey: string; fields: SettingsItem[] }> {
  const contexts: Array<{ tableKey: string; fields: SettingsItem[] }> = [];
  const prefix = (p: string) => (basePath ? `${basePath}.${p}` : p);

  for (const it of items) {
    const anyIt = it as any;

    if (anyIt?.dataTable?.config?.dataSource) {
      const absKey = prefix(anyIt.dataTable.config.dataSource);

      // This table instance (draft context)
      contexts.push({ tableKey: absKey, fields: anyIt.dataTable.fields });

      // Descend into each existing row to discover nested table instances
      const rows = getDeepValue(values, absKey);
      if (Array.isArray(rows)) {
        for (let i = 0; i < rows.length; i++) {
          contexts.push(
            ...collectDataTableContexts(values, anyIt.dataTable.fields, `${absKey}.${i}`)
          );
        }
      }
      continue;
    }

    if (Array.isArray(anyIt.fields)) {
      contexts.push(...collectDataTableContexts(values, anyIt.fields, basePath));
    }
    if (Array.isArray(anyIt.accordion)) {
      for (const sec of anyIt.accordion) {
        contexts.push(...collectDataTableContexts(values, sec.fields, basePath));
      }
    }
    if (Array.isArray(anyIt.tabs)) {
      for (const tab of anyIt.tabs) {
        contexts.push(...collectDataTableContexts(values, tab.fields, basePath));
      }
    }
  }

  return contexts;
}

/* ──────────────────────────────────────────────────────────────────────────────
 * RenderSection as a memoized component (subscribes to visible/draft names)
 * ────────────────────────────────────────────────────────────────────────────*/
type RenderSectionProps = {
  items: SettingsItem[];
  errors: any;
  onChange: () => void;
  control: any;
  z: typeof import('zod') | any;
  globalDisabled: boolean;
  originalData: Record<string, any>;
  getValues: () => Record<string, any>;
  setValue: (name: string, value: any, opts?: any) => void;
  trigger: (name?: string | string[], opts?: any) => Promise<boolean>;
  setError: UseFormSetError<any>;
  clearErrors: UseFormClearErrors<any>;
  conditionalKeys: string[];
  activeRowIndexMap: Record<string, number | null>;
  setActiveRowIndexMap: React.Dispatch<React.SetStateAction<Record<string, number | null>>>;
  tableDataMap: Record<string, any[]>;
  setTableDataMap: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  rowSnapshots: React.MutableRefObject<Record<string, any>>;
  lastProcessedRef: React.MutableRefObject<Record<string, number | null>>;
  ancestorRowSelected?: boolean | null;
  tableVersionMap?: Record<string, number>;
  setTableVersionMap?: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};

const RenderSection = React.memo(function RenderSection(props: RenderSectionProps) {
  const {
    items, errors, onChange, control, z, globalDisabled, originalData,
    getValues, setValue, trigger, setError, clearErrors, conditionalKeys,
    activeRowIndexMap, setActiveRowIndexMap, tableDataMap, setTableDataMap,
    rowSnapshots, lastProcessedRef, ancestorRowSelected = null, tableVersionMap, setTableVersionMap,
  } = props;

  /** Build the list of field names this section renders, including DataTable DRAFT names. */
  const namesToWatch = useMemo(() => {
    const names: string[] = [];

    const walk = (nodes: SettingsItem[], basePath = '') => {
      for (const it of nodes) {
        if (hasDataTable(it)) {
          const mapKey = (it as any).dataTable.config.dataSource;
          const leafs = toLeafFieldSettings((it as any).dataTable.fields);
          for (const lf of leafs) names.push(`${basePath ? basePath + '.' : ''}${mapKey}.${lf.name}`); // DRAFT inputs
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
        if (typeof fs?.name === 'string') names.push(`${basePath ? basePath + '.' : ''}${fs.name}`);
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
  const flushTriggers = React.useCallback((names: string[]) => {
    void trigger(names);
    pendingNamesRef.current.clear();
  }, [trigger]);
  const debouncedFlush = React.useMemo(() => debounce(flushTriggers, 150), [flushTriggers]);
  const queueTriggers = React.useCallback((names: string[]) => {
    const set = pendingNamesRef.current;
    for (const n of names) set.add(n);
    debouncedFlush(Array.from(set));
  }, [debouncedFlush]);

  const flush = () => {
    if (!standalone.length) return;
    nodes.push(
      <SectionWrapper className='fields-wrapper' key={`flush-${flushCount++}`}>
        <Grid>
          {standalone.map((fs: any) => {
            const key = fs.name!;
            const err = getDeepValue(errors, key)?.message;
            const schemaForRequired = fs.validation ? fs.validation(z, values) : z.any();
            const isReq = isZodRequired(schemaForRequired);

            return (
              <GridItem key={key} xs={fs.col?.xs ?? 12} sm={fs.col?.sm ?? 6} md={fs.col?.md ?? 4} lg={fs.col?.lg ?? 3}>
                <VirtualizedItem fieldKey={key}>
                  <FieldErrorBoundary label={fs.label}>
                    <Controller
                      name={key as any}
                      control={control}
                      shouldUnregister={false}
                      defaultValue={getDeepValue(getValues(), key) ?? (isBooleanControl(fs) ? false : '')}
                      render={({ field, fieldState }) => {
                        const errorMsg = fieldState.error?.message ?? err;

                        // Controlled display value
                        let displayValue: any = field.value;
                        if (!isBooleanControl(fs) && fs.type !== 'number') {
                          if (displayValue === undefined || displayValue === null) displayValue = '';
                        } else if (fs.type === 'number') {
                          displayValue = (typeof displayValue === 'number' && !isNaN(displayValue)) ? displayValue : '';
                        }

                        const wrapped = (raw: any) => {
                          let next = coerceChangeValue(fs as any, raw);

                          // ✅ Number clearing: if user clears the input, keep '' in form state.
                          // This prevents RHF/controlled value from snapping back to the previous number.
                          const isClearedNumber =
                            fs.type === 'number' && (next === '' || next === null || (typeof next === 'number' && Number.isNaN(next)));

                          if (!isClearedNumber) {
                            next = normalizeByType(fs as any, next);
                          } else {
                            next = ''; // keep as empty string during editing
                          }

                          // Ensure text-like empties are preserved as ''
                          if (!isBooleanControl(fs) && fs.type !== 'number' && (next === undefined || next === null)) next = '';

                          const inAnyTable = Object.keys(tableDataMap).some(tableKey => key.startsWith(`${tableKey}.`));

                          if (inAnyTable) {
                            setValue(key as any, next, { shouldDirty: true, shouldTouch: true, shouldValidate: false });
                            // Debounced single-cell validation so errors clear while typing
                            queueTriggers([key]);
                            return;
                          }

                          setValue(key as any, next, { shouldDirty: true, shouldTouch: true, shouldValidate: false });
                          onChange();

                          // Debounced validation for this field + conditional dependencies
                          queueTriggers([key, ...conditionalKeys]);
                        };


                        const handleBlur = () => {
                          // On blur, ensure we at least validate the current field immediately
                          // (use a direct trigger to avoid waiting for the debounce timer)
                          void trigger(key as any);
                        };

                        const testId = `${fs.type ?? 'text'}-${key.replace(/\./g, '-')}`;

                        const common: any = {
                          ...field,
                          name: key,
                          testId,
                          'data-testid': testId,
                          ...(isBooleanControl(fs) ? { checked: !!field.value } : { value: displayValue }),
                          onChange: wrapped,
                          onBlur: handleBlur,
                          label: fs.label,
                          placeholder: fs.placeholder,
                          helpText: errorMsg,
                          required: isReq,
                          color: errorMsg ? 'danger' : undefined,
                          disabled: resolveDisabled(fs.disabled, values, globalDisabled),
                        };

                        if (fs.render) return fs.render({ field, fieldState, common });
                        if (fs.type === 'date') return <DatePicker {...common} />;
                        if (fs.type === 'dropdown') return <Dropdown {...common} options={fs.options || []} />;
                        return <FormControl {...common} type={fs.type!} options={fs.options} />;
                      }}
                    />
                  </FieldErrorBoundary>
                </VirtualizedItem>
              </GridItem>
            );
          })}
        </Grid>
      </SectionWrapper>
    );
    standalone = [];
  };

  items.forEach((item, idx) => {
    const hideProp = (item as any).hidden;
    const isHidden = typeof hideProp === 'function' ? hideProp(values) : hideProp === true;
    const isContainer = hasDataTable(item) || hasAccordion(item) || hasTabs(item) || hasFields(item);

    // Hidden simple fields should NOT break grouping; hidden containers flush.
    if (isHidden) {
      if (isContainer) flush();
      return;
    }

    if (hasDataTable(item)) {
      flush();
      const { dataTable } = item as { dataTable: DataTableSection };
      const { header, isSubHeader, description, config, fields: dtFields, hidden, disabled } = dataTable;

      const mapKey = config.dataSource;
      const activeIdx = activeRowIndexMap?.[mapKey] ?? null;
      const isBlockedByAncestor = ancestorRowSelected === false;
      const isHiddenDt = typeof hidden === 'function' ? hidden(values) : !!hidden;
      const isDisabled = globalDisabled
        || (typeof disabled === 'function' ? disabled(values) : !!disabled)
        || isBlockedByAncestor;

      if (isHiddenDt) { flush(); return; }

      const canonicalTable: any[] = tableDataMap[mapKey] ?? getDeepValue(originalData, mapKey) ?? [];
      const childPath = activeIdx != null ? `${mapKey}.${activeIdx}` : mapKey;

      nodes.push(
        <React.Fragment key={`tbl-${idx}`}>
          <Panel title={header} isSubHeader={isSubHeader} hasShadow={false}>
            {description && <Description>{description}</Description>}
            <SectionWrapper className='data-table-wrapper-section' $hasHeader={!!header}>
              <VirtualizedItem fieldKey={`table:${mapKey}`}>
                <DataTable
                  key={`dt:${mapKey}:${(tableVersionMap?.[mapKey] ?? 0)}`}
                  maxHeight="176px"
                  pageSize={5}
                  dataSource={canonicalTable}
                  columnSettings={config.columnSettings}
                  disabled={isDisabled}
                  activeRow={activeRowIndexMap[mapKey]?.toString()}
                  onChange={newData => {
                    if (isBlockedByAncestor) return;
                    setTableDataMap(prev => ({ ...prev, [mapKey]: newData }));
                    setValue(mapKey, newData);
                    setTableVersionMap?.(m => ({ ...m, [mapKey]: (m[mapKey] ?? 0) + 1 }));
                    onChange();
                  }}
                  onActiveRowChange={(_, rowIndex) => {
                    const idx = rowIndex != null ? Number(rowIndex) : null;
                    const canonicalRow = (idx != null) ? (canonicalTable[idx] ?? null) : null;

                    if (lastProcessedRef.current[mapKey] === idx &&
                        JSON.stringify(rowSnapshots.current[mapKey] ?? null) === JSON.stringify(canonicalRow ?? null)) {
                      return;
                    }

                    setActiveRowIndexMap(prev => (prev[mapKey] === idx ? prev : { ...prev, [mapKey]: idx }));
                    rowSnapshots.current[mapKey] = canonicalRow ? { ...canonicalRow } : null;
                    lastProcessedRef.current[mapKey] = idx;

                    clearErrors(mapKey as any);

                    const namedFields = flattenForSchema(dtFields)
                      .filter((fs: any): fs is FieldSetting & { name: string } => typeof fs?.name === 'string' && fs.name.length > 0);

                    const toTrigger: string[] = [];

                    const getFromRow = (path: string, row: any) => {
                      if (!row) return undefined;
                      const parts = path.split('.');
                      const full = parts.reduce((o: any, seg) => o?.[seg], row);
                      if (full !== undefined) return full;
                      const leaf = parts[parts.length - 1];
                      return row?.[leaf];
                    };

                    // Seed *every* leaf with canonical value OR an empty sentinel
                    namedFields.forEach((fs) => {
                      const raw = fs.name;
                      const full = idx != null ? `${mapKey}.${idx}.${raw}` : `${mapKey}.${raw}`;
                      const from = canonicalRow ? getFromRow(raw, canonicalRow) : undefined;
                      const val = (from !== undefined && from !== null) ? from : emptyFor(fs);
                      setValue(full, val, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
                      if (idx != null) toTrigger.push(full);
                    });

                    if (toTrigger.length) void trigger(toTrigger);
                  }}
                />

                {(() => {
                  const leafDraftFS = toLeafFieldSettings(dtFields);
                  const draftValues = leafDraftFS.map((fs: any) => getDeepValue(getValues(), `${mapKey}.${fs.name}`));
                  const hasDraft = draftValues.some(v => v != null && v !== '' && !(typeof v === 'boolean' && v === false));
                  const canAdd = activeIdx == null && hasDraft && !isBlockedByAncestor;
                  const canCancel = activeIdx != null || hasDraft;

                  return (
                    <ButtonContainer className='button-wrapper'>
                      <Button
                        type="button"
                        size='sm'
                        disabled={!canAdd}
                        data-testid={`btn-add-${mapKey}`}
                        onClick={async () => {
                          if (isBlockedByAncestor) return;

                          const absDraftItems = prefixItems(dtFields, mapKey);
                          const absFlatAll = (flattenForSchema(absDraftItems) as any[])
                            .filter((fs: any) => typeof fs?.name === 'string') as Array<FieldSetting & { name: string }>;
                          const absFlatLeaves = absFlatAll.filter(fs =>
                            !absFlatAll.some(other => other !== fs && other.name.startsWith(fs.name + '.'))
                          );

                          const relFlat = absFlatLeaves.map(fs => ({
                            ...fs,
                            name: fs.name.replace(new RegExp(`^${escapeRegExp(mapKey)}\\.`), ''),
                          }));

                          let draftValuesObj: Record<string, any> = {};
                          absFlatLeaves.forEach(abs => {
                            const relName = abs.name.replace(new RegExp(`^${escapeRegExp(mapKey)}\\.`), '');
                            const v = getDeepValue(getValues(), abs.name);
                            draftValuesObj = setDeepValue(draftValuesObj, relName, v);
                          });

                          let ctx = { ...getValues(), ...draftValuesObj };
                          for (const [relKey, v] of Object.entries(draftValuesObj)) {
                            ctx = setDeepValue(ctx, `${mapKey}.${relKey}`, v);
                          }

                          const draftSchema = buildSchema(relFlat as any, ctx);
                          const result = await draftSchema.safeParseAsync(draftValuesObj);

                          if (!result.success) {
                            result.error.errors.forEach(err => {
                              const relPath = Array.isArray(err.path) ? err.path.join('.') : String(err.path ?? '');
                              setError(`${mapKey}.${relPath}` as any, { type: 'manual', message: err.message });
                            });

                            const firstRel = Array.isArray(result.error.errors[0].path)
                              ? result.error.errors[0].path.join('.') : String(result.error.errors[0].path ?? '');
                            const el = document.querySelector<HTMLElement>(`[name="${mapKey}.${firstRel}"]`);
                            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el?.focus();
                            return;
                          }

                          // Build/normalize new row and prepend
                          let newRow: Record<string, any> = {};
                          absFlatLeaves.forEach(abs => {
                            const relName = abs.name.replace(new RegExp(`^${escapeRegExp(mapKey)}\\.`), '');
                            let v = getDeepValue(getValues(), abs.name);
                            v = normalizeByType(abs, v);
                            newRow = setDeepValue(newRow, relName, v);
                          });

                          const childTableKeys = dtFields
                            .filter((it: any) => 'dataTable' in it)
                            .map((it: any) => it.dataTable.config.dataSource as string);
                          for (const key of childTableKeys) if (newRow[key] == null) newRow[key] = [];

                          const prevFormRows: any[] = Array.isArray(tableDataMap[mapKey]) ? tableDataMap[mapKey] : [];
                          const newTable = [newRow, ...prevFormRows];
                          const shifted = shiftNestedTableKeys(tableDataMap, mapKey, 0, +1);

                          setTableDataMap({ ...shifted, [mapKey]: newTable });
                          setValue(mapKey, newTable);

                          // Reset selection caches so reseed after prepend is not skipped
                          rowSnapshots.current[mapKey] = null as any;
                          lastProcessedRef.current[mapKey] = null;

                          // Notify parent on table mutation
                          setTableVersionMap?.(m => ({ ...m, [mapKey]: (m[mapKey] ?? 0) + 1 }));
                          onChange();

                          // Clear draft inputs
                          absFlatLeaves.forEach(abs => {
                            setValue(abs.name, isBooleanControl(abs) ? false : '', { shouldDirty: false, shouldTouch: false, shouldValidate: false });
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
                          (document.activeElement as HTMLElement | null)?.blur?.();

                          const flatFS: Array<FieldSetting & { name: string }> = flattenForSchema(dtFields)
                            .filter((fs: any) => typeof fs?.name === 'string' && fs.name.length > 0) as any[];
                          const fieldNames = flatFS.map(fs => `${mapKey}.${activeIdx}.${fs.name}`);
                          const isValid = await trigger(fieldNames, { shouldFocus: true });
                          if (!isValid) return;

                          const prevFormRows: any[] = Array.isArray(tableDataMap[mapKey])
                            ? tableDataMap[mapKey] : (getDeepValue(getValues(), mapKey) ?? []);
                          let updatedRow: Record<string, any> = { ...(prevFormRows[activeIdx] ?? {}) };

                          flatFS.forEach(fs => {
                            const fullPath = `${mapKey}.${activeIdx}.${fs.name}`;
                            let v = getDeepValue(getValues(), fullPath);
                            v = normalizeByType(fs as any, v);
                            updatedRow = setDeepValue(updatedRow, fs.name, v);
                          });

                          const newTable = prevFormRows.slice();
                          newTable[activeIdx] = updatedRow;

                          setTableDataMap(m => ({ ...m, [mapKey]: newTable }));
                          setValue(mapKey, newTable);

                          const leafDraftFS2 = toLeafFieldSettings(dtFields);
                          clearErrors([mapKey, ...leafDraftFS2.map(fs => `${mapKey}.${activeIdx}.${fs.name}`)] as any);
                          setActiveRowIndexMap(prev => ({ ...prev, [mapKey]: null }));
                          rowSnapshots.current[mapKey] = null as any;
                          lastProcessedRef.current[mapKey] = null;
                          leafDraftFS2.forEach((fs: any) => {
                            setValue(`${mapKey}.${fs.name}`, isBooleanControl(fs) ? false : '', { shouldDirty: false, shouldTouch: false, shouldValidate: false });
                          });

                          setTableVersionMap?.(m => ({ ...m, [mapKey]: (m[mapKey] ?? 0) + 1 }));
                          onChange();
                          void trigger(mapKey as any);
                        }}
                      >
                        Update
                      </Button>

                      <Button
                        type="button"
                        size='sm'
                        color='danger'
                        disabled={activeIdx == null || isBlockedByAncestor}
                        variant={activeIdx !== null ? 'outlined' : undefined}
                        data-testid={`btn-delete-${mapKey}`}
                        onClick={() => {
                          if (isBlockedByAncestor || activeIdx == null) return;

                          const prevFormRows: any[] = Array.isArray(tableDataMap[mapKey])
                            ? tableDataMap[mapKey] : (getDeepValue(getValues(), mapKey) ?? []);
                          const newTable = prevFormRows.filter((_, i) => i !== activeIdx);

                          let nextMap = dropNestedKeysForIndex(tableDataMap, mapKey, activeIdx);
                          nextMap = shiftNestedTableKeys(nextMap, mapKey, activeIdx + 1, -1);

                          setTableDataMap({ ...nextMap, [mapKey]: newTable });
                          rowSnapshots.current[mapKey] = null as any;
                          setActiveRowIndexMap(prev => ({ ...prev, [mapKey]: null }));
                          lastProcessedRef.current[mapKey] = null;
                          setValue(mapKey, newTable);

                          setTableVersionMap?.(m => ({ ...m, [mapKey]: (m[mapKey] ?? 0) + 1 }));
                          onChange();
                        }}
                      >
                        Delete
                      </Button>

                      <Button
                        type="button"
                        size='sm'
                        color='default'
                        variant={canCancel ? 'outlined' : undefined}
                        disabled={!canCancel}
                        data-testid={`btn-cancel-${mapKey}`}
                        onClick={() => {
                          setActiveRowIndexMap(prev => ({ ...prev, [mapKey]: null }));
                          const leafDraftFS2 = toLeafFieldSettings(dtFields);
                          clearErrors(leafDraftFS2.map((fs: any) => `${mapKey}.${fs.name}`));
                          leafDraftFS2.forEach((fs: any) => {
                            setValue(`${mapKey}.${fs.name}`, isBooleanControl(fs) ? false : '', { shouldDirty: false, shouldTouch: false, shouldValidate: false });
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </ButtonContainer>
                  );
                })()}
              </VirtualizedItem>

              {/* Recursive render for dtFields with id prefix */}
              <RenderSection
                items={prefixItems(dtFields, childPath)}
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
              />
            </SectionWrapper>
          </Panel>
        </React.Fragment>
      );
      return;
    }

    if (hasAccordion(item)) {
      flush();
      const group = item;
      const visible = group.accordion.filter(sec => {
        const hide = sec.hidden;
        return typeof hide === 'function' ? !hide(values) : hide !== true;
      });
      if (visible.length === 0) return;

      nodes.push(
        <React.Fragment key={`hdr-acc-${idx}`}>
          <Panel title={group.header} isSubHeader={group.isSubHeader} hasShadow={false}>
            {group.description && <Description>{group.description}</Description>}

            <SectionWrapper className='accordion-wrapper' $hasHeader={!!group.header}>
              <Accordion
                allowMultiple={group.allowMultiple}
                items={visible.map((sec, i) => {
                  const errorCount = (flattenForSchema(sec.fields) as any[]).reduce((count, fs) => {
                    const errObj = getDeepValue(errors, fs.name as string);
                    return count + (errObj?.message ? 1 : 0);
                  }, 0);
                  const secHasError = errorCount > 0;

                  return {
                    id: sec.id ?? `${group.header}-sec-${i}`,
                    title: sec.title,
                    ...(secHasError ? { open: true } : { open: sec.open }),
                    children: (
                      <RenderSection
                        key={sec.id ?? i}
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
                      />
                    ),
                    disabled: typeof sec.disabled === 'function' ? sec.disabled(values) : sec.disabled,
                    rightContent: sec.rightContent,
                    rightDetails: secHasError ? [...(sec.rightDetails ?? []), { value: String(errorCount), valueColor: 'danger' }] : sec.rightDetails,
                    onClick: sec.onClick,
                  }
                })}
              />
            </SectionWrapper>
          </Panel>
        </React.Fragment>
      );
      return;
    }

    if (hasTabs(item)) {
      flush();
      const group = item as FieldGroup;

      const visibleTabs = group.tabs!.filter(tab => {
        const hideTab = tab.hidden;
        return typeof hideTab === 'function' ? !hideTab(values) : hideTab !== true;
      });

      if (visibleTabs.length === 0) return;

      const tabsKey = visibleTabs.map(tab => tab.title).join('|');

      nodes.push(
        <React.Fragment key={`hdr-tabs-${idx}`}>
          <Panel title={group.header} isSubHeader={group.isSubHeader} hasShadow={false}>
            {group.description && <Description>{group.description}</Description>}
            
            <SectionWrapper className='tabs-wrapper' $hasHeader={!!group.header}>
              <Tabs
                key={`tabs-${idx}-${tabsKey}`}
                tabs={visibleTabs.map((tab, i) => {
                  const errorCount = (flattenForSchema(tab.fields) as any[]).reduce((count, fs) => {
                    const errObj = getDeepValue(errors, fs.name as string);
                    return count + (errObj?.message ? 1 : 0);
                  }, 0);

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
                      />
                    ),
                  };
                })}
              />
            </SectionWrapper>
          </Panel>
        </React.Fragment>
      );
      return;
    }

    if (hasFields(item)) {
      flush();
      const group = item as FieldGroup;
      nodes.push(
        <React.Fragment key={`hdr-${idx}`}>
          <Panel title={group.header} isSubHeader={group.isSubHeader} hasShadow={false}>
            {group.description && <Description>{group.description}</Description>}
            <SectionWrapper className='fields-wrapper' $hasHeader={!!group.header}>
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
              />
            </SectionWrapper>
          </Panel>
        </React.Fragment>
      );
      return;
    }

    // simple field
    const fs = item as FieldSetting;
    const isFieldHidden = typeof (fs as any).hidden === 'function' ? (fs as any).hidden(values) : (fs as any).hidden === true;
    if (!isFieldHidden) standalone.push(fs);
  });

  flush();
  return nodes;
});

RenderSection.displayName = 'RenderSection';

/* ──────────────────────────────────────────────────────────────────────────────
 * Component: FormRenderer
 * ────────────────────────────────────────────────────────────────────────────*/
export const FormRenderer = forwardRef(<T extends Record<string, any>>(
  props: FormRendererProps<T>,
  ref: React.Ref<FormRendererRef<T>>
) => {
  const { fieldSettings, dataSource, onSubmit, onChange, disabled: globalDisabled = false, loading = false } = props;
  const rowSnapshots = React.useRef<Record<string, any>>({});
  const lastProcessedRef = React.useRef<Record<string, number | null>>({});

  const initialTableMap: Record<string, any[]> = {};
  fieldSettings.forEach(item => {
    if ((item as any).dataTable) {
      const key = (item as any).dataTable.config.dataSource;
      initialTableMap[key] = getDeepValue(dataSource, key) || [];
    }
  });

  const [tableDataMap, setTableDataMap] = React.useState(initialTableMap);
  const [activeRowIndexMap, setActiveRowIndexMap] = React.useState<Record<string, number | null>>({});
  const [tableVersionMap, setTableVersionMap] = React.useState<Record<string, number>>({});

  const baseSchema = buildSchema(flattenForSchema(fieldSettings), dataSource);
  type FormData = z.infer<typeof baseSchema>;

  /** Dynamic resolver with narrow-by-changed-names optimization */
  const dynamicResolver: Resolver<FormData> = async (values, context, options) => {
    const changed = options?.names ? Array.from(options.names) : null;

    const collectFor = (settings: SettingsItem[]) =>
      (flattenForSchema(settings) as Array<FieldSetting & { name: string }>);

    const allFlatTop = collectFor(fieldSettings);

    let itemsForSchema: SettingsItem[] = [];

    if (changed && changed.length) {
      // Intersect top-level non-table fields
      const intersectTop = allFlatTop
        .filter(fs => !(fs as any).dataTable)
        .filter(fs =>
          changed.some(n => n === fs.name || n.startsWith(fs.name + '.') || fs.name.startsWith(n + '.'))
        );
      if (intersectTop.length) itemsForSchema.push(...intersectTop);

      // Table contexts: include only related fields
      const contexts = collectDataTableContexts(values as any, fieldSettings);
      for (const ctx of contexts) {
        const leafFS = toLeafFieldSettings(ctx.fields);
        const relatedChanged = changed.filter(n => n === ctx.tableKey || n.startsWith(ctx.tableKey + '.'));
        if (relatedChanged.length === 0) continue;

        const rowIndex = activeRowIndexMap[ctx.tableKey];
        if (rowIndex != null) {
          itemsForSchema.push(...prefixItems(leafFS, `${ctx.tableKey}.${rowIndex}`));
        }

        const hasDraft = leafFS.some(fs => {
          const v = getDeepValue(values, `${ctx.tableKey}.${fs.name}`);
          return v != null && v !== '' && !(typeof v === 'boolean' && v === false);
        });
        if (hasDraft) itemsForSchema.push(...prefixItems(leafFS, ctx.tableKey));
      }

      // Safety: if nothing gathered, include any intersecting settings
      if (itemsForSchema.length === 0) {
        itemsForSchema = fieldSettings.filter(s =>
          collectFor([s]).some(fs =>
            changed.some(n => n === fs.name || n.startsWith(fs.name + '.') || fs.name.startsWith(n + '.'))
          )
        );
      }
    } else {
      // Submit / programmatic triggers → full original behavior
      fieldSettings.forEach(item => {
        if (!(item as any).dataTable) itemsForSchema.push(item);
      });

      const contexts = collectDataTableContexts(values as any, fieldSettings);
      for (const ctx of contexts) {
        const leafFS = toLeafFieldSettings(ctx.fields);

        const hasDraft = leafFS.some(fs => {
          const v = getDeepValue(values, `${ctx.tableKey}.${fs.name}`);
          return v != null && v !== '' && !(typeof v === 'boolean' && v === false);
        });
        if (hasDraft) itemsForSchema.push(...prefixItems(ctx.fields, ctx.tableKey));

        const rowIndex = activeRowIndexMap[ctx.tableKey];
        if (rowIndex != null) {
          itemsForSchema.push(...prefixItems(ctx.fields, `${ctx.tableKey}.${rowIndex}`));
        }
      }
    }

    const flatFields = flattenForSchema(itemsForSchema);
    const schema = buildSchema(flatFields, values);
    return zodResolver(schema)(values, context, options);
  };

  const { control, handleSubmit, getValues, setValue, trigger, setError, clearErrors, formState: { errors } } =
    useForm<FormData>({ defaultValues: dataSource as any, resolver: dynamicResolver, mode: 'onChange', reValidateMode: 'onChange' });

  const conditionalKeys = useMemo(
    () => flattenForSchema(fieldSettings).filter((fs: any) => fs.validation?.length === 2).map((fs: any) => fs.name!),
    [fieldSettings]
  );

  // Scoped reactivity at parent (optional; main subscription is inside RenderSection)
  useWatch({ control, name: conditionalKeys });

  const buildFullPayload = (): T => {
    const formValues = getValues() as any;
    let full = { ...formValues };
    Object.entries(tableDataMap).forEach(([path, rows]) => {
      full = setDeepValue(full, path, rows);
    });
    return full as T;
  };

  useImperativeHandle(
    ref,
    () => ({
      submit: async () => {
        // Validate drafts / active rows
        for (const item of fieldSettings.filter(hasDataTable)) {
          const dt = (item as { dataTable: DataTableSection }).dataTable;
          const tableKey = dt.config.dataSource;
          const leafFS = toLeafFieldSettings(dt.fields);
          const activeIdx = activeRowIndexMap?.[tableKey] ?? null;

          if (activeIdx != null) {
            clearErrors(`${tableKey}`);

            let rowValuesRel: Record<string, any> = {};
            leafFS.forEach(fs => {
              const abs = `${tableKey}.${activeIdx}.${fs.name}`;
              const v = getDeepValue(getValues(), abs);
              rowValuesRel = setDeepValue(rowValuesRel, fs.name, v);
            });

            let ctx = { ...getValues(), ...rowValuesRel };
            for (const [relKey, v] of Object.entries(rowValuesRel)) {
              ctx = setDeepValue(ctx, `${tableKey}.${activeIdx}.${relKey}`, v);
            }

            const rowSchema = buildSchema(leafFS, ctx);
            const result = await rowSchema.safeParseAsync(rowValuesRel);

            if (!result.success) {
              const invalid = result.error.errors.map(err => {
                const relPath = Array.isArray(err.path) ? err.path.join('.') : String(err.path ?? '');
                const absPath = `${tableKey}.${activeIdx}.${relPath}`;
                const value = getDeepValue(rowValuesRel, relPath);
                setError(absPath as any, { type: 'manual', message: err.message });
                return { field: absPath, error: err.message, value };
              });

              const first = invalid[0]?.field;
              if (first) {
                const el = document.querySelector<HTMLElement>(`[name="${first}"]`) ??
                           document.querySelector<HTMLElement>(`[data-field-key="${first}"]`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el?.focus?.();
              }

              onSubmit?.({ valid: false, values: buildFullPayload(), invalidFields: invalid });
              return;
            }
            continue;
          }

          // No active row -> validate draft if any
          let draftValues: Record<string, any> = {};
          let hasDraftValue = false;
          leafFS.forEach(fs => {
            const val = getDeepValue(getValues(), `${tableKey}.${fs.name}`);
            draftValues = setDeepValue(draftValues, fs.name!, val);
            if (val != null && val !== '' && !(typeof val === 'boolean' && val === false)) hasDraftValue = true;
          });
          if (!hasDraftValue) continue;

          const draftSchema = buildSchema(leafFS, draftValues);
          const result = await draftSchema.safeParseAsync(draftValues);

          if (!result.success) {
            const invalid = result.error.errors.map(err => {
              const relPath = Array.isArray(err.path) ? err.path.join('.') : String(err.path ?? '');
              return { field: `${tableKey}.${relPath}`, error: err.message, value: getDeepValue(draftValues, relPath) };
            });

            result.error.errors.forEach(err => {
              const relPath = Array.isArray(err.path) ? err.path.join('.') : String(err.path ?? '');
              setError(`${tableKey}.${relPath}` as any, { type: 'manual', message: err.message });
            });

            const firstRel = Array.isArray(result.error.errors[0].path)
              ? result.error.errors[0].path.join('.')
              : String(result.error.errors[0].path ?? '');
            const el = document.querySelector<HTMLElement>(`[name="${tableKey}.${firstRel}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el?.focus();
            onSubmit?.({ valid: false, values: buildFullPayload(), invalidFields: invalid });
            return;
          }
        }

        // Final submit
        handleSubmit(
          () => onSubmit({ valid: true, values: buildFullPayload(), invalidFields: [] }),
          errs => {
            const invalid: SubmitResult<T>['invalidFields'] = [];
            const curr = getValues() as any;
            const traverse = (path: string, node: any) => {
              if (node?.message) {
                const value = path.split('.').reduce((a: any, k: string) => a?.[k], curr);
                invalid.push({ field: path, error: node.message, value });
              } else if (typeof node === 'object') {
                Object.entries(node).forEach(([k, v]) => traverse(path ? `${path}.${k}` : k, v));
              }
            };
            Object.entries(errs).forEach(([k, v]) => traverse(k, v));

            if (invalid.length) {
              const firstField = invalid[0].field;
              const wrapper = document.querySelector<HTMLElement>(`[data-field-key="${firstField}"]`);
              if (wrapper) {
                wrapper.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                const obs = new IntersectionObserver(
                  ([entry], observer) => {
                    if (entry.isIntersecting) {
                      const input = wrapper.querySelector<HTMLElement>(`[name="${firstField}"]`);
                      input?.focus();
                      observer.disconnect();
                    }
                  },
                  { root: null, threshold: 0.1, rootMargin: '-20% 0px' }
                );
                obs.observe(wrapper);
              }
            }
            onSubmit({ valid: false, values: buildFullPayload(), invalidFields: invalid });
          }
        )();
      },
      getValues: () => getValues() as T,
    }),
    [handleSubmit, onSubmit, getValues, activeRowIndexMap, tableDataMap, trigger, setError]
  );

  const handleChange = () => onChange?.(getValues() as T);

  return (
    <FormWrapper className='form-wrapper' onSubmit={e => e.preventDefault()}>
      {loading
        ? renderSkeletonSection(fieldSettings, getValues())
        : (
          <RenderSection
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
          />
        )
      }
    </FormWrapper>
  );
});
