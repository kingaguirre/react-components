import { ColumnDef } from '@tanstack/react-table'
import { CheckboxCell } from './CheckboxCell'
import { CellContainer } from '../ColumnHeader/styled'
export const DATA_TABLE_SELECT_ID = 'data-table-select'

export const SelectColumn = <T extends object>(): ColumnDef<T, any> => ({
  id: DATA_TABLE_SELECT_ID,
  size: 30,
  enableResizing: false,
  enablePinning: false,
  enableSorting: false,
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
})
