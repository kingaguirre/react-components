import React from 'react'
import {
  useReactTable,
  ColumnDef,
  RowData,
  ColumnFiltersState,
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
} from '@tanstack/react-table'
import { DataTableProps } from './interface'
import { DataTableWrapper, DataTableContainer, DataTableContentContainer } from './styled'
import { dateFilter, dateRangeFilter, selectColumn, DATA_TABLE_SELECT_ID } from './utils'
import { MainHeader } from './components/MainHeader'
import { SettingsPanel } from './components/MainHeader/SettingsPanel'
import { ColumnHeader } from './components/ColumnHeader'
import { Body } from './components/Body'
import { Footer } from './components/Footer'

// needed for table body level scope DnD setup
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import { arrayMove } from '@dnd-kit/sortable'

declare module '@tanstack/react-table' {
  //allows us to define custom properties for our columns
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: 'text' | 'number-range' | 'dropdown' | 'date' | 'date-range' | string
  }
}

// Our DataTable now accepts its data and column definitions via props.
export const DataTable = ({ dataSource, columnSettings }: DataTableProps) => {
  // Use the provided dataSource rather than generating data internally.
  // (If you need to support a refresh, you might instead pass a callback via props.)
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState<string>('')
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [showSettingsPanel, setShowSettingsPanel] = React.useState<boolean>(false)

  // Create the default 'select' column as provided.
  const defaultSelectColumn = React.useMemo<ColumnDef<any>>(() => selectColumn, [])

  // Merge the default select column with any custom columns passed in.
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [defaultSelectColumn, ...columnSettings],
    [columnSettings]
  )

  const [columnOrder, setColumnOrder] = React.useState<string[]>(() =>
    columns.map(c => c.id!)
  )

  const table = useReactTable({
    data: dataSource,
    columns,
    columnResizeMode: 'onChange',
    state: { rowSelection, globalFilter, columnOrder, columnFilters, sorting },
    initialState: {
      columnPinning: { left: [DATA_TABLE_SELECT_ID]}
    },
    filterFns: { dateFilter, dateRangeFilter },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(), // client-side faceting
    getFacetedUniqueValues: getFacetedUniqueValues(), // generate unique values for select filter/autocomplete
    getFacetedMinMaxValues: getFacetedMinMaxValues(), // generate min/max values for range filter
    // debugTable: true,
    // debugHeaders: true,
  })

  // reorder columns after drag & drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setColumnOrder(columnOrder => {
        const oldIndex = columnOrder.indexOf(active.id as string)
        const newIndex = columnOrder.indexOf(over.id as string)
        return arrayMove(columnOrder, oldIndex, newIndex) //this is just a splice util
      })
    }
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  return (
    <DataTableWrapper className='data-table-wrapper'>
      <SettingsPanel table={table} show={showSettingsPanel} onClose={() => setShowSettingsPanel(false)}/>
      <MainHeader
        value={globalFilter ?? ''}
        onChange={(value) => setGlobalFilter(value as string)}
        onClear={() => setGlobalFilter('')}
        isClearDisabled={!globalFilter && columnFilters.length === 0}
        onClearAll={() => {
          setGlobalFilter('')
          setColumnFilters([])
        }}
        onClickSettingsBtn={() => setShowSettingsPanel(!showSettingsPanel)}
      />
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <DataTableContainer className='data-table-container'>
          <DataTableContentContainer style={{ width: `${table.getCenterTotalSize()}px` }}>
            <ColumnHeader table={table} columnOrder={columnOrder}/>
            <Body table={table} columnOrder={columnOrder}/>
          </DataTableContentContainer>
        </DataTableContainer>
      </DndContext>
      <Footer table={table} selectedRows={Object.keys(rowSelection).length}/>
      {/* <div className='tfoot'>
        <div className='tr'>
          <Td className='td'>
            <CheckboxCell
              checked={table.getIsAllPageRowsSelected()}
              indeterminate={table.getIsSomePageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
            />
          </Td>
          <Td>
            Page Rows ({table.getRowModel().rows.length})
          </Td>
        </div>
      </div>
      <Flex style={{ marginTop: '16px' }}>
  <Button
    onClick={() => table.setPageIndex(0)}
    disabled={!table.getCanPreviousPage()}
  >
    {'<<'}
  </Button>
  <Button
    onClick={() => table.previousPage()}
    disabled={!table.getCanPreviousPage()}
  >
    {'<'}
  </Button>
  <Button
    onClick={() => table.nextPage()}
    disabled={!table.getCanNextPage()}
  >
    {'>'}
  </Button>
  <Button
    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
    disabled={!table.getCanNextPage()}
  >
    {'>>'}
  </Button>
  <span>
    Page{' '}
    <strong>
      {table.getState().pagination.pageIndex + 1} of{' '}
      {table.getPageCount()}
    </strong>
  </span>
  <span>
    | Go to page:
    <InputNumber
      type='number'
      min='1'
      max={table.getPageCount()}
      value={table.getState().pagination.pageIndex + 1}
      onChange={(e) => {
        const page = e.target.value ? Number(e.target.value) - 1 : 0
        table.setPageIndex(page)
      }}
    />
  </span>
  <select
    value={table.getState().pagination.pageSize}
    onChange={(e) => {
      table.setPageSize(Number(e.target.value))
    }}
  >
    {[10, 20, 30, 40, 50].map((pageSize) => (
      <option key={pageSize} value={pageSize}>
        Show {pageSize}
      </option>
    ))}
  </select>
  <span style={{ marginLeft: '16px' }}>
    Displaying{' '}
    {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
    {Math.min(
      50000,
      (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize
    )}{' '}
    of 50000 records
  </span>
</Flex>

      <br/>
      <div className='inline-block border border-black shadow rounded'>
        <div className='px-1 border-b border-black'>
          <label>
            <input
              {...{
                type: 'checkbox',
                checked: table.getIsAllColumnsVisible(),
                onChange: table.getToggleAllColumnsVisibilityHandler(),
              }}
            />{' '}
            Toggle All
          </label>
        </div>
        {table.getAllLeafColumns().map(column => {
          return (
            <div key={column.id} className='px-1'>
              <label>
                <input
                  {...{
                    type: 'checkbox',
                    checked: column.getIsVisible(),
                    onChange: column.getToggleVisibilityHandler(),
                  }}
                />{' '}
                {column.id}
              </label>
            </div>
          )
        })}
      </div>
      <br />
      <div>
        {Object.keys(rowSelection).length} of{' '}
        {table.getPreFilteredRowModel().rows.length} Total Rows Selected
      </div> */}
    </DataTableWrapper>
  )
}
