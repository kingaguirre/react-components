import React, { memo } from 'react'
import { Cell as CellProps, flexRender } from '@tanstack/react-table'
import { CellContainer, CellContent, TooltipContent } from './styled'
import { getColumnStyles } from '../../utils/columnSettings'
import { Tooltip } from '../../../../atoms/Tooltip'
import { useHasEllipsis } from '../../hooks/useHasEllipsis'
// needed for row & cell level scope DnD setup
import { useSortable } from '@dnd-kit/sortable'

export const Cell = memo(({
  cell,
  errorMsg,
  isCellSelected,
  isEditable,
  isEditMode,
  isDisabled,
  isDisabledRow,
  onClick,
  onDoubleClick,
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
  isDisabledRow?: boolean
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void
  onDoubleClick?: (e: React.MouseEvent<HTMLSpanElement>) => void
  columnId?: string
  rowId?: string
  testId?: string
}) => {
  const colDef: any = cell.column.columnDef
  const { isDragging, setNodeRef, transform } = useSortable({ id: colDef.accessorKey })
  const colMeta: any = colDef.meta
  const cellContext = flexRender(colDef.cell, cell.getContext())
  const { ref, hasEllipsis } = useHasEllipsis(cellContext);

  const _cellContext = hasEllipsis ? <Tooltip minWidth={150} maxWidth={cell.column.getSize()} content={cellContext} type='title'>{cellContext}</Tooltip> : cellContext

  const cellContent = (
    <CellContent
      className={`cell-content ${colMeta?.className ?? ''} ${isDisabled ? 'disabled' : ''} ${isDisabledRow ? 'disabled-row' : ''} ${isCellSelected ? 'selected' : ''}`}
      $isEditMode={!!isEditMode}
      $isCellSelected={isCellSelected}
      $align={colMeta?.align}
      $isEditable={isEditable}
    >
      {isEditMode ? cellContext : <span ref={ref}>{ _cellContext }</span>}
    </CellContent>
  )
  
  return (
    <CellContainer
      className={`cell-container ${colMeta?.className ?? ''} ${isDisabled ? 'disabled' : ''} ${isDisabledRow ? 'disabled-row' : ''} ${isCellSelected ? 'selected' : ''}`}
      ref={setNodeRef}
      $hasError={!!errorMsg}
      $isDisabled={isDisabled}
      $isEditMode={!!isEditMode}
      $isPinned={!!cell.column.getIsPinned()}
      style={getColumnStyles(cell.column, isDragging, transform)}
      data-row-id={rowId}
      data-col-id={columnId}
      onDoubleClick={!isDisabled ? onDoubleClick : undefined}
      onClick={!isDisabled ? onClick : undefined}
      data-testid={testId}
    >
      {!!errorMsg && !isEditMode && !isDisabled ? (
        <Tooltip testId={`${testId}-tooltip`} content={<TooltipContent>{errorMsg}</TooltipContent>} color='danger' maxWidth={150}>{cellContent}</Tooltip>
      ) : cellContent}
    </CellContainer>
  )
})
