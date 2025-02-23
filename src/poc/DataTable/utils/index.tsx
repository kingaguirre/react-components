import { FilterFn, ColumnDef, Column } from '@tanstack/react-table'
import { CheckboxCell } from '../components/SelectColumn/CheckboxCell'
import { CellContainer } from '../components/ColumnHeader/styled'
import { CSSProperties } from 'react'
// needed for row & cell level scope DnD setup
import { CSS } from '@dnd-kit/utilities'

export const DATA_TABLE_SELECT_ID = 'data-table-select'

// Create the default 'select' column as provided.
export const selectColumn: ColumnDef<any> = {
  id: DATA_TABLE_SELECT_ID,
  size: 30,
  enableResizing: false,
  enablePinning: false,
  header: ({ table }) => (
    <CellContainer className='custom-action data-table-select-header'>
      <CheckboxCell
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    </CellContainer>
  ),
  cell: ({ row }) => (
    <CellContainer className='custom-action data-table-select-item'>
      <CheckboxCell
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        indeterminate={row.getIsSomeSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    </CellContainer>
  ),
}

export const dateFilter: FilterFn<any> = (row, columnId, filterValue) => { // defined inline here
  if (!filterValue) return true

  const rowValue = row.getValue(columnId)

  if (
    !rowValue ||
    (typeof rowValue !== 'string' &&
      typeof rowValue !== 'number' &&
      !(rowValue instanceof Date))
  ) {
    return false
  }

  const rowDate = new Date(rowValue)
  const filterDate = new Date(filterValue)

  return rowDate.toDateString() === filterDate.toDateString()
}

export const dateRangeFilter: FilterFn<any> = (row, columnId, filterValue) => {
  // Expect filterValue as a comma-separated string: 'start,end'
  const [start, end] = typeof filterValue === 'string'
    ? filterValue.split(',')
    : []

  // If neither start nor end is provided, don't filter out this row.
  if (!start && !end) return true

  const rowValue = row.getValue(columnId)

  // If there's no row value, or it's not a valid date type, filter out.
  if (
    !rowValue ||
    (typeof rowValue !== 'string' &&
      typeof rowValue !== 'number' &&
      !(rowValue instanceof Date))
  ) {
    return false
  }

  const rowDate = new Date(rowValue)

  // If a start date is provided, rowDate must be on or after it.
  if (start && rowDate < new Date(start)) return false
  // If an end date is provided, rowDate must be on or before it.
  if (end && rowDate > new Date(end)) return false

  return true
}

export const getColumnStyles = (
  column: Column<unknown>,
  isDragging: boolean,
  transform: Parameters<typeof CSS.Translate.toString>[0]
): CSSProperties => {
  const isPinned = column.getIsPinned()

  // Pinning-specific styles.
  const pinningStyles: CSSProperties = {
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    opacity: 1,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  }

  // Dragging-specific styles.
  const draggingStyles: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition: 'width transform 0.2s ease-in-out',
    whiteSpace: 'nowrap',
    width: column.getSize(),
    zIndex: isDragging ? 1 : 0,
  }

  // If the column is pinned, we want to keep the sticky positioning,
  // but if it’s dragging, we include transform & transition.
  if (isPinned) {
    return {
      ...pinningStyles,
      ...(isDragging && {
        transform: draggingStyles.transform,
        transition: draggingStyles.transition,
      }),
      whiteSpace: draggingStyles.whiteSpace,
    }
  }

  // For non-pinned columns, use dragging styles.
  return {
    ...draggingStyles,
  }
}
