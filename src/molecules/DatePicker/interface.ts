import { ColorType, SizeType } from '@common/interfaces';

export interface DatePickerProps {
  label?: string;
  selectedDate?: string | Date | null | [string, string] | [Date | null, Date | null];
  onChange?: (date: string | [string, string] | null) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  range?: boolean;
  color?: ColorType;
  size?: SizeType;
  minDate?: Date;
  maxDate?: Date;
  helpText?: string;
}

export interface CustomInputProps {
  /** The current value of the input (typically a formatted date string) */
  value?: string;
  /** Function called when the input is clicked */
  onClick?: () => void;
  /** Label for the input field */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Color theme for the input */
  color?: ColorType;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Help text to display under the input */
  helpText?: string;
  /**
   * Function to handle clearing the input.
   * @param e - The mouse event.
   * @param onClick - Optional onClick callback that can be triggered after clearing.
   */
  handleClear: (e: React.MouseEvent<HTMLElement>, onClick?: () => void) => void;
}
