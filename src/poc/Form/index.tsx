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
          fields: prefixItems(dt.fields, cleanPath),
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
): React.ReactNode[] => {
  const rowSnapshots = React.useRef<Record<string, any>>({});
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
            const err = key
              .split('.')
              .reduce((a: any, k: string) => a?.[k], errors)?.message;

            const schemaForRequired = fs.validation
              ? fs.validation(z, values)
              : z.any();
            const isReq = isZodRequired(schemaForRequired);
            const isConditional = fs.validation?.length === 2;

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
                      defaultValue={getDeepValue(originalData, key) ?? (isBooleanControl(fs) ? false : '')}
                      render={({ field, fieldState }) => {
                        const errorMsg = isConditional
                          ? fieldState.error?.message
                          : err;

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
      const activeIdx = activeRowIndexMap?.[mapKey] || null;
      const isHidden   = typeof hidden === 'function' ? hidden(values) : !!hidden;
      const isDisabled = globalDisabled 
        || (typeof disabled === 'function' ? disabled(values) : !!disabled);

      if (isHidden) {
        flush();
        return;  // don’t render the table or any of its child fields
      }

      const tableData = tableDataMap[mapKey] ?? [];

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
            <DataTable
              maxHeight="176px"
              pageSize={5}
              dataSource={tableData}
              columnSettings={config.columnSettings}
              disabled={isDisabled}
              activeRow={activeRowIndexMap[mapKey]?.toString()}
              onChange={newData => {
                setValue(config.dataSource, newData);
                onChange();
              }}

              onActiveRowChange={(rowData, rowIndex) => {
                // 1) track which index is active
                setActiveRowIndexMap((prev: any) => ({ ...prev, [mapKey]: rowData ? rowIndex : null }));

                // 2) snapshot the exact row object the user clicked
                rowSnapshots.current[mapKey] = rowData ? { ...rowData } : null;

                // seed form values
                const flat = dtFields.flatMap(f => 'fields' in f ? (f as FieldGroup).fields : [f as FieldSetting]);
                flat.forEach((fs: any) => {
                  const raw = fs.name! ?? '';
                  const full = `${mapKey}.${rowIndex}.${raw}`;
                  let val: any = '';
                  if (rowData) val = raw.split('.').pop().split('.').reduce((o: any, seg) => o?.[seg], rowData);
                  else if (isBooleanControl(fs)) val = false;
                  else if (fs.type === 'number') val = undefined;
                  setValue(full, val);
                  trigger(full);
                });
              }}
            />

            {/* ───────── DataTable Action Buttons ───────── */}
            {(() => {
              // 1) flatten your row-fields
              const flatFields = dtFields.flatMap(f =>
                'fields' in f ? f.fields : [f as FieldSetting]
              );

              // 2) pull the current RHF values for each draft field
              const draftValues = flatFields.map((fs: any) => {
                // when no row is selected, you named your draft inputs as `${mapKey}.${fs.name}`
                const path = `${mapKey}.${fs.name}`;
                return getDeepValue(getValues(), path);
              });

              // 3) see if any of them is non-empty
              const hasDraft = draftValues.some(v =>
                v != null && v !== '' && !(typeof v === 'boolean' && v === false)
              );

              // 4) enable Add iff no row is selected and there’s some draft input
              const canAdd = activeIdx == null && hasDraft;
              const canCancel = activeIdx != null || hasDraft;

              return (
                <ButtonContainer>
                  {/* Add */}
                  <Button
                    size='sm'
                    variant={canAdd ? 'outlined' : undefined}
                    disabled={!canAdd}
                    onClick={async () => {
                      // ─── 1) Flatten out just your draft‐row FieldSettings ───
                      const flatDraftSettings = dtFields
                        .flatMap(f => ('fields' in f ? f.fields : [f as FieldSetting])) as FieldSetting[];

                      // ─── 2) Build a Zod schema for those fields ───
                      const draftSchema = buildSchema(
                        flattenForSchema(flatDraftSettings),
                        {}  // no defaults needed here
                      );

                      // ─── 3) Collect current draft values from RHF ───
                      const draftValues: Record<string, any> = {};
                      flatDraftSettings.forEach(fs => {
                        draftValues[fs.name!] = getDeepValue(getValues(), `${mapKey}.${fs.name}`);
                      });

                      // ─── 4) Run safeParseAsync so we get all errors at once ───
                      const result = await draftSchema.safeParseAsync(draftValues);
                      if (!result.success) {
                        // a) Push each Zod error back into RHF
                        result.error.errors.forEach(err => {
                          const fieldKey = err.path[0] as string;
                          setError(
                            `${mapKey}.${fieldKey}` as any,
                            { type: 'manual', message: err.message },
                          );
                        });

                        // b) Scroll/focus the first error
                        const badField = result.error.errors[0].path[0];
                        const el = document.querySelector<HTMLElement>(
                          `[name="${mapKey}.${badField}"]`
                        );
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          el.focus();
                        }
                        return; // abort the Add
                      }

                      // ─── 5) All good → build and prepend the new row ───
                      const newRow = flatDraftSettings.reduce<Record<string, any>>((row, fs) => {
                        row[fs.name!] = getDeepValue(getValues(), `${mapKey}.${fs.name}`);
                        return row;
                      }, {});

                      setTableDataMap(prev => ({
                        ...prev,
                        [mapKey]: [newRow, ...(prev[mapKey] || [])],
                      }));
                      setValue(mapKey, [newRow, ...(tableDataMap[mapKey] || [])]);
                      onChange();

                      // ─── 6) Clear draft inputs ───
                      flatDraftSettings.forEach(fs => {
                        const p = `${mapKey}.${fs.name}`;
                        setValue(p, isBooleanControl(fs) ? false : '');
                      });
                    }}
                  >
                    Add
                  </Button>

                  {/* Update */}
                  <Button
                    size='sm'
                    disabled={activeIdx == null}
                    onClick={async () => {
                      if (activeIdx == null) return;

                      // 1) collect the full field names for this row
                      const fieldNames: any = dtFields
                        .flatMap(f => ('fields' in f ? (f as FieldGroup).fields : [f as FieldSetting]))
                        .map((fs: any) => `${mapKey}.${activeIdx}.${fs.name}`);

                      // 2) run validation on all of them
                      const isValid = await trigger(fieldNames);
                      if (!isValid) {
                        // `errors` is the same object you passed into renderSection
                        const firstInvalid = fieldNames.find(name => {
                          // drill into nested errors: e.g. errors.users?.[0]?.firstName
                          return name.split('.').reduce((obj: any, k) => obj?.[k], errors);
                        });
                        if (firstInvalid) {
                          const errEl = document.querySelector(`[name="${firstInvalid}"]`);
                          if (errEl instanceof HTMLElement) {
                            errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            errEl.focus();
                          }
                        }
                        // ────────────────────────────────────────────────
                        return;
                      }

                      // 3) all good → build updatedRow as before
                      const before = rowSnapshots.current[mapKey] || {};
                      const formVals = getValues();
                      const updatedRow = { ...before };
                      dtFields
                        .flatMap(f => ('fields' in f ? (f as FieldGroup).fields : [f as FieldSetting]))
                        .forEach((fs: any) => {
                          const name = fs.name!;
                          const fullPath = `${mapKey}.${activeIdx}.${name}`;
                          updatedRow[name] = getDeepValue(formVals, fullPath);
                        });

                      // 3.5) guard: if nothing actually changed, bail out
                      if (JSON.stringify(before) === JSON.stringify(updatedRow)) {
                        return;
                      }

                      // 4) commit it
                      const newTable = [...(tableDataMap[mapKey] ?? [])];
                      newTable[activeIdx] = updatedRow;
                      setTableDataMap(m => ({ ...m, [mapKey]: newTable }));
                      setValue(mapKey, newTable);
                      rowSnapshots.current[mapKey] = { ...updatedRow };
                      onChange();
                    }}
                  >
                    Update
                  </Button>

                  {/* Delete */}
                  <Button
                    size='sm'
                    color='danger'
                    variant={activeIdx !== null ? 'outlined' : undefined}
                    disabled={activeIdx == null}
                    onClick={() => {
                      if (activeIdx == null) return;

                      // 1) Pull the right array out of your React state:
                      const current = tableDataMap[mapKey] ?? [];

                      // 2) Filter out the selected index:
                      const newTable = current.filter((_, i) => i != activeIdx);

                      // 3) Commit back into your state map:
                      setTableDataMap(prev => ({
                        ...prev,
                        [mapKey]: newTable,
                      }));

                      // 4) Clear snapshot & selection so the form fields disappear
                      rowSnapshots.current[mapKey] = null;
                      setActiveRowIndexMap(prev => ({
                        ...prev,
                        [mapKey]: null,
                      }));

                      // 5) If you still mirror into RHF’s dataSource:
                      setValue(mapKey, newTable);

                      // 6) Finally, notify your parent:
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
                      clearErrors(
                        flatFields.map((fs: any) => `${mapKey}.${fs.name}`)
                      );
                      // 3) clear all draft inputs
                      flatFields.forEach((fs: any) => {
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

            {/* Recursive render for dtFields with id prefix */}
            {renderSection(
              prefixItems(dtFields, childPath),
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
              setTableDataMap
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
              items={visible.map((sec, i) => ({
                id: sec.id ?? `${group.header}-sec-${i}`,
                title: sec.title,
                open: sec.open,
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
                      setTableDataMap
                    )}
                  </React.Fragment>
                ),
                disabled:
                  typeof sec.disabled === 'function'
                    ? sec.disabled(values)
                    : sec.disabled,
                rightContent: sec.rightContent,
                rightDetails: sec.rightDetails,
                onClick: sec.onClick,
              }))}
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
                    setTableDataMap
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
              setTableDataMap
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
        // Find the original DataTable section
        const dtSection = fieldSettings.find(
          it => (it as any).dataTable?.config?.dataSource === tableKey
        ) as ({ dataTable: DataTableSection }) | undefined;
        if (dtSection) {
          // Prefix and include its fields
          itemsForSchema.push(
            ...prefixItems(
              dtSection.dataTable.fields,
              `${tableKey}.${rowIndex}`
            )
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
        for (const item of fieldSettings.filter(hasDataTable)) {
          const dt        = (item as { dataTable: DataTableSection }).dataTable;
          const tableKey  = dt.config.dataSource;
          const dtFields  = dt.fields;

          // flatten your draft FieldSettings
          const flatDraftSettings = dtFields
            .flatMap(f => ('fields' in f ? f.fields : [f as FieldSetting])) as FieldSetting[];

          // collect current draft values & check if there's any value
          const draftValues: Record<string, any> = {};
          let hasDraftValue = false;
          flatDraftSettings.forEach(fs => {
            const val = getDeepValue(getValues(), `${tableKey}.${fs.name}`);
            draftValues[fs.name!] = val;
            if (val != null && val !== '' && !(typeof val === 'boolean' && val === false)) {
              hasDraftValue = true;
            }
          });
          if (!hasDraftValue) continue;  // no draft here, skip

          // build a tiny Zod schema for these draft fields
          const draftSchema = buildSchema(
            flattenForSchema(flatDraftSettings),
            {}
          );
          const result = await draftSchema.safeParseAsync(draftValues);

          if (!result.success) {
            // a) push each Zod error into RHF
            result.error.errors.forEach(err => {
              const key = err.path[0] as string;
              setError(`${tableKey}.${key}` as any, { type: 'manual', message: err.message });
            });

            // b) build an array of invalidFields for onSubmit
            const invalidFields: SubmitResult<T>['invalidFields'] = result.error.errors.map(err => {
              const key = err.path[0] as string;
              return {
                field: `${tableKey}.${key}`,
                error: err.message,
                value: draftValues[key],
              };
            });

            // c) scroll/focus the first error
            const bad = result.error.errors[0].path[0];
            const el = document.querySelector<HTMLElement>(`[name="${tableKey}.${bad}"]`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.focus();
            }

            // d) notify caller that submit failed on draft validation
            onSubmit({ valid: false, invalidFields });
            return;
          }
        }

        // ─── 2) All drafts OK → run your normal handleSubmit ───
        handleSubmit(
          () => {
            const formValues = getValues();
            const fullPayload = { ...formValues };
            Object.entries(tableDataMap).forEach(([path, rows]) => {
              setDeepValue(fullPayload, path, rows);
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
    [handleSubmit, onSubmit, getValues]
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
          setTableDataMap
        )}
    </FormWrapper>
  );
});
