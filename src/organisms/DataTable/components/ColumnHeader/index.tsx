import React from 'react'
import { ColumnHeaderContainer, ColumnHeaderGroupContainer } from './styled'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { Cell } from './Cell'

export const ColumnHeader = ({ table, columnOrder, enableColumnDragging }: {
  table: any
  columnOrder: string[]
  enableColumnDragging?: boolean
}) => (
  <ColumnHeaderContainer className='column-header-container'>
    {table.getHeaderGroups().map((headerGroup: any, i: number) => (
      <ColumnHeaderGroupContainer className='column-header-group-container' key={`${headerGroup.id}-${i}`}>
        <SortableContext
          items={columnOrder}
          strategy={horizontalListSortingStrategy}
        >
          {headerGroup.headers.map((header: any, hi: number) => (
            <Cell
              key={`${header.id}-${hi}`}
              header={header}
              table={table}
              enableColumnDragging={enableColumnDragging}
            />
          ))}
        </SortableContext>
      </ColumnHeaderGroupContainer>
    ))}
  </ColumnHeaderContainer>
)