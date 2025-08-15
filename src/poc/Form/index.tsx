// src/poc/Form/index.tsx
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import { useForm, Controller, UseFormSetError, UseFormClearErrors } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  SettingsItem,
  FieldGroup,
  FieldSetting,
  AccordionSection,
  DynamicFormProps,
  DynamicFormRef,
  SubmitResult,
  DataTableSection,
} from './interface';

import {
  flattenForSchema,
  buildSchema,
  isZodRequired,
  resolveDisabled,
  getDeepValue,
  setDeepValue
} from './utils';

import FieldErrorBoundary from './components/FieldErrorBoundary';
import VirtualizedItem from './components/VirtualizedItem';
import renderSkeletonSection from './components/Skeleton';

import { FormControl } from '../../atoms/FormControl';
import { DatePicker } from '../../molecules/DatePicker';
import { Dropdown } from '../../molecules/Dropdown';
import { Grid, GridItem } from '../../atoms/Grid';
import { Tabs } from '../../organisms/Tabs';
import { Accordion } from '../../molecules/Accordion';
import { DataTable } from '../../organisms/DataTable';
import { Button } from '../../atoms/Button';

import {
  PageHeader,
  FieldsWrapper,
  SubHeader,
  FormWrapper,
  Description,
  SectionWrapper,
  ButtonContainer
} from './styled';

import './validation';

// Type guards
const isFieldGroup = (item: SettingsItem): item is FieldGroup =>
  ('fields' in item && Array.isArray(item.fields)) ||
  ('tabs' in item && Array.isArray(item.tabs)) ||
  ('accordion' in item && Array.isArray(item.accordion));
const hasAccordion = (
  item: SettingsItem
): item is FieldGroup & { accordion: AccordionSection[] } =>
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

