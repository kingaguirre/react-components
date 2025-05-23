import React from 'react'
import { getValidationError } from '../../utils/validation'
import { getDeepValue } from '../../utils'
import { ColumnSetting } from '../../interface'
import { Icon } from '../../../../atoms/Icon'
import { Tooltip } from '../../../../atoms/Tooltip'
import { ActionContainer } from './styled'

export const DATA_TABLE_ROW_ACTION_ID = 'data-table-row-action'

interface RowActionsProps {
  columnSettings: ColumnSetting[]
  handleSaveRow: (rowId: string) => void
  handleCancelRow: (rowId: string) => void
  handleDelete: (rowId: string) => void
  enableRowDeleting?: boolean
  disabledRows?: string[]
  partialRowDeletionID?: string
}

export const RowActionsColumn = ({
  columnSettings,
  handleSaveRow,
  handleCancelRow,
  handleDelete,
  enableRowDeleting,
  disabledRows,
  partialRowDeletionID
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
    const partiallyDeleted = partialRowDeletionID ? rowData?.[partialRowDeletionID] : false

    if (rowData.__isNew) {
      const getDisabledStatus = (disabled) => typeof disabled === 'function' ? disabled(rowData) : disabled

      const hasError = columnSettings.some((col: ColumnSetting) =>
        col.editor !== false &&
        col.editor?.validation &&
        (!getDisabledStatus(col.disabled) &&
        getValidationError(getDeepValue(rowData, col.column), col.editor.validation)))

      return (
        <ActionContainer>
          <Tooltip content='Save' type='title'>
            <button
              data-testid={`save-row-button-${row.id}`}
              disabled={isDisabled || hasError}
              className='save'
              onClick={() => handleSaveRow(rowData.__internalId)}
            >
              <Icon icon='check'/>
            </button>
          </Tooltip>
          <Tooltip content='Cancel' type='title'>
            <button data-testid={`cancel-row-button-${row.id}`} disabled={isDisabled} className='cancel' onClick={() => handleCancelRow(rowData.__internalId)}>
              <Icon icon='clear'/>
            </button>
          </Tooltip>
        </ActionContainer>
      )
    }

    return enableRowDeleting ? (
      <ActionContainer>
        <Tooltip content={partiallyDeleted ? 'Undo' : 'Delete'} type='title'>
          <button
            data-testid={`delete-row-button-${row.id}`}
            disabled={isDisabled}
            className={partiallyDeleted ? 'undo' : 'delete'}
            onClick={() => handleDelete(rowData.__internalId)}
          >
            <Icon icon={partiallyDeleted ? 'rotate_left' : 'delete_forever'}/>
          </button>
        </Tooltip>
      </ActionContainer>
    ) : '#'
  },
})
