import { ColumnDef } from '@tanstack/react-table'

export interface DataTableProps {
  /** Data to display in the table */
  dataSource: any[]
  /** Column definitions for the table */
  columnSettings: ColumnDef<any>[]
}