// Utility to prefix FieldSettings or FieldGroups for a given array path
function prefixItems(
  items: SettingsItem[],
  path: string
): SettingsItem[] {
  const cleanPath = path.replace(/\.(?:null|undefined)$/, '');

  return items.map(item => {
    // 1) Nested DataTable?
    if ('dataTable' in item && item.dataTable) {
      const dt = item.dataTable;
      return {
        ...item,
        dataTable: {
          ...dt,
          config: {
            ...dt.config,
            dataSource: `${cleanPath}.${dt.config.dataSource}`,
          },
          fields: dt.fields,
        },
      };
    }

    // 2) Regular fields‑group
    if ('fields' in item && Array.isArray(item.fields)) {
      return {
        ...(item as FieldGroup),
        fields: prefixItems(item.fields, cleanPath),
      };
    }

    // 3) Accordion section
    if ('accordion' in item && Array.isArray((item as any).accordion)) {
      const grp = item as FieldGroup & { accordion: AccordionSection[] };
      return {
        ...grp,
        accordion: grp.accordion.map(sec => ({
          ...sec,
          fields: prefixItems(sec.fields, cleanPath),
        })),
      };
    }

    // 4) Tabs section
    if ('tabs' in item && Array.isArray((item as any).tabs)) {
      const grp = item as FieldGroup & { tabs: { title: string; fields: SettingsItem[] }[] };
      return {
        ...grp,
        tabs: grp.tabs.map(tab => ({
          ...tab,
          fields: prefixItems(tab.fields, cleanPath),
        })),
      };
    }

    // 5) Plain FieldSetting
    const fs = item as FieldSetting;
    return {
      ...fs,
      name: `${cleanPath}.${fs.name}`,
    };
  });
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function shiftNestedTableKeys(
  map: Record<string, any[]>,
  baseKey: string,
  startIndex: number,
  delta: number
) {
  const next: Record<string, any[]> = { ...map };
  const re = new RegExp(`^${escapeRegExp(baseKey)}\\.(\\d+)\\.`);
  // Avoid collisions: when inserting (delta>0) shift high→low; when removing, low→high
  const keys = Object.keys(next).sort((a, b) =>
    delta > 0 ? b.localeCompare(a) : a.localeCompare(b)
  );
  for (const k of keys) {
    const m = k.match(re);
    if (!m) continue;
    const idx = Number(m[1]);
    if (Number.isNaN(idx) || idx < startIndex) continue;
    const newKey = k.replace(re, `${baseKey}.${idx + delta}.`);
    const val = next[k];
    delete next[k];
    next[newKey] = val;
  }
  return next;
}

function dropNestedKeysForIndex(
  map: Record<string, any[]>,
  baseKey: string,
  index: number
) {
  const next: Record<string, any[]> = { ...map };
  const re = new RegExp(`^${escapeRegExp(baseKey)}\\.${index}\\.`);
  for (const k of Object.keys(next)) {
    if (re.test(k)) delete next[k];
  }
  return next;
}

const isBooleanControl = (fs) =>
  fs.type === 'switch' ||
  fs.type === 'checkbox' ||
  fs.type === 'radio';

/**
 * Renders the real form fields (with virtualization & error boundaries).
 */
export const renderSection = (
  items: SettingsItem[],
  errors: any,
  onChange: () => void,
  control: any,
  z: typeof import('zod') | any,
  globalDisabled: boolean,
  originalData: Record<string, any>,
  getValues: () => Record<string, any>,
  setValue: (name: string, value: any) => void,
  trigger: (name?: string | string[]) => Promise<boolean>,
  setError: UseFormSetError<any>,
  clearErrors: UseFormClearErrors<any>,
  conditionalKeys: string[],
  activeRowIndexMap: Record<string, number | null>,
  setActiveRowIndexMap: React.Dispatch<React.SetStateAction<Record<string, number | null>>>,
  tableDataMap: Record<string, any[]>,
  setTableDataMap: React.Dispatch<React.SetStateAction<Record<string, any[]>>>,
  rowSnapshots: React.MutableRefObject<Record<string, any>>,
  lastProcessedRef: React.MutableRefObject<Record<string, number | null>>,
  ancestorRowSelected: boolean | null = null,
): React.ReactNode[] => {
  const values = getValues();
  const nodes: React.ReactNode[] = [];
  let standalone: FieldSetting[] = [];
  let flushCount = 0;

  const flush = () => {
    if (!standalone.length) return;
    nodes.push(
      <FieldsWrapper className='fields-wrapper' key={`flush-${flushCount++}`}>
        <Grid>
          {standalone.map((fs: any) => {
            const key = fs.name!;
            const err = getDeepValue(errors, key)?.message;

            const schemaForRequired = fs.validation
              ? fs.validation(z, values)
              : z.any();
            const isReq = isZodRequired(schemaForRequired);

            return (
              <GridItem
                key={key}
                xs={fs.col?.xs ?? 12}
                sm={fs.col?.sm ?? 6}
                md={fs.col?.md ?? 4}
                lg={fs.col?.lg ?? 3}
              >
                <VirtualizedItem fieldKey={key}>
                  <FieldErrorBoundary label={fs.label}>
                    <Controller
                      name={key as any}
                      control={control}
                      shouldUnregister={false}
                      defaultValue={getDeepValue(getValues(), key) ?? (isBooleanControl(fs) ? false : '')}
                      render={({ field, fieldState }) => {
                        const errorMsg = fieldState.error?.message ?? err;

                        let displayValue = field.value;
                        if (fs.type === 'number') {
                          displayValue =
                            typeof displayValue === 'number' &&
                              !isNaN(displayValue)
                              ? displayValue
                              : '';
                        }

                        const wrapped = (v: any) => {
                          // if this field is part of ANY DataTable, update the form value but do NOT fire onChange()
                          const inAnyTable = Object
                            .keys(tableDataMap)
                            .some(tableKey => key.startsWith(`${tableKey}.`));

                          if (inAnyTable) {
                            // just update the form state + validation
                            field.onChange(v);
                            return;
                          }
                          // convert Date to ISO
                          if (fs.type === 'date' && v instanceof Date) {
                            v = v.toISOString();
                          }
                          // update form value and trigger validation
                          field.onChange(v);
                          onChange();
                          conditionalKeys.forEach(k => void trigger(k as any));
                        };

                        const common: any = {
                          ...field,
                          // for boolean controls we bind to `checked`, otherwise to `value`
                          ...(isBooleanControl(fs)
                            ? { checked: displayValue as boolean }
                            : { value: displayValue }),
                          onChange: wrapped,
                          label: fs.label,
                          placeholder: fs.placeholder,
                          helpText: errorMsg,
                          required: isReq,
                          color: errorMsg ? 'danger' : undefined,
                          disabled: resolveDisabled(
                            fs.disabled,
                            values,
                            globalDisabled
                          ),
                        };

                        if (fs.render) {
                          return fs.render({ field, fieldState, common });
                        }

                        if (fs.type === 'date') {
                          return <DatePicker {...common} />;
                        }

                        if (fs.type === 'dropdown') {
                          return (
                            <Dropdown
                              {...common}
                              options={fs.options || []}
                            />
                          );
                        }

                        return (
                          <FormControl
                            {...common}
                            type={fs.type!}
                            options={fs.options}
                          />
                        );
                      }}
                    />
                  </FieldErrorBoundary>
                </VirtualizedItem>
              </GridItem>
            );
          })}
        </Grid>
      </FieldsWrapper>
    );
    standalone = [];
  };

  items.forEach((item, idx) => {
    // 0) top-level hidden check on both FieldSetting & FieldGroup
    const hide = (item as any).hidden;
    const isHidden = typeof hide === 'function' ? hide(values) : hide === true;
    if (isHidden) {
      flush(); // make sure pending standalone fields are rendered before skipping
      return;
    }

    // handle DataTable sections
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
      const isBlockedByAncestor = ancestorRowSelected === false;
      const isHidden = typeof hidden === 'function' ? hidden(values) : !!hidden;
      const isDisabled = globalDisabled
        || (typeof disabled === 'function' ? disabled(values) : !!disabled)
        || isBlockedByAncestor;

      if (isHidden) {
        flush();
        return;  // don’t render the table or any of its child fields
      }

      const rawTable = tableDataMap[mapKey] ?? getDeepValue(originalData, mapKey);
      const tableData = Array.isArray(rawTable) ? rawTable : [];

      // always build a childPath (so prefixItems never sees ".null")
      const childPath = activeIdx != null ? `${mapKey}.${activeIdx}` : mapKey;

      nodes.push(
        <React.Fragment key={`tbl-${idx}`}>
          {header && (
            isSubHeader
              ? <SubHeader className='header sub-header'>{header}</SubHeader>
              : <PageHeader className='header main-header'>{header}</PageHeader>
          )}
          {description && <Description>{description}</Description>}

          <SectionWrapper className='data-table-wrapper-section' $hasHeader={!!header}>
            <VirtualizedItem fieldKey={`table:${mapKey}`}>
              <DataTable
                maxHeight="176px"
                pageSize={5}
                dataSource={tableData}
                columnSettings={config.columnSettings}
                disabled={isDisabled}
                activeRow={activeRowIndexMap[mapKey]?.toString()}
                onChange={newData => {
                  if (isBlockedByAncestor) return;
                  setTableDataMap(prev => ({ ...prev, [mapKey]: newData }));
                  setValue(config.dataSource, newData);
                  onChange();
                }}

                onActiveRowChange={(rowData, rowIndex) => {
                  const idx = rowData != null && rowIndex != null ? Number(rowIndex) : null;

                  // no-op if selection didn't actually change
                  if (lastProcessedRef.current[mapKey] === idx &&
                    JSON.stringify(rowSnapshots.current[mapKey] ?? null) === JSON.stringify(rowData ?? null)) {
                    return;
                  }

                  setActiveRowIndexMap(prev => (prev[mapKey] === idx ? prev : { ...prev, [mapKey]: idx }));
                  rowSnapshots.current[mapKey] = rowData ? { ...rowData } : null;
                  lastProcessedRef.current[mapKey] = idx;

                  clearErrors(mapKey as any);

                  // flatten + keep only real fields with a name
                  const namedFields = flattenForSchema(dtFields)
                    .filter((fs: any): fs is FieldSetting & { name: string } =>
                      typeof fs?.name === 'string' && fs.name.length > 0
                    );
                  const toTrigger: string[] = [];

                  const getFromRow = (path: string, row: any) => {
                    if (!row) return undefined;
                    const parts = path.split('.');
                    // try full nested path
                    const full = parts.reduce((o: any, seg) => o?.[seg], row);
                    if (full !== undefined) return full;
                    // fallback to leaf key if row is flat
                    const leaf = parts[parts.length - 1];
                    return row?.[leaf];
                  };

                  namedFields.forEach((fs) => {
                    const raw = fs.name; // guaranteed string
                    const full = idx != null ? `${mapKey}.${idx}.${raw}` : `${mapKey}.${raw}`;

                    let val: any = '';
                    if (rowData && idx != null) {
                      val = getFromRow(raw, rowData);
                    } else if (isBooleanControl(fs)) {
                      val = false;
                    } else if (fs.type === 'number') {
                      val = undefined;
                    }

                    setValue(full, val, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
                    if (idx != null) toTrigger.push(full);
                  });

                  if (toTrigger.length) void trigger(toTrigger);
                }}
              />

              {/* ───────── DataTable Action Buttons ───────── */}
              {(() => {
                // 1) Flatten ONLY leaf draft row fields (fields, tabs, accordion)
                const leafDraftFS = toLeafFieldSettings(dtFields);

                // 2) pull the current RHF values for each leaf draft field
                const draftValues = leafDraftFS.map((fs: any) => {
                  const path = `${mapKey}.${fs.name}`;
                  return getDeepValue(getValues(), path);
                });

                // 3) see if any draft input has a value
                const hasDraft = draftValues.some(v =>
                  v != null && v !== '' && !(typeof v === 'boolean' && v === false)
                );

                // 4) enable Add iff no row selected + there’s some draft input
                const canAdd = activeIdx == null && hasDraft && !isBlockedByAncestor;
                const canCancel = activeIdx != null || hasDraft;

                return (
                  <ButtonContainer className='button-wrapper'>
                    {/* Add */}
                    <Button
                      size='sm'
                      disabled={!canAdd}
                      onClick={async () => {
                        if (isBlockedByAncestor) return;

                        // 1) Prefix dt fields with the table's mapKey (absolute names)
                        const absDraftItems = prefixItems(dtFields, mapKey);

                        // 2) Flatten and keep only leaf FieldSettings
                        const absFlatAll = (flattenForSchema(absDraftItems) as any[])
                          .filter((fs: any) => typeof fs?.name === 'string') as Array<FieldSetting & { name: string }>;
                        const absFlatLeaves = absFlatAll.filter(fs =>
                          !absFlatAll.some(other => other !== fs && other.name.startsWith(fs.name + '.'))
                        );

                        // 3) Build RELATIVE copies for schema (strip `${mapKey}.`)
                        const relFlat = absFlatLeaves.map(fs => ({
                          ...fs,
                          name: fs.name.replace(new RegExp(`^${escapeRegExp(mapKey)}\\.`), ''),
                        }));

                        // 4) Collect RELATIVE payload from ABSOLUTE values — keep values AS-IS (no normalization)
                        let draftValuesObj: Record<string, any> = {};
                        absFlatLeaves.forEach(abs => {
                          const relName = abs.name.replace(new RegExp(`^${escapeRegExp(mapKey)}\\.`), '');
                          const v = getDeepValue(getValues(), abs.name); // ← keep '', null, undefined as-is
                          draftValuesObj = setDeepValue(draftValuesObj, relName, v);
                        });

                        // 5) Hybrid context so conditional validators can see both views
                        let ctx = { ...getValues(), ...draftValuesObj };
                        for (const [relKey, v] of Object.entries(draftValuesObj)) {
                          ctx = setDeepValue(ctx, `${mapKey}.${relKey}`, v);
                        }

                        // 6) Validate RELATIVE payload
                        const draftSchema = buildSchema(relFlat as any, ctx);
                        const result = await draftSchema.safeParseAsync(draftValuesObj);

                        if (!result.success) {
                          // Push errors at ABSOLUTE paths so Controllers / Accordion pick them up
                          result.error.errors.forEach(err => {
                            const relPath = Array.isArray(err.path) ? err.path.join('.') : String(err.path ?? '');
                            setError(`${mapKey}.${relPath}` as any, { type: 'manual', message: err.message });
                          });

                          const firstRel = Array.isArray(result.error.errors[0].path)
                            ? result.error.errors[0].path.join('.')
                            : String(result.error.errors[0].path ?? '');
                          const el = document.querySelector<HTMLElement>(`[name="${mapKey}.${firstRel}"]`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          el?.focus();
                          return; // abort Add
                        }

                        // 7) Build the new row from ABSOLUTE values — keep values AS-IS and NEST them
                        let newRow: Record<string, any> = {};
                        absFlatLeaves.forEach(abs => {
                          const relName = abs.name.replace(new RegExp(`^${escapeRegExp(mapKey)}\\.`), '');
                          const v = getDeepValue(getValues(), abs.name); // ← keep '', null, undefined as-is
                          newRow = setDeepValue(newRow, relName, v);
                        });

                        // Seed immediate child DataTables as empty arrays
                        const childTableKeys = dtFields
                          .filter((it: any) => 'dataTable' in it)
                          .map((it: any) => it.dataTable.config.dataSource as string);
                        for (const key of childTableKeys) if (newRow[key] == null) newRow[key] = [];

                        // Commit table
                        const prevRaw = getDeepValue(getValues(), mapKey);
                        const prevFormRows: any[] = Array.isArray(prevRaw) ? prevRaw : [];
                        const newTable = [newRow, ...prevFormRows];
                        const shifted = shiftNestedTableKeys(tableDataMap, mapKey, 0, +1);

                        setTableDataMap({ ...shifted, [mapKey]: newTable });
                        setValue(mapKey, newTable);
                        onChange();

                        // Clear draft inputs (ABSOLUTE), but keep boolean reset behavior
                        absFlatLeaves.forEach(abs => {
                          setValue(abs.name, isBooleanControl(abs) ? false : '');
                        });
                      }}
                    >
                      Add
                    </Button>


                    {/* Update */}
                    <Button
                      size="sm"
                      disabled={activeIdx == null || isBlockedByAncestor}
                      onClick={async () => {
                        if (isBlockedByAncestor) return;
                        if (activeIdx == null) return;

                        // 1) Flatten *all* row fields (handles groups, accordions, tabs, etc.)
                        const flatFS: Array<FieldSetting & { name: string }> = flattenForSchema(dtFields)
                          .filter((fs: any) => typeof fs?.name === 'string' && fs.name.length > 0) as any[];

                        // 2) Validate & focus first invalid automatically
                        const fieldNames = flatFS.map(fs => `${mapKey}.${activeIdx}.${fs.name}`);
                        const isValid = await trigger(fieldNames, { shouldFocus: true });
                        if (!isValid) return;

                        // 3) Build updated row (nested) — keep values AS-IS
                        const prevFormRows: any[] = getDeepValue(getValues(), mapKey) ?? [];
                        const snapshotBefore = rowSnapshots.current[mapKey] || {};
                        let updatedRow: Record<string, any> = { ...(prevFormRows[activeIdx] ?? {}) };

                        flatFS.forEach(fs => {
                          const fullPath = `${mapKey}.${activeIdx}.${fs.name}`;
                          const v = getDeepValue(getValues(), fullPath); // ← keep '', null, undefined as-is
                          updatedRow = setDeepValue(updatedRow, fs.name, v); // NEST correctly
                        });

                        // 4) No-op guard
                        if (JSON.stringify(snapshotBefore) === JSON.stringify(updatedRow)) return;

                        // 5) Commit
                        const newTable = prevFormRows.slice();
                        newTable[activeIdx] = updatedRow;

                        setTableDataMap(m => ({ ...m, [mapKey]: newTable }));
                        setValue(mapKey, newTable); // keep RHF in sync
                        rowSnapshots.current[mapKey] = { ...updatedRow }; // refresh snapshot
                        onChange();
                      }}

                    >
                      Update
                    </Button>


                    {/* Delete */}
                    <Button
                      size='sm'
                      color='danger'
                      disabled={activeIdx == null || isBlockedByAncestor}
                      variant={activeIdx !== null ? 'outlined' : undefined}
                      onClick={() => {
                        if (isBlockedByAncestor) return;
                        if (activeIdx == null) return;

                        // 1) base on current state
                        const prevFormRows: any[] = getDeepValue(getValues(), mapKey) ?? [];
                        const newTable = prevFormRows.filter((_, i) => i !== activeIdx);

                        // 2) prune nested keys for the removed index, then shift higher ones -1
                        let nextMap = dropNestedKeysForIndex(tableDataMap, mapKey, activeIdx);
                        nextMap = shiftNestedTableKeys(nextMap, mapKey, activeIdx + 1, -1);

                        // 3) commit
                        setTableDataMap({ ...nextMap, [mapKey]: newTable });

                        // 4) clear selection/snapshot
                        rowSnapshots.current[mapKey] = null as any;
                        setActiveRowIndexMap(prev => ({ ...prev, [mapKey]: null }));

                        // 5) mirror into RHF and notify
                        setValue(mapKey, newTable);
                        onChange();

                      }}
                    >
                      Delete
                    </Button>

                    {/* Cancel */}
                    <Button
                      size='sm'
                      color='default'
                      variant={canCancel ? 'outlined' : undefined}
                      disabled={!canCancel}
                      onClick={() => {
                        // 1) unselect any row
                        setActiveRowIndexMap(prev => ({
                          ...prev,
                          [mapKey]: null,
                        }));
                        // 2) clear any validation errors on those draft fields
                        clearErrors(leafDraftFS.map((fs: any) => `${mapKey}.${fs.name}`));
                        leafDraftFS.forEach((fs: any) => {
                          const path = `${mapKey}.${fs.name}`;
                          setValue(path, isBooleanControl(fs) ? false : '');
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
            {renderSection(
              prefixItems(dtFields, childPath),
              errors,
              onChange,
              control,
              z,
              globalDisabled || isBlockedByAncestor,
              getValues(),
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
              activeIdx != null
            )}
          </SectionWrapper>
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
          {group.header && (
            group.isSubHeader
              ? <SubHeader className='header sub-header'>{group.header}</SubHeader>
              : <PageHeader className='header main-header'>{group.header}</PageHeader>
          )}
          {group.description && <Description>{group.description}</Description>}

          <SectionWrapper className='accordion-wrapper' $hasHeader={!!group.header}>
            <Accordion
              allowMultiple={group.allowMultiple}
              items={visible.map((sec, i) => {
                // Count field-level errors in this section
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
                    <React.Fragment key={sec.id ?? i}>
                      {renderSection(
                        sec.fields,
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
                        ancestorRowSelected
                      )}
                    </React.Fragment>
                  ),
                  disabled: typeof sec.disabled === 'function' ? sec.disabled(values) : sec.disabled,
                  rightContent: sec.rightContent,
                  rightDetails: errorCount > 0
                    ? [...(sec.rightDetails ?? []), { value: String(errorCount), valueColor: 'danger' }]
                    : sec.rightDetails,
                  onClick: sec.onClick,
                }
              })}
            />
          </SectionWrapper>
        </React.Fragment>
      );
      return;
    }

    if (hasTabs(item)) {
      flush();
      const group = item as FieldGroup;

      // 1) filter out any hidden tabs
      const visibleTabs = group.tabs!.filter(tab => {
        const hideTab = tab.hidden;
        return typeof hideTab === 'function'
          ? !hideTab(values)
          : hideTab !== true;
      });

      // 2) if no tabs remain, skip the whole group
      if (visibleTabs.length === 0) return;

      // 3) build a dynamic key so Tabs remounts when visibleTabs changes
      const tabsKey = visibleTabs.map(tab => tab.title).join('|');

      nodes.push(
        <React.Fragment key={`hdr-tabs-${idx}`}>
          {group.header && (
            group.isSubHeader
              ? <SubHeader className='header sub-header'>{group.header}</SubHeader>
              : <PageHeader className='header main-header'>{group.header}</PageHeader>
          )}
          {group.description && <Description>{group.description}</Description>}

          <Tabs
            key={`tabs-${idx}-${tabsKey}`}
            tabs={visibleTabs.map((tab, i) => ({
              title: tab.title,
              content: (
                <React.Fragment key={`tab-${idx}-${i}`}>
                  {renderSection(
                    tab.fields,
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
                    ancestorRowSelected
                  )}
                </React.Fragment>
              ),
            }))}
          />
        </React.Fragment>
      );
      return;
    }

    if (hasFields(item)) {
      flush();
      const group = item as FieldGroup;
      nodes.push(
        <React.Fragment key={`hdr-${idx}`}>
          {group.header && (
            group.isSubHeader
              ? <SubHeader className='header sub-header'>{group.header}</SubHeader>
              : <PageHeader className='header main-header'>{group.header}</PageHeader>
          )}
          {group.description && <Description>{group.description}</Description>}
          <FieldsWrapper className='fields-wrapper' $hasHeader={!!group.header}>
            {renderSection(
              group.fields!,
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
              ancestorRowSelected
            )}
          </FieldsWrapper>
        </React.Fragment>
      );
      return;
    }

    // 3) standalone FieldSetting — only collect if not hidden
    const fs = item as FieldSetting;
    const hideField = fs.hidden;
    const isFieldHidden =
      typeof hideField === 'function' ? hideField(values) : hideField === true;
    if (!isFieldHidden) standalone.push(fs);
  });

  flush();
  return nodes;
};

export const DynamicForm = forwardRef(<T extends Record<string, any>>(
  props: DynamicFormProps<T>,
  ref: React.Ref<DynamicFormRef<T>>
) => {
  const {
    fieldSettings,
    dataSource,
    onSubmit,
    onChange,
    disabled: globalDisabled = false,
    loading = false,
  } = props;
  const rowSnapshots = React.useRef<Record<string, any>>({});
  const lastProcessedRef = React.useRef<Record<string, number | null>>({});

  // 1) Build an initial map of each tableKey → its array
  const initialTableMap: Record<string, any[]> = {};
  fieldSettings.forEach(item => {
    if ((item as any).dataTable) {
      const key = (item as any).dataTable.config.dataSource;
      initialTableMap[key] = getDeepValue(dataSource, key) || [];
    }
  });

  // 2) React state to hold the “official” table data
  const [tableDataMap, setTableDataMap] = React.useState(initialTableMap);
  const [activeRowIndexMap, setActiveRowIndexMap] = React.useState<Record<string, number | null>>({});

  const baseSchema = buildSchema(flattenForSchema(fieldSettings), dataSource);
  type FormData = z.infer<typeof baseSchema>;

  const dynamicResolver: Resolver<FormData> = async (values, context, options) => {
    // Build schema items based on active tables
    const itemsForSchema: SettingsItem[] = [];
    // Include all top‑level non‑DataTable items
    fieldSettings.forEach(item => {
      if (!(item as any).dataTable) itemsForSchema.push(item);
    });

    // For each DataTable with a selected row, include its prefixed child fields
    for (const tableKey in activeRowIndexMap) {
      const rowIndex = activeRowIndexMap[tableKey];
      if (rowIndex != null) {
        const dtSection = fieldSettings.find(
          it => (it as any).dataTable?.config?.dataSource === tableKey
        ) as ({ dataTable: DataTableSection }) | undefined;

        if (dtSection) {
          itemsForSchema.push(
            ...prefixItems(dtSection.dataTable.fields, `${tableKey}.${rowIndex}`)
          );
        }
      }
    }

    // Flatten and build schema only from the collected items
    const flatFields = flattenForSchema(itemsForSchema);
    const schema = buildSchema(flatFields, values);
    return zodResolver(schema)(values, context, options);
  };

  const {
    control,
    watch,
    handleSubmit,
    getValues,
    setValue,
    trigger,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: dataSource as any,
    resolver: dynamicResolver,
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const conditionalKeys = useMemo(
    () =>
      flattenForSchema(fieldSettings)
        .filter((fs: any) => fs.validation?.length === 2)
        .map((fs: any) => fs.name!),
    [fieldSettings]
  );

  useImperativeHandle(
    ref,
    () => ({
      submit: async () => {
        // ─── 1) Inline-validate any “draft” rows ───
        // ─── 1) Inline-validate any “draft” rows ───
for (const item of fieldSettings.filter(hasDataTable)) {
  const dt = (item as { dataTable: DataTableSection }).dataTable;
  const tableKey = dt.config.dataSource;
  const leafFS = toLeafFieldSettings(dt.fields);

  const activeIdx = activeRowIndexMap?.[tableKey] ?? null;

  if (activeIdx != null) {
    // Clear any stale errors under this table (e.g., from a previously selected row)
    clearErrors(`${tableKey}`);

    // Build RELATIVE payload for the selected row using ABSOLUTE paths
    let rowValuesRel: Record<string, any> = {};
    leafFS.forEach(fs => {
      const abs = `${tableKey}.${activeIdx}.${fs.name}`;
      const v = getDeepValue(getValues(), abs); // keep '', null, undefined as-is
      rowValuesRel = setDeepValue(rowValuesRel, fs.name, v);
    });

    // Hybrid ctx so conditional validators can see both views
    let ctx = { ...getValues(), ...rowValuesRel };
    for (const [relKey, v] of Object.entries(rowValuesRel)) {
      ctx = setDeepValue(ctx, `${tableKey}.${activeIdx}.${relKey}`, v);
    }

    // Validate the selected row with the row-only schema
    const rowSchema = buildSchema(leafFS, ctx);
    const result = await rowSchema.safeParseAsync(rowValuesRel);

    if (!result.success) {
      // Map Zod errors (RELATIVE) -> ABSOLUTE; set RHF errors for UI
      const invalid = result.error.errors.map(err => {
        const relPath = Array.isArray(err.path) ? err.path.join('.') : String(err.path ?? '');
        const absPath = `${tableKey}.${activeIdx}.${relPath}`;
        const value = getDeepValue(rowValuesRel, relPath);
        setError(absPath as any, { type: 'manual', message: err.message });
        return { field: absPath, error: err.message, value };
      });

      // Focus the first invalid field
      const first = invalid[0]?.field;
      if (first) {
        const el =
          document.querySelector<HTMLElement>(`[name="${first}"]`) ??
          document.querySelector<HTMLElement>(`[data-field-key="${first}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus?.();
      }

      onSubmit?.({ valid: false, invalidFields: invalid });
      return; // abort submit
    }

    // Selected row is valid → continue checking other DataTables (if any)
    continue;
  }

  // No row selected → existing draft validation (unchanged)...
  let draftValues: Record<string, any> = {};
  let hasDraftValue = false;

  leafFS.forEach(fs => {
    const val = getDeepValue(getValues(), `${tableKey}.${fs.name}`);
    draftValues = setDeepValue(draftValues, fs.name!, val);
    if (val != null && val !== '' && !(typeof val === 'boolean' && val === false)) {
      hasDraftValue = true;
    }
  });

  if (!hasDraftValue) continue;

  const draftSchema = buildSchema(leafFS, draftValues);
  const result = await draftSchema.safeParseAsync(draftValues);

  if (!result.success) {
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

    onSubmit?.({
      valid: false,
      invalidFields: result.error.errors.map(err => {
        const rel = Array.isArray(err.path) ? err.path.join('.') : String(err.path ?? '');
        return { field: `${tableKey}.${rel}`, error: err.message, value: getDeepValue(draftValues, rel) };
      }),
    });
    return;
  }
}

        // ─── 2) All drafts OK → run your normal handleSubmit ───
        handleSubmit(
          () => {
            // AFTER
            const formValues = getValues();
            let fullPayload = { ...formValues };
            Object.entries(tableDataMap).forEach(([path, rows]) => {
              fullPayload = setDeepValue(fullPayload, path, rows); // ✅ reassign
            });
            onSubmit({ valid: true, values: fullPayload as T });

          },
          errs => {
            const invalid: SubmitResult<T>['invalidFields'] = [];
            const curr = getValues() as any;
            const traverse = (path: string, node: any) => {
              if (node?.message) {
                const value = path.split('.').reduce((a: any, k: string) => a?.[k], curr);
                invalid.push({ field: path, error: node.message, value });
              } else if (typeof node === 'object') {
                Object.entries(node).forEach(([k, v]) =>
                  traverse(path ? `${path}.${k}` : k, v)
                );
              }
            };
            Object.entries(errs).forEach(([k, v]) => traverse(k, v));

            if (invalid.length) {
              const firstField = invalid[0].field;
              const wrapper = document.querySelector<HTMLElement>(
                `[data-field-key="${firstField}"]`
              );
              if (wrapper) {
                // 1) Smooth scroll into view
                wrapper.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                  inline: 'nearest',
                });

                // 2) Use IntersectionObserver to wait until it's actually visible
                const obs = new IntersectionObserver(
                  ([entry], observer) => {
                    if (entry.isIntersecting) {
                      const input = wrapper.querySelector<HTMLElement>(
                        `[name="${firstField}"]`
                      );
                      input?.focus();
                      observer.disconnect();
                    }
                  },
                  {
                    root: null,
                    threshold: 0.1,
                    rootMargin: '-20% 0px',
                  }
                );

                obs.observe(wrapper);
              }
            }
            onSubmit({ valid: false, invalidFields: invalid });
          }
        )();
      },
      getValues: () => getValues() as T,
    }),
    [handleSubmit, onSubmit, getValues, activeRowIndexMap, tableDataMap, trigger, setError]
  );

  // Subscribe to ALL form changes so your renderSection() sees updated getValues()
  watch();

  const handleChange = () => {
    onChange?.(getValues() as T);
  };

  return (
    <FormWrapper onSubmit={e => e.preventDefault()}>
      {loading
        ? renderSkeletonSection(fieldSettings, getValues())
        : renderSection(
          fieldSettings,
          errors,
          handleChange,
          control,
          z,
          globalDisabled,
          dataSource,
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
          null
        )}
    </FormWrapper>
  );
});
