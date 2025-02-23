import { z, ZodSchema, ZodTypeAny, ZodTypeDef } from 'zod'

export interface DataTableProps<T extends object> {
  /** Data to display in the table */
  dataSource: T[]
  /** Column definitions for the table */
  columnSettings: ColumnSetting[]
  /** Returns updated date */
  onChange?: (updatedData: T[]) => void;
}

export type EditorType = 
  | 'text'
  | 'textarea'
  | 'date'
  | 'date-range'
  | 'select'
  | 'number'
  | 'number-range'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'checkbox-group'
  | 'radio-group'
  | 'switch-group'

type CellType = {rowValue: any; index: number }

export type ValidatorHelper = {
  schema: (json: { type: string; pattern?: string }, errorMessage?: string) => ZodTypeAny;
} & typeof z;

export interface ColumnSetting {
  title: string             // Header title for the column
  column: string            // Field name (accessor)
  groupTitle?: string       // Optional group header columns sharing this value will be nested
  sort?: 'asc' | 'desc' | undefined | false // Initial sort order false disables sort for this column
  pin?: 'pin' | 'unpin' | false // 'pin' pins left (default unpinned) false disables pinning
  hidden?: boolean
  // editor?: 'text' | 'date' | 'date-range' | 'select' | 'number' | 'number-range' | 'checkbox' | 'radio' | 'switch' | 'checkbox-group' | 'radio-group' | 'switch-group' | false
  width?: number            // Default width
  minWidth?: number         // Minimum width
  maxWidth?: number         // Maximum width
  cell?: ({ rowValue, index }: CellType) => JSX.Element // Optional custom cell renderer
  // validation?: (v: ValidatorHelper) => ZodSchema<any>
  editor?: {
    type?: EditorType
    validation?: (v: ValidatorHelper) => ZodSchema<any>
  } | false
  filter?: { type?: string, options?: any[] } | undefined | false
}

export type EditingCellType = { rowId: string; columnId: string } | null
