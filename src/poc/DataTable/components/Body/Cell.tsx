import { Cell as CellProps, flexRender } from '@tanstack/react-table'
import { CellContainer, CellContent } from './styled'
import { getColumnStyles } from '../../utils'
import { Tooltip } from '@atoms/Tooltip'

// needed for row & cell level scope DnD setup
import { useSortable } from '@dnd-kit/sortable'

export const Cell = ({ cell, errorMsg, cellEditor, isEditable, isEditMode, onClick }: {
  cell: CellProps<unknown, unknown>
  errorMsg?: string | null
  cellEditor?: any
  isEditable?: boolean
  isEditMode?: boolean
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void
}) => {
  const { isDragging, setNodeRef, transform } = useSortable({ id: cell.column.id })
  const colDef = cell.column.columnDef
  const colMeta: any = colDef.meta
  const cellContent = flexRender(colDef.cell, cell.getContext())

  const celContent = (
    <CellContainer className='cell-container'
      ref={setNodeRef}
      $hasError={!!errorMsg}
      $isEditMode={!!isEditMode}
      style={{
        ...getColumnStyles(cell.column, isDragging, transform),
        width: `${cell.column.getSize()}px`,
        cursor: isEditable ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      {/** Cell Text */}
      <CellContent
        className='cell-content'
        $isEditMode={!!isEditMode}
        $align={colMeta?.align}
        $hasError={!!errorMsg}
        $isEditable={isEditable}
      >
        {isEditMode ? cellContent : <span>{ cellContent }</span>}
      </CellContent>
    </CellContainer>
  )

  if (!isEditMode) {
    return !!errorMsg ? <Tooltip content={errorMsg} color='danger' maxWidth={150}>{celContent}</Tooltip> : celContent
  }

  return celContent
}
