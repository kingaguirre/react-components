import React, { useMemo, useCallback } from 'react'
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
  // Precompute values from the table
  const { rows } = table.getRowModel()

  const filteredRowCount = useMemo(() => table.getFilteredRowModel().rows.length, [table])
  const visibleColumns = useMemo(() => table.getVisibleLeafColumns(), [table])
  const enableVirtualization = rows.length > 100

  // Memoize the row rendering helper to prevent unnecessary re-creations.
  const rowContent = useCallback(
    (row: any) => (
      <React.Fragment key={row.id}>
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
        {row.getIsExpanded() && expandedRowContent && (
          <ExpandedRowContainer>
            {expandedRowContent(row.original)}
          </ExpandedRowContainer>
        )}
      </React.Fragment>
    ),
    [
      activeRow,
      disabledRows,
      onRowClick,
      onRowDoubleClick,
      enableCellEditing,
      editingCell,
      selectedCell,
      setSelectedCell,
      columnOrder,
      uniqueValueMaps,
      expandedRowContent,
      setEditingCell
    ]
  )

  // Handle error and no-data cases
  if (columnError) {
    return (
      <BodyContainer className='data-table-body-container'>
        <NoDataContainer $hasError>{columnError}</NoDataContainer>
      </BodyContainer>
    )
  }

  if (rows.length === 0 || visibleColumns.length === 0) {
    return (
      <BodyContainer className='data-table-body-container'>
        <NoDataContainer>No data to display</NoDataContainer>
      </BodyContainer>
    )
  }

  if (filteredRowCount > 100000) {
    return (
      <BodyContainer className='data-table-body-container'>
        <NoDataContainer>
          <b>Notice</b>: Maximum rows set to 100,000. For improved performance on large datasets, consider implementing server-side pagination.
        </NoDataContainer>
      </BodyContainer>
    )
  }

  // Main render
  return (
    <BodyContainer className='data-table-body-container'>
      {enableVirtualization ? (
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index]
            return (
              <div
                key={row.id}
                data-index={virtualRow.index}
                ref={(node) => node && virtualizer.measureElement(node)}
                style={{
                  position: 'absolute',
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                {rowContent(row)}
              </div>
            )
          })}
        </div>
      ) : (
        rows.map((row) => rowContent(row))
      )}
    </BodyContainer>
  )
}
