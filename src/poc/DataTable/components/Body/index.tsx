import React from 'react'
import { BodyContainer, DataTableRow } from './styled'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { Cell } from './Cell'
import { EditingCellType } from '../../interface'
import { getValidationError } from '../../utils/validation'

interface BodyProps {
  table: any
  columnOrder: string[]
  editingCell: EditingCellType
  setEditingCell: any
}

export const Body: React.FC<BodyProps> = ({ table, columnOrder, editingCell, setEditingCell }) => (
  <BodyContainer className='data-table-body-container' style={{ height: 200 }}>
    {table.getRowModel().rows.map((row: any) => (
      <DataTableRow key={row.id} className='data-table-row'>
        {row.getVisibleCells().map((cell: any, i: number) => {
          const colMeta = cell.column.columnDef.meta ?? {}
          const { editor, validation, columnId } = colMeta
          const rawValue = cell.getValue()
          const isEditable = editor !== false
          const isNotEditMode = !editingCell ||
            editingCell.rowId !== (row.original as any).__internalId ||
            editingCell.columnId !== columnId
          let errorMsg: string | null = null

          errorMsg = getValidationError(rawValue, validation)

          return (
            <SortableContext
              key={`${cell.id}-${i}`}
              items={columnOrder}
              strategy={horizontalListSortingStrategy}
            >
              <Cell
                cell={cell}
                errorMsg={errorMsg}
                isEditable={isEditable}
                isEditMode={!isNotEditMode}
                {...(isEditable ?
                  {
                    onClick: (e: React.MouseEvent<HTMLSpanElement>) => {
                      if (e.target instanceof HTMLElement) {
                        const tag = e.target.tagName.toLowerCase()
                        if (tag === 'input' || tag === 'select' || tag === 'textarea')
                          return
                      }
                      setEditingCell({
                        rowId: (row.original as any).__internalId,
                        columnId,
                      })
                    },
                  }
                : {})}
              />
            </SortableContext>
          )
        })}
      </DataTableRow>
    ))}
  </BodyContainer>
)

export default Body