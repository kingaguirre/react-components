import { SizeType, ColorType } from "../../common/interface";

export interface DropdownOption {
  value: string;
  text: string;
  disabled?: boolean;
}

/** Configuration for the “custom option” add flow (formerly “Others”). */
export interface CustomOptionConfig {
  /** Placeholder/label for the inline input row. Default: "Others" */
  label?: string;
  /** Text prefix for the created option’s visible label. Default: "Others - " */
  prefix?: string;
  /** Button text for the small action at the right. Default: "Add" */
  addText?: string;
  /**
   * Callback when a custom option is created.
   * `option.text` already includes the prefix; `rawText` is the user’s raw input.
   */
  onAdd?: (option: DropdownOption, rawText: string) => void;
  /**
   * Callback when a custom option’s label is edited inline.
   * - `prev` is the original option (immutable reference).
   * - `next` is the updated option (same `value`, new `text` that already includes the prefix).
   * - `rawText` is the user’s raw input, without the prefix.
   *
   * Use this to persist the edit. Do **not** change `value`; it remains the original custom id (e.g., `custom-...`).
   */
  onEdit?: (
    prev: DropdownOption,
    next: DropdownOption,
    rawText: string,
  ) => void;
  /**
   * ✅ Persisted custom options (merged with session-created options).
   * These appear below session-created options and above base `options`.
   */
  options?: DropdownOption[];
  /** Allow creating custom options more than once. Default: false (hide "Others" after first add) */
  allowMultiple?: boolean;
  /** Place the "Others" row at the top instead of bottom. Default: false (bottom) */
  optionAtTop?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  /** For single select, pass a string; for multiselect, pass an array of strings */
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

  /** Enable generic custom-option flow (replaces `enableOthers`) */
  enableCustomOption?: boolean;
  /** Config object for custom-option flow (now contains persisted options) */
  customOption?: CustomOptionConfig;

  [key: string]: any;
}
