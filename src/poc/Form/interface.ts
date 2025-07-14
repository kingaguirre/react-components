// src/poc/Form/interface.ts

import { ZodTypeAny } from 'zod';

export interface ColSpan {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
}

export type FieldType =
  | 'text'
  | 'number'
  | 'textarea'
  | 'dropdown'
  | 'date'
  | 'email'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'radio-group'
  | 'checkbox-group'
  | 'radio-button-group'
  | 'switch-group';

export interface SelectOption {
  value: string;
  text: string;
}

export interface FieldSetting {
  name?: string;
  id?: string;
  label?: string;

  // mutually exclusive group
  header?: never;
  fields?: never;
  tabs?: never;

  type?: FieldType;
  /** pass z and full dataSource to enable conditional schemas */
  validation?: (z: typeof import('zod'), data?: Record<string, any>) => ZodTypeAny;

  options?: SelectOption[];
  col?: ColSpan;

  disabled?: boolean | ((values?: Record<string, any>) => boolean);
  hidden?: boolean | ((values?: Record<string, any>) => boolean);
  placeholder?: string;
}

export interface TabConfig {
  title: string;
  fields: SettingsItem[];
  hidden?: boolean | ((values?: Record<string, any>) => boolean);
}

export interface FieldGroup {
  header: string;
  isSubHeader?: boolean;
  description?: string;
  fields?: SettingsItem[];
  tabs?: TabConfig[];
  hidden?: boolean | ((values?: Record<string, any>) => boolean);
}

export type SettingsItem = FieldSetting | FieldGroup;

export interface SubmitResult<T> {
  valid: boolean;
  values?: T;
  invalidFields?: Array<{ field: string; error: string; value: any }>;
}

export interface DynamicFormProps<T extends Record<string, any>> {
  fieldSettings: SettingsItem[];
  dataSource: T;
  onSubmit: (result: SubmitResult<T>) => void;
  onChange?: (values: T) => void;

  disabled?: boolean;
  loading?: boolean;
}

export interface DynamicFormRef<T> {
  submit: () => void;
  getValues: () => T;
}
