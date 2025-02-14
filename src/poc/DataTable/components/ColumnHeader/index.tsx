import { ColumnHeaderContainer } from './styled'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { Cell } from './Cell'

export const ColumnHeader = ({ table, columnOrder }: {
  table: any
  columnOrder: string[]
}) => (
  <ColumnHeaderContainer className='column-header-container'>
    {table.getHeaderGroups().map((headerGroup: any, i: number) => (
      <SortableContext
        key={`${headerGroup.id}-${i}`}
        items={columnOrder}
        strategy={horizontalListSortingStrategy}
      >
        {headerGroup.headers.map((header: any, hi: number) => <Cell key={`${header.id}-${hi}`} header={header} table={table} />)}
      </SortableContext>
    ))}
  </ColumnHeaderContainer>
)

export default ColumnHeader