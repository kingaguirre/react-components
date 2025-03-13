import React from 'react'
import { Table } from '@tanstack/react-table'
import { Virtualizer } from '@tanstack/react-virtual'
import { BodyContainer, NoDataContainer, ExpandedRowContainer } from './styled'
import { EditingCellType, SelectedCellType } from '../../interface'
import { Row } from './Row'

interface BodyProps<TData> {
  table: Table<TData>
  activeRow?: string
  setEditingCell: any
  columnError?: string | null
  columnOrder: string[]
  disabledRows?: string[]
  enableCellEditing: boolean
  editingCell: EditingCellType
  selectedCell: SelectedCellType
  enableColumnDragging?: boolean
  setSelectedCell: (cell: SelectedCellType) => void
  onRowClick?: (data: any, e: React.MouseEvent<HTMLElement>) => void
  onRowDoubleClick?: (data: any, e: React.MouseEvent<HTMLElement>) => void
  expandedRowContent?: (RowData: any) => React.ReactNode
  uniqueValueMaps?: Record<string, string[] | Record<string, number> | undefined>
  virtualizer: Virtualizer<HTMLDivElement, Element>
}

export const Body = <TData,>({
  table,
  activeRow,
  columnOrder,
  columnError,
  editingCell,
  selectedCell,
  disabledRows,
  setEditingCell,
  setSelectedCell,
  enableCellEditing,
  onRowClick,
  onRowDoubleClick,
  expandedRowContent,
  uniqueValueMaps,
  virtualizer
}: BodyProps<TData>) => {
  const { rows } = table.getRowModel()

  return (
    <BodyContainer className='data-table-body-container'>
      {columnError ? (
        <NoDataContainer $hasError>{columnError}</NoDataContainer>
      ) : (rows.length === 0 || table.getVisibleLeafColumns().length === 0) ? (
        <NoDataContainer>No data to display</NoDataContainer>
      ) : (table.getFilteredRowModel().rows.length > 100000) ? (
        <NoDataContainer>
          <b>Notice</b>: Maximum rows set to 100,000. For improved performance on large datasets, consider implementing server-side pagination.
        </NoDataContainer>
      ) : (
        <div style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((virtualRow, index) => {
            const row = rows[virtualRow.index]
            return (
              <div
                key={row.id}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${
                    virtualRow.start - index * virtualRow.size
                  }px)`,
                }}
              >
                <Row
                  row={row}
                  activeRow={activeRow}
                  disabledRows={disabledRows}
                  onRowClick={onRowClick}
                  onRowDoubleClick={onRowDoubleClick}
                  enableCellEditing={enableCellEditing}
                  editingCell={editingCell}
                  setEditingCell={setEditingCell}
                  selectedCell={selectedCell}
                  setSelectedCell={setSelectedCell}
                  columnOrder={columnOrder}
                  uniqueValueMaps={uniqueValueMaps}
                />
                {row.getIsExpanded() && !!expandedRowContent && (
                  <ExpandedRowContainer>
                    {expandedRowContent(row.original)}
                  </ExpandedRowContainer>
                )}
              </div>
            )
          })}
        </div>
      )}
    </BodyContainer>
  )
}
