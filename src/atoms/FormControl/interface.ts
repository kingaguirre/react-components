export interface FormControlProps {
  /** Label for the input */
  label?: string;
  /** Help text displayed below the input */
  helpText?: string;
  /** Color theme for the input */
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default';
  /** Variant style of the input */
  variant?: 'outlined';
  /** Size of the input */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Input type (text, radio, checkbox, etc.) */
  type?: "text"
  | "password"
  | "email"
  | "number"
  | "checkbox"
  | "radio"
  | "date"
  | "date-range"
  | "dropdown"
  | "checkbox-group"
  | "radio-group"
  | "switch-group"
  | "switch"
  | "textarea";
  /** Required attribute */
  required?: boolean;
  /** Pattern for input validation */
  pattern?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Read-only state */
  readOnly?: boolean;
  /** Any additional attributes */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  [key: string]: any;
}
