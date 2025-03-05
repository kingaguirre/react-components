import React, { memo } from 'react'
import { Cell as CellProps, flexRender } from '@tanstack/react-table'
import { CellContainer, CellContent } from './styled'
import { getColumnStyles } from '../../utils/columnSettings'
import { Tooltip } from '../../../../atoms/Tooltip'

// needed for row & cell level scope DnD setup
import { useSortable } from '@dnd-kit/sortable'

export const Cell = memo(({
  cell,
  errorMsg,
  isCellSelected,
  isEditable,
  isEditMode,
  isDisabled,
  onClick,
  columnId,
  rowId,
  testId
}: {
  cell: CellProps<unknown, unknown>
  errorMsg?: string | null
  isCellSelected: boolean
  isEditable?: boolean
  isEditMode?: boolean
  isDisabled?: boolean
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void
  columnId?: string
  rowId?: string
  testId?: string
}) => {
  const colDef: any = cell.column.columnDef
  const { isDragging, setNodeRef, transform } = useSortable({ id: colDef.accessorKey })
  const colMeta: any = colDef.meta
  const cellContext = flexRender(colDef.cell, cell.getContext())

  const cellContent = (
    <CellContent
      className={`cell-content ${colMeta?.className ?? ''} ${isDisabled ? 'disabled' : ''}`}
      $isEditMode={!!isEditMode}
      $isCellSelected={isCellSelected}
      $align={colMeta?.align}
      $isEditable={isEditable}
    >
      {isEditMode ? cellContext : <span>{ cellContext }</span>}
    </CellContent>
  )
  
  return (
    <CellContainer
      className={`cell-container ${colMeta?.className ?? ''} ${isDisabled ? 'disabled' : ''}`}
      ref={setNodeRef}
      $hasError={!!errorMsg}
      $isEditMode={!!isEditMode}
      $isPinned={!!cell.column.getIsPinned()}
      style={getColumnStyles(cell.column, isDragging, transform)}
      data-row-id={rowId}
      data-col-id={columnId}
      onClick={onClick}
      data-testid={testId}
    >
      {!!errorMsg && !isEditMode ? (
        <Tooltip testId={`${testId}-tooltip`} content={errorMsg} color='danger' maxWidth={150}>{cellContent}</Tooltip>
      ) : cellContent}
    </CellContainer>
  )
})
