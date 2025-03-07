import React, { Fragment } from 'react'
import { Table } from '@tanstack/react-table'
import { BodyContainer, NoDataContainer, ExpandedRowContainer } from './styled'
import { EditingCellType, SelectedCellType } from '../../interface'
import { Row } from './Row'

interface BodyProps<TData> {
  table: Table<TData>;
  height?: string
  maxHeight?: string
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
  uniqueValueMaps?: Record<string, Record<string, number>>
}

export const Body = <TData,>({
  table,
  height,
  maxHeight,
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
  uniqueValueMaps
}: BodyProps<TData>) => (
  <BodyContainer className='data-table-body-container' style={{ height, maxHeight }}>
    {columnError ? (
      <NoDataContainer $hasError>{columnError}</NoDataContainer>
    ) : (table.getRowModel().rows.length === 0 || table.getVisibleLeafColumns().length === 0) ? (
      <NoDataContainer>No data to display</NoDataContainer>
    ) : (
      table.getRowModel().rows.map((row: any) => (
        <Fragment key={row.id}>
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
        </Fragment>
      ))
    )}
  </BodyContainer>
)
