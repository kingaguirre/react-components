// src/molecules/Dropdown/interface.ts
export interface DropdownOption {
  value: string;
  text: string;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  /** For single select, pass a string; for multiselect, pass an array of strings */
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  filter?: boolean;
  filterAtBeginning?: boolean;
  placeholder?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  multiselect?: boolean;
  label?: string;
  required?: boolean;
  color?: string;
  helpText?: string;
}
