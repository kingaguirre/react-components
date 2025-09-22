// src/organisms/FormRenderer/interface.ts

import { ZodTypeAny } from 'zod';
import { ColorType } from '../../common/interface';
import { ControllerRenderProps,  ControllerFieldState } from 'react-hook-form';
import { ColumnSetting } from '../../organisms/DataTable/interface';

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

  /**
   * If provided, this will be used instead of the built‑in DatePicker/Dropdown/FormControl.
   * You get the RHF field + fieldState + a `common` props object (value/onChange/label/etc).
   */
  render?: (params: {
    field: ControllerRenderProps;
    fieldState:  ControllerFieldState;
    common: {
      name: string;
      value: any;
      onChange: (v: any) => void;
      onBlur: () => void;
      label?: string;
      placeholder?: string;
      helpText?: string;
      required?: boolean;
      color?: string;
      disabled?: boolean;
      [key: string]: any;
    };
  }) => React.ReactNode;
}

export interface AccordionSection {
  title: string;
  fields: SettingsItem[];
  hidden?: boolean | ((values?: Record<string, any>) => boolean);
  disabled?: boolean | ((values?: Record<string, any>) => boolean);
  id?: string;
  rightContent?: React.ReactNode;
  open?: boolean;
  onClick?: () => void;
  rightDetails?: {
    value?: string;
    icon?: string;
    text?: string;
    color?: ColorType;
    iconColor?: ColorType;
    valueColor?: ColorType;
    textColor?: ColorType;
    onClick?: () => void;
  }[];
}

export interface TabConfig {
  title: string;
  fields: SettingsItem[];
  hidden?: boolean | ((values?: Record<string, any>) => boolean);
}

export interface FieldGroup {
  header?: string;
  isSubHeader?: boolean;
  description?: string;

  // now supports either fields, tabs, or accordion
  fields?: SettingsItem[];
  tabs?: TabConfig[];
  accordion?: AccordionSection[];
  allowMultiple?: boolean; // allows multiple collapsed sections in the accordion

  hidden?: boolean | ((values?: Record<string, any>) => boolean);
}

export interface DataTableSection {
  header?: string;
  isSubHeader?: boolean;
  description?: string;
  config: {
    dataSource: string;
    columnSettings: ColumnSetting[];
  };
  /**
   * Allow nested settings: individual fields or groups below table
   */
  fields?: SettingsItem[];
  disabled?: boolean | ((values?: Record<string, any>) => boolean);
  hidden?: boolean | ((values?: Record<string, any>) => boolean);
}

export type SettingsItem =
  | FieldSetting
  | FieldGroup
  | { header?: string; dataTable: DataTableSection };

export interface SubmitResult<T> {
  valid: boolean;
  values?: T;
  invalidFields?: Array<{ field: string; error: string; value: any }>;
}

export interface FormRendererProps<T extends Record<string, any>> {
  fieldSettings: SettingsItem[];
  dataSource: T;
  onSubmit?: (result: SubmitResult<T>) => void;
  onChange?: (values: T) => void;

  disabled?: boolean;
  loading?: boolean;

  stickyHeader?: boolean;
  className?: string;
}

export interface FormRendererRef<T> {
  submit: () => void;
  getValues: () => T;
}
