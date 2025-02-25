import React from 'react'
import { DataTableRow } from './styled'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { Cell } from './Cell'
import { EditingCellType, SelectedCellType } from '../../interface'
import { getValidationError } from '../../utils/validation'
import { useClickAndDoubleClick } from '../../hooks/useClickAndDoubleClick'

export const Row: React.FC<{
  row: any
  activeRow?: string
  disabledRows?: string[]
  onRowClick?: (data: any, e: React.MouseEvent<HTMLElement>) => void
  onRowDoubleClick?: (data: any, e: React.MouseEvent<HTMLElement>) => void
  enableCellEditing: boolean
  editingCell: EditingCellType
  setEditingCell: any
  selectedCell: SelectedCellType
  setSelectedCell: (cell: SelectedCellType) => void
  columnOrder: string[]
}> = ({
  row,
  activeRow,
  disabledRows,
  onRowClick,
  onRowDoubleClick,
  enableCellEditing,
  editingCell,
  setEditingCell,
  selectedCell,
  setSelectedCell,
  columnOrder,
}) => {
  const isActiveRow = activeRow && (row.original as any).__internalId === activeRow
  const isNewRow = (row.original as any).__isNewImported || (row.original as any).__isNew
  const isDisabled = disabledRows?.includes((row.original as any).__internalId)
  const clickHandlers = useClickAndDoubleClick({
    onClick: !isDisabled
      ? (e: React.MouseEvent<HTMLElement>) => {
          const { __internalId, ...cleanRow } = row.original
          onRowClick && onRowClick(cleanRow, e)
        }
      : undefined,
    onDoubleClick: !isDisabled
      ? (e: React.MouseEvent<HTMLElement>) => {
          const { __internalId, ...cleanRow } = row.original
          onRowDoubleClick && onRowDoubleClick(cleanRow, e)
        }
      : undefined,
  })  

  return (
    <DataTableRow
      key={row.id}
      {...clickHandlers}
      $isActiveRow={!!isActiveRow}
      $isDisabled={!!isDisabled}
      $isNewRow={!!isNewRow}
      className={`data-table-row ${isNewRow ? 'new' : ''}${isActiveRow ? 'active' : ''} ${row.getIsSelected() ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
      data-testid={`row-${row.id}`}
      role='row'
    >
      {row.getVisibleCells().map((cell: any, i: number) => {
        const colMeta = cell.column.columnDef.meta ?? {}
        const { editor, validation, columnId, className } = colMeta
        const rawValue = cell.getValue()
        const isEditable = editor !== false
        const isNotEditMode = !editingCell ||
          editingCell.rowId !== (row.original as any).__internalId ||
          editingCell.columnId !== columnId
        let errorMsg: string | null = null

        errorMsg = getValidationError(rawValue, validation)

        const disableSelection = className === 'custom-column'

        const isCellSelected =
          !disableSelection &&
          selectedCell &&
          selectedCell.rowId === (row.original as any).__internalId &&
          selectedCell.columnId === columnId
        
        const rowId = (row.original as any).__internalId

        return (
          <SortableContext
            key={`${cell.id}-${i}`}
            items={columnOrder}
            strategy={horizontalListSortingStrategy}
          >
            <Cell
              testId={`column-${row.id}-${cell.column.id}`}
              cell={cell}
              rowId={rowId}
              columnId={columnId}
              errorMsg={errorMsg}
              isDisabled={isDisabled}
              isEditable={isEditable}
              isEditMode={!isNotEditMode}
              isCellSelected={isCellSelected as boolean}
              onClick={(e: React.MouseEvent<HTMLSpanElement>) => {
                if (disableSelection) {
                  e.stopPropagation()
                  return
                }

                // Allow editing if global editing is enabled OR if this row is newly added.
                if ((enableCellEditing || (row.original as any).__isNew) && isEditable) {
                  // Prevent triggering editing if the event target is an input element.
                  if (e.target instanceof HTMLElement) {
                    const tag = e.target.tagName.toLowerCase()
                    if (tag === 'input' || tag === 'select' || tag === 'textarea') {
                      e.stopPropagation()
                      return
                    }
                  }
                  setSelectedCell({ rowId, columnId })
                  setEditingCell({
                    rowId: (row.original as any).__internalId,
                    columnId,
                  })
                }
              }}
            />
          </SortableContext>
        )
      })}
    </DataTableRow>
  )
}
