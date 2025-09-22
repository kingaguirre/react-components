import { ColorType, SizeType } from "../../common/interface";

export type FormControlType =
  | "text"
  | "password"
  | "email"
  | "number"
  | "checkbox"
  | "radio"
  | "checkbox-group"
  | "radio-group"
  | "switch-group"
  | "radio-button-group"
  | "switch"
  | "textarea";

export type IconRight = {
  icon: string;
  title?: string;
  color?: string;
  hoverColor?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
};

export interface FormControlProps {
  /** Label for the input */
  label?: string;
  /** Help text displayed below the input */
  helpText?: string;
  /** Color theme for the input */
  color?: ColorType;
  /** Variant style of the input */
  variant?: "outlined";
  /** Size of the input */
  size?: SizeType;
  /** Input type */
  type?: FormControlType;
  /** Options for group inputs (checkbox-group, radio-group, switch-group) */
  options?: { value: string; text: string; disabled?: boolean }[];
  /** Options for group inputs to set to align vertically */
  isVerticalOptions?: boolean;
  /** Required attribute */
  required?: boolean;
  /** Pattern for input validation */
  pattern?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Read-only state */
  readOnly?: boolean;
  /** Text only available in checkbox or radio */
  text?: string;
  /** Input name value */
  name?: string;
  /** Prop to remove undeline and extra padding and height for radio, checkbox, switch, radio-group, checkbox-group, switch-group */
  simple?: boolean;
  /** Right icon with max of 2 */
  iconRight?: IconRight[];
  /** Custom class */
  className?: string;
  /** Attach test-id in the input */
  testId?: string;
  /** Add loader */
  loading?: boolean;
  /** Whether the input can be cleared */
  clearable?: boolean;
  /** Callback when clear icon is clicked */
  onClearIcon?: () => void;
  /** Show disabled icon when input is disabled */
  showDisabledIcon?: boolean;
  /** Whether the FormControl has rounded edges */
  rounded?: boolean;
  /** Any additional attributes */
  [key: string]: any;
}
