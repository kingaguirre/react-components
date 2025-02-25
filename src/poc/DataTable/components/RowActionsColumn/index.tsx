import { ColumnDef } from '@tanstack/react-table'
import { getValidationError } from '../../utils/validation'
import { ColumnSetting } from '../../interface'
import { Icon } from '@atoms/Icon'
import { ActionContainer } from './styled'

export const DATA_TABLE_ROW_ACTION_ID = 'data-table-row-action'

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
  id: DATA_TABLE_ROW_ACTION_ID,
  header: 'Actions',
  size: 65,
  enableResizing: false,
  enablePinning: false,
  enableSorting: false,
  cell: ({ row }) => {
    const rowData = row.original as any
    if (rowData.__isNew) {

      const hasError = columnSettings.some((col: ColumnSetting) =>
        col.editor !== false &&
        col.editor?.validation &&
        getValidationError(rowData[col.column], col.editor.validation)
      )

      return (
        <ActionContainer>
          <button className='save' title='Save' onClick={() => handleSaveRow(rowData.__internalId)} disabled={hasError}>
            <Icon icon='check'/>
          </button>
          <button className='cancel' title='Cancel' onClick={() => handleCancelRow(rowData.__internalId)}>
            <Icon icon='clear'/>
          </button>
        </ActionContainer>
      )
    }
    return (
      <ActionContainer>
        <button className='delete' title='Delete'onClick={() => handleDelete(rowData.__internalId)}>
          <Icon icon='delete_forever'/>
        </button>
      </ActionContainer>
    )
  },
})
