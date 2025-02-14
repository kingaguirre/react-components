import { ColumnDef } from '@tanstack/react-table'
import { getValidationError } from '../../utils/validation'
import { ColumnSetting } from '../../interface'

interface RowActionsProps<T> {
  columnSettings: ColumnSetting[]
  handleSaveRow: (rowId: string) => void
  handleCancelRow: (rowId: string) => void
  handleDelete: (rowId: string) => void
}

export const RowActionsColumn = <T extends object>({
  columnSettings,
  handleSaveRow,
  handleCancelRow,
  handleDelete,
}: RowActionsProps<T>): ColumnDef<T, any> => ({
  id: 'rowActions',
  header: 'Actions',
  cell: ({ row }) => {
    const rowData = row.original as any
    if (rowData.__isNew) {
      const hasError = columnSettings.some((col: ColumnSetting) =>
        col.editor !== false &&
        col.editor?.validation &&
        getValidationError(rowData[col.column], col.editor.validation)
      );

      return (
        <>
          <button onClick={() => handleSaveRow(rowData.__internalId)} disabled={hasError}>
            Save
          </button>
          <button onClick={() => handleCancelRow(rowData.__internalId)}>
            Cancel
          </button>
        </>
      )
    }
    return (
      <button onClick={() => handleDelete(rowData.__internalId)}>
        Delete
      </button>
    )
  },
  size: 100,
  enableSorting: false,
})
