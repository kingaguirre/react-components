// src/molecules/Dropdown/interface.ts
import { SizeType, ColorType } from "../../common/interface";

export interface DropdownOption {
  value: string;
  text: string;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  /** For single select, pass a string for multiselect, pass an array of strings */
  value?: string | string[];
  onChange?: (value: string | string[] | null) => void;
  filter?: boolean;
  filterAtBeginning?: boolean;
  placeholder?: string;
  size?: SizeType;
  disabled?: boolean;
  multiselect?: boolean;
  label?: string;
  required?: boolean;
  color?: ColorType;
  helpText?: string | null;
  dropdownHeight?: number;
  dropdownWidth?: number;
  hideOnScroll?: boolean;
  onFilterChange?: (filterText: string) => void;
  loading?: boolean;
  /** Whether the input can be cleared */
  clearable?: boolean;
  /** Callback when clear icon is clicked */
  onClearIcon?: () => void;
  /** Show disabled icon when input is disabled */
  showDisabledIcon?: boolean;

  [key: string]: any;
}
