import React from 'react'
import { getValidationError } from '../../utils/validation'
import { getDeepValue } from '../../utils'
import { ColumnSetting } from '../../interface'
import { Icon } from '../../../../atoms/Icon'
import { ActionContainer } from './styled'

export const DATA_TABLE_ROW_ACTION_ID = 'data-table-row-action'

interface RowActionsProps {
  columnSettings: ColumnSetting[]
  handleSaveRow: (rowId: string) => void
  handleCancelRow: (rowId: string) => void
  handleDelete: (rowId: string) => void
  enableRowDeleting?: boolean
  disabledRows?: string[]
}

export const RowActionsColumn = ({
  columnSettings,
  handleSaveRow,
  handleCancelRow,
  handleDelete,
  enableRowDeleting,
  disabledRows
}: RowActionsProps) => ({
  id: DATA_TABLE_ROW_ACTION_ID,
  header: 'Actions',
  size: 65,
  enableResizing: false,
  enablePinning: false,
  enableSorting: false,
  meta: { className: 'custom-column' },
  cell: ({ row }) => {
    const rowData = row.original as any
    const isDisabled = disabledRows?.includes((row.original as any).__internalId)

    if (rowData.__isNew) {
      const getDisabledStatus = (disabled) => typeof disabled === 'function' ? disabled(rowData) : disabled

      const hasError = columnSettings.some((col: ColumnSetting) =>
        col.editor !== false &&
        col.editor?.validation &&
        (!getDisabledStatus(col.disabled) &&
        getValidationError(getDeepValue(rowData, col.column), col.editor.validation)))

      return (
        <ActionContainer>
          <button
            data-testid={`save-row-button-${row.id}`}
            disabled={isDisabled || hasError}
            className='save'
            title='Save'
            onClick={() => handleSaveRow(rowData.__internalId)}
          >
            <Icon icon='check'/>
          </button>
          <button data-testid={`cancel-row-button-${row.id}`} disabled={isDisabled} className='cancel' title='Cancel' onClick={() => handleCancelRow(rowData.__internalId)}>
            <Icon icon='clear'/>
          </button>
        </ActionContainer>
      )
    }

    return enableRowDeleting ? (
      <ActionContainer>
        <button data-testid={`delete-row-button-${row.id}`} disabled={isDisabled} className='delete' title='Delete'onClick={() => handleDelete(rowData.__internalId)}>
          <Icon icon='delete_forever'/>
        </button>
      </ActionContainer>
    ) : '#'
  },
})
