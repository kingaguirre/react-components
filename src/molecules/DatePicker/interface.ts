export interface DatePickerProps {
  label?: string;
  selectedDate?: string | Date | [string, string] | [Date | null, Date | null];
  onChange?: (date: any) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  range?: boolean;
  color?: "primary" | "success" | "danger" | "info" | "warning" | "default";
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  minDate?: Date;
  maxDate?: Date;
  helpText?: string;
}
