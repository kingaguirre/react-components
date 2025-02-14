import { Cell as CellProps, flexRender } from '@tanstack/react-table'
import { CellContainer, CellContent } from './styled'
import { getColumnStyles } from '../../utils'

// needed for row & cell level scope DnD setup
import { useSortable } from '@dnd-kit/sortable'

export const Cell = ({ cell }: { cell: CellProps<unknown, unknown> }) => {
  const { isDragging, setNodeRef, transform } = useSortable({ id: cell.column.id })
  
  return (
    <CellContainer className='cell-container'
      ref={setNodeRef}
      style={{ ...getColumnStyles(cell.column, isDragging, transform), width: `${cell.column.getSize()}px` }}
    >
      {/** Cell Text */}
      <CellContent className='cell-content' >
        <span>{ flexRender(cell.column.columnDef.cell, cell.getContext()) }</span>
      </CellContent>
    </CellContainer>
  )
}
