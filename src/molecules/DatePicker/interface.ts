import { ColorType, SizeType } from '../../common/interface'

export interface DatePickerProps {
  label?: string
  value?: string | Date | null | [string, string] | [Date | null, Date | null]
  onChange?: (date: string | [string, string] | null) => void
  required?: boolean
  disabled?: boolean
  placeholder?: string
  range?: boolean
  color?: ColorType
  size?: SizeType
  minDate?: Date
  maxDate?: Date
  helpText?: string | null
  /* eslint-disable @typescript-eslint/no-explicit-any */
  [key: string]: any;
}

export interface CustomInputProps {
  /** The current value of the input (typically a formatted date string) */
  value?: string
  /** Function called when the input is clicked */
  onClick?: () => void
  /** Label for the input field */
  label?: string
  /** Whether the field is required */
  required?: boolean
  /** Whether the field is disabled */
  disabled?: boolean
  /** Color theme for the input */
  color?: ColorType
  /** Size type for the input */
  size?: SizeType
  /** Placeholder text for the input */
  placeholder?: string
  /** Help text to display under the input */
  helpText?: string | null
  /**
   * Function to handle clearing the input.
   * @param e - The mouse event.
   * @param onClick - Optional onClick callback that can be triggered after clearing.
   */
  handleClear: (e: React.MouseEvent<HTMLElement>) => void
  /* eslint-disable @typescript-eslint/no-explicit-any */
  [key: string]: any;
}
