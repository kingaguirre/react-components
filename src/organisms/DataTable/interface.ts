import { z, ZodSchema, ZodTypeAny } from "zod";
import { FormControlProps } from "../../atoms/FormControl/interface";
import { ButtonProps } from "../../atoms/Button/interface";
import {
  DropdownProps,
  DropdownOption,
} from "../../molecules/Dropdown/interface";
import { DatePickerProps } from "../../molecules/DatePicker/interface";

export interface DataTableProps {
  /** Data to display in the table */
  dataSource: any[];
  /** Column definitions for the table */
  columnSettings: ColumnSetting[];
  /** Returns updated data */
  onChange?: (data: Omit<DataRow, "__internalId">[]) => void;
  /** Enable filtering for columns */
  enableColumnFiltering?: boolean;
  /** Enable pinning columns */
  enableColumnPinning?: boolean;
  /** Enable dragging of columns */
  enableColumnDragging?: boolean;
  /** Enable sorting of columns */
  enableColumnSorting?: boolean;
  /** Enable resizing of columns */
  enableColumnResizing?: boolean;
  /** Enable editing of cell content */
  enableCellEditing?: boolean;
  /** Enable adding new rows */
  enableRowAdding?: boolean;
  /** Enable deletion of rows */
  enableRowDeleting?: boolean;
  /** Enable deletion of selected rows */
  enableSelectedRowDeleting?: boolean;
  /** Enable row selection */
  enableRowSelection?: boolean;
  /** Enable global table filtering */
  enableGlobalFiltering?: boolean;
  /** Title of the table */
  title?: string;
  /** Alignment of text within cells */
  cellTextAlignment?: "center" | "left" | "right";
  /** Fixed height of the table */
  height?: string;
  /** Maximum height of the table */
  maxHeight?: string;
  /** Number of rows per page */
  pageSize?: number;
  /** Current page index */
  pageIndex?: number;
  /** Enable multi-select for rows */
  enableMultiRowSelection?: boolean;
  /** Disable the data-table */
  disabled?: boolean;
  /** Enable header right control icons */
  headerRightControls?: boolean;
  /** Adds elements in the right part of header before the add button */
  headerRightElements?: HeaderRightElement[];
  /** Key of the currently active row */
  activeRow?: string;
  /** Array of keys identifying selected rows */
  selectedRows?: any[];
  /** Array of row keys that should be disabled. Disabled rows receive a "disabled" CSS class and do not trigger click events. */
  disabledRows?: string[];
  /**
   * Key used to determine if row deletion is permanent.
   * If set, deletion is treated as partial, and the row will include this key with a true value.
   */
  partialRowDeletionID?: string;
  /** Coordinates of the currently selected cell */
  selectedCell?: SelectedCellCoordProp;
  /** Callback when a row is clicked */
  onRowClick?: (
    rowData: any,
    __internalId: string,
    e: React.MouseEvent<HTMLElement>,
  ) => void;
  /** Callback when a row is double-clicked */
  onRowDoubleClick?: (
    rowData: any,
    __internalId: string,
    e: React.MouseEvent<HTMLElement>,
  ) => void;
  /** Callback when column settings change */
  onColumnSettingsChange?: (newColumnSettings: ColumnSetting[]) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (newPageSize: number) => void;
  /** Callback when page index changes */
  onPageIndexChange?: (newPageIndex: number) => void;
  /** Callback when selected rows change */
  onSelectedRowsChange?: (selectedRows: any[]) => void;
  /** Function to use to render collapsible row content */
  expandedRowContent?: (RowData: any) => React.ReactNode;
  /** Callback when the active row changes */
  onActiveRowChange?: (rowData: any, __internalId?: string) => void;
}

export type SelectedCellCoordProp = [number, number] | string;

export type DataTableFormControlType =
  | "text"
  | "number"
  | "checkbox"
  | "switch"
  | "radio"
  | "checkbox-group"
  | "radio-group"
  | "switch-group"
  | "radio-button-group";

