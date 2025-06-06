// src/molecules/Dropdown/interface.ts
import { SizeType, ColorType } from '../../common/interface'

export interface DropdownOption {
  value: string
  text: string
  disabled?: boolean
}

export interface DropdownProps {
  options: DropdownOption[]
  /** For single select, pass a string for multiselect, pass an array of strings */
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  filter?: boolean
  filterAtBeginning?: boolean
  placeholder?: string
  size?: SizeType
  disabled?: boolean
  multiselect?: boolean
  label?: string
  required?: boolean
  color?: ColorType
  helpText?: string | null
  clearable?: boolean
  dropdownHeight?: number
  dropdownWidth?: number
  hideOnScroll?: boolean
  onFilterChange?: (filterText: string) => void
  loading?: boolean
  /* eslint-disable @typescript-eslint/no-explicit-any */
  [key: string]: any
}
