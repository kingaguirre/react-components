// src/poc/Form/index.tsx
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  SettingsItem,
  FieldGroup,
  FieldSetting,
  DynamicFormProps,
  DynamicFormRef,
  SubmitResult,
} from './interface';

import {
  getKey,
  flattenForSchema,
  buildSchema,
  isZodRequired,
  resolveDisabled,
} from './utils';

import FieldErrorBoundary from './components/FieldErrorBoundary';
import VirtualizedItem from './components/VirtualizedItem';
import renderSkeletonSection from './components/Skeleton';

import { FormControl } from '../../atoms/FormControl';
import { DatePicker } from '../../molecules/DatePicker';
import { Dropdown } from '../../molecules/Dropdown';
import { Grid, GridItem } from '../../atoms/Grid';
import { Tabs } from '../../organisms/Tabs';

import {
  PageHeader,
  FieldsWrapper,
  SubHeader,
  FormWrapper,
  Description
} from './styled';

import './validation';

// Type guards
const isFieldGroup = (item: SettingsItem): item is FieldGroup => 'header' in item;
const hasTabs = (item: SettingsItem): item is FieldGroup =>
  isFieldGroup(item) && Array.isArray(item.tabs) && item.tabs.length > 0;
const hasFields = (item: SettingsItem): item is FieldGroup =>
  isFieldGroup(item) && Array.isArray(item.fields) && item.fields.length > 0;

/**
 * Renders the real form fields (with virtualization & error boundaries).
 */
const renderSection = (
  items: SettingsItem[],
  errors: any,
  onChange: () => void,
  control: any,
  z: typeof import('zod'),
  globalDisabled: boolean,
  originalData: Record<string, any>,
  getValues: () => Record<string, any>,
  trigger: (name: string) => Promise<boolean>,
  conditionalKeys: string[]
): React.ReactNode[] => {
  const values = getValues();
  const nodes: React.ReactNode[] = [];
  let standalone: FieldSetting[] = [];
  let flushCount = 0;

  const flush = () => {
    if (!standalone.length) return;
    nodes.push(
      <FieldsWrapper key={`flush-${flushCount++}`}>
        <Grid>
          {standalone.map(fs => {
            const key = getKey(fs)!;
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
                      defaultValue={(control._formValues as any)[key]}
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
                          if (fs.type === 'date' && v instanceof Date) {
                            v = v.toISOString();
                          }
                          field.onChange(v);
                          onChange();
                          conditionalKeys.forEach(k => void trigger(k as any));
                        };

                        const common: any = {
                          ...field,
                          value: displayValue,
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
          {group.isSubHeader
            ? <SubHeader>{group.header}</SubHeader>
            : <PageHeader>{group.header}</PageHeader>}
          {group.description && <Description>{group.description}</Description>}
          <Tabs
            key={`tabs-${idx}-${tabsKey}`}       // ← dynamic key here
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
                    trigger,
                    conditionalKeys
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
          {group.isSubHeader
            ? <SubHeader>{group.header}</SubHeader>
            : <PageHeader>{group.header}</PageHeader>}
          {group.description && <Description>{group.description}</Description>}
          <FieldsWrapper $hasHeader>
            {renderSection(
              group.fields!,
              errors,
              onChange,
              control,
              z,
              globalDisabled,
              originalData,
              getValues,
              trigger,
              conditionalKeys
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
    if (!isFieldHidden) {
      standalone.push(fs);
    }
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

  const baseSchema = buildSchema(
    flattenForSchema(fieldSettings),
    dataSource
  );
  type FormData = z.infer<typeof baseSchema>;

  const dynamicResolver: Resolver<FormData> = async (
    values,
    context,
    options
  ) => {
    const schema = buildSchema(flattenForSchema(fieldSettings), values);
    return zodResolver(schema)(values, context, options);
  };

  const {
    control,
    handleSubmit,
    getValues,
    trigger,
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
        .filter(fs => fs.validation?.length === 2)
        .map(fs => getKey(fs)!),
    [fieldSettings]
  );

  useImperativeHandle(
    ref,
    () => ({
      submit: () =>
        handleSubmit(
          vals => onSubmit({ valid: true, values: vals as T }),
          errs => {
            const invalid: SubmitResult<T>['invalidFields'] = [];
            const curr = getValues() as any;

            const traverse = (path: string, node: any) => {
              if (node?.message) {
                const value = path
                  .split('.')
                  .reduce((a: any, k: string) => a?.[k], curr);
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
        )(),
      getValues: () => getValues() as T,
    }),
    [handleSubmit, onSubmit, getValues]
  );

  const handleChange = () => {
    onChange?.(getValues() as T);
  };

  return (
    <FormWrapper onSubmit={e => e.preventDefault()}>
      {loading
        ? renderSkeletonSection(fieldSettings)
        : renderSection(
          fieldSettings,
          errors,
          handleChange,
          control,
          z,
          globalDisabled,
          dataSource,
          getValues,
          trigger,
          conditionalKeys
        )}
    </FormWrapper>
  );
});