export type HeaderRightElement =
  | ({
      type: "button";
      text: string;
      width?: string | number;
    } & Omit<
      ButtonProps,
      "children" // Exclude children since we're using `text`
    >)
  | ({
      type: DataTableFormControlType;
      width?: string | number;
    } & Partial<
      Pick<
        FormControlProps,
        | "name"
        | "value"
        | "placeholder"
        | "disabled"
        | "onChange"
        | "options"
        | "color"
        | "variant"
        | "required"
        | "readOnly"
        | "loading"
        | "pattern"
        | "text"
        | "iconRight"
        | "checked"
        | "testId"
      >
    >)
  | ({
      type: "dropdown";
      width?: string | number;
    } & Partial<
      Pick<
        DropdownProps,
        | "name"
        | "options"
        | "value"
        | "multiselect"
        | "disabled"
        | "onChange"
        | "onFilterChange"
        | "placeholder"
        | "clearable"
        | "loading"
        | "color"
        | "testId"
      >
    >)
  | ({
      type: "date";
      width?: string | number;
    } & Partial<
      Pick<
        DatePickerProps,
        | "name"
        | "value"
        | "disabled"
        | "onChange"
        | "placeholder"
        | "required"
        | "color"
        | "range"
        | "testId"
      >
    >);

export type EditorType =
  | "text"
  | "textarea"
  | "date"
  | "date-range"
  | "dropdown"
  | "number"
  | "checkbox"
  | "radio"
  | "switch"
  | "checkbox-group"
  | "radio-group"
  | "switch-group";

type CellType = {
  rowValue: any;
  index: number;
};

export type ValidatorHelper = {
  schema: (
    json: {
      type: string;
      pattern?: string;
    },
    errorMessage?: string,
  ) => ZodTypeAny;
} & typeof z;

export interface ColumnSetting {
  title: string; // Header title for the column
  column: string; // Field name (accessor)
  groupTitle?: string; // Optional group header columns sharing this value will be nested
  sort?: "asc" | "desc" | undefined | false; // Initial sort order false disables sort for this column
  pin?: "pin" | "unpin" | false; // 'pin' pins left (default unpinned) false disables pinning
  draggable?: boolean;
  hidden?: boolean;
  width?: number; // Default width
  minWidth?: number; // Minimum width
  maxWidth?: number; // Maximum width
  align?: "left" | "center" | "right";
  headerAlign?: "left" | "center" | "right";
  cell?: ({ rowValue, index }: CellType) => JSX.Element | null; // Optional custom cell renderer
  disabled?: boolean | ((rowData: any) => boolean);
  editor?:
    | {
        disabled?: boolean | ((rowData: any) => boolean);
        type?: EditorType;
        validation?: (v: ValidatorHelper, rowData: any) => ZodSchema<any>;
        options?: DropdownOption[];
      }
    | false;
  filter?: FilterType | undefined | false;
  order?: number;
}

export type FilterType = {
  type?: "text" | "number-range" | "dropdown" | "date" | "date-range";
  options?: DropdownOption[];
  filterBy?: "includesString" | "includesStringSensitive";
};

export type EditingCellType = {
  rowId: string;
  columnId: string;
} | null;

export type SelectedCellType = EditingCellType;

export type ColumnPinningType = {
  left?: string[];
  right?: string[];
};

export interface DataRow {
  __internalId: string;
  __isNew?: boolean;
  [key: string]: unknown;
}

// onSortChange: Callback triggered when the sorting order of a column changes.
// onFilterChange: Callback for when column or global filters are applied, modified, or cleared.
// onColumnReorder: Event fired when columns are rearranged via dragging.
// onCellValueChange: Callback for individual cell value updates (in addition to the overall onChange).
// onRowHover: Event triggered when a user hovers over a row (can be used for dynamic styling or tooltips).
// onDataLoad: Callback that fires when new data is loaded, which is useful for handling asynchronous data fetching or error handling.
// onColumnVisibilityChange: Callback when a column’s visibility toggles (if you plan to allow dynamic show/hide of columns).
// customRenderers: A prop to pass in custom render functions for specific columns or cells, increasing flexibility for unique cell content.
