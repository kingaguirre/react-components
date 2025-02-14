import { ColumnHeaderContainer } from './styled'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { Cell } from './Cell'

export const ColumnHeader = ({ table, columnOrder }: {
  table: any
  columnOrder: string[]
}) => (
  <ColumnHeaderContainer className='column-header-container'>
    {table.getHeaderGroups().map((headerGroup: any) => (
      <SortableContext
        key={headerGroup.id}
        items={columnOrder}
        strategy={horizontalListSortingStrategy}
      >
        {headerGroup.headers.map((header: any) => <Cell key={header.id} header={header} table={table} />)}
      </SortableContext>
    ))}
  </ColumnHeaderContainer>
)

export default ColumnHeader