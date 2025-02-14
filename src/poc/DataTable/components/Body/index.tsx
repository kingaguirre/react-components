import React from 'react'
import { BodyContainer, DataTableRow } from './styled'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { Cell } from './Cell'

interface BodyProps {
  table: any
  columnOrder: string[]
}

export const Body: React.FC<BodyProps> = ({ table, columnOrder }) => (
  <BodyContainer className='data-table-body-container' style={{ height: 200 }}>
    {table.getRowModel().rows.map((row: any) => (
      <DataTableRow key={row.id} className='data-table-row'>
        {row.getVisibleCells().map((cell: any) => (
          <SortableContext
            key={cell.id}
            items={columnOrder}
            strategy={horizontalListSortingStrategy}
          >
            <Cell key={cell.id} cell={cell} />
          </SortableContext>
        ))}
      </DataTableRow>
    ))}
  </BodyContainer>
)

export default Body