import React, { useEffect, useState, useMemo, useRef } from 'react'
import {
  RowData,
  ColumnDef,
  SortingState,
  ExpandedState,
  useReactTable,
  getCoreRowModel,
  PaginationState,
  getSortedRowModel,
  RowSelectionState,
  getFacetedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
} from '@tanstack/react-table'
import { DataTableProps, SelectedCellType, EditingCellType, ColumnPinningType, DataRow } from './interface'
import { DataTableWrapper, DataTableContainer, DataTableContentContainer, RowsToDeleteText, TableTitle } from './styled'
import * as UTILS from './utils'
import * as UTILS_CS from './utils/columnSettings'
import { MainHeader } from './components/MainHeader'
import { SettingsPanel } from './components/MainHeader/SettingsPanel'
import { ColumnHeader } from './components/ColumnHeader'
import { Body } from './components/Body'
import { Footer } from './components/Footer'
import { CellRenderer } from './components/CellRenderer'
import { transformColumnSettings } from './utils/columnCreation'
import { SelectColumn } from './components/SelectColumn'
import { RowActionsColumn } from './components/RowActionsColumn'
import { useRowActions } from './hooks/useRowActions'
import { useAutoScroll } from './hooks/useAutoScroll'
import { useDebouncedColumnSettingsChange } from './hooks/useDebouncedColumnSettingsChange'
import { useGlobalKeyNavigation } from './hooks/useGlobalKeyNavigation'
import { useUniqueValueMaps } from './hooks/useUniqueValueMaps'
import { Alert } from '../../molecules/Alert'
import { ExpanderColumn } from './components/ExpanderColumn'
import CellCommitWorker from "./workers/cellCommitWorker?worker&inline";

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
import { Button } from '../../atoms/Button'

// Our DataTable now accepts its data and column definitions via props.
export const DataTable = <T extends object>({
  dataSource,
  columnSettings,
  onChange,
  enableColumnFiltering = true,
  enableColumnPinning = true,
  enableColumnDragging = true,
  enableColumnSorting = true,
  enableColumnResizing = true,
  enableCellEditing = true,
  enableRowAdding = true,
  enableRowDeleting = true,
  enableSelectedRowDeleting = true,
  enableRowSelection = true,
  enableGlobalFiltering = true,
  headerRightControls = true,
  title,
  cellTextAlignment = 'left',
  height,
  maxHeight,
  pageSize = 10,
  pageIndex = 0,
  enableMultiRowSelection = true,
  activeRow,
  selectedRows,
  partialRowDeletionID,
  disabledRows = [],
  disabled = false,
  headerRightButtons,
  onRowClick,
  onRowDoubleClick,
  onColumnSettingsChange,
  onPageSizeChange,
  onPageIndexChange,
  onSelectedRowsChange,
  expandedRowContent,
}: DataTableProps) => {
  const tableContainerRef = useRef<HTMLDivElement>(null)
  // Augment rows with a stable internal ID.
  const initializeData = (data: DataRow[]) => data.map((row, i) =>
    row.__internalId ? row : { ...row, __internalId: i.toString() }
  )

  const [data, setData] = useState<DataRow[]>(() => initializeData(dataSource))

  const [editingCell, setEditingCell] = useState<EditingCellType>(null)
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(UTILS_CS.setDefaultColumnVisibility(columnSettings))
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState<string>('')
  // Use initial pagination state from props:
  const [pagination, setPagination] = useState({ pageIndex, pageSize })
  const [columnSizing, setColumnSizing] = useState(UTILS_CS.getInitialWidthSize(columnSettings))
  const [columnPinning, setColumnPinning] = useState<ColumnPinningType>(UTILS_CS.getInitialPinning(columnSettings))
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>(UTILS_CS.getInitialSorting(columnSettings))
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false)
  const [selectedCell, setSelectedCell] = useState<SelectedCellType>(null)
  const [showAlert, setShowAlert] = useState(false)
  const [columnError, setColumnError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [cellLoading, setCellLoading] = useState(false)

  // Memoize the transformed data from dataSource
  const memoizedData = useMemo(() => initializeData(dataSource), [dataSource])
  const uniqueValueMaps = useUniqueValueMaps(data, columnSettings)

  // Only update local data state when memoizedData changes.
  useEffect(() => {
    setData(memoizedData)
  }, [memoizedData])

  // --- Sync column visibility and validate settings ---
  useEffect(() => {
    try {
      UTILS.checkUniqueColumns(columnSettings)
      setColumnError(null)
    } catch (err: any) {
      setColumnError(err.message)
    }
  }, [columnSettings])

  const handleResetColumnSettings = () => {
    setColumnVisibility(UTILS_CS.setDefaultColumnVisibility(columnSettings))

    // Reset column sizing to default (empty object, or a computed default if needed)
    setColumnSizing(UTILS_CS.getInitialWidthSize(columnSettings))

    // Reset column pinning to its default value
    setColumnPinning(UTILS_CS.getInitialPinning(columnSettings))

    // Reset sorting based on prop columnSettings
    setSorting(UTILS_CS.getInitialSorting(columnSettings))

    // Reset column order based on the current columns (computed with useMemo)
    setColumnOrder(UTILS_CS.getInitialColumnOrder(columns))
  }

  // --- Sync external selectedRows prop if provided ---
  useEffect(() => {
    if (selectedRows) {
      const newSelection = selectedRows.reduce((acc: Record<string, boolean>, key: string) => ({ ...acc, [key]: true }), {})
      setRowSelection(newSelection)
    }
  }, [selectedRows])

  // --- Row Adding Keyboard Events ---
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingCell) {
          // Cancel cell editing if active.
          setEditingCell(null)
        } else {
          // Check if any row in the data state has __isNew before updating.
          if (data.some((row) => (row as any).__isNew)) {
            setData(data.filter((row) => !(row as any).__isNew))
          }
        }
      }
    }
  
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [editingCell, data])

  // --- Update TanStack Table state if parent pageIndex/pageSize props change ---
  // (Note: initialState only applies on first load.)
  useEffect(() => {
    table.setPageIndex(pageIndex)
  }, [pageIndex, /* table instance */])
  
  useEffect(() => {
    table.setPageSize(pageSize)
  }, [pageSize, /* table instance */])

  // Updated handleCellCommit using setDeepValue and getDeepValue.
  const handleCellCommit = (rowId: string, accessor: string, val: any) => {
    // Set the cell to a loading state.
    setCellLoading(true)
  
    // Find the target row index.
    const rowIndex = data.findIndex((r) => r.__internalId === rowId)
    if (rowIndex === -1) {
      // Row not found exit early.
      setCellLoading(false)
      return
    }

    const rowData = data[rowIndex]
  
    // Create a new worker instance.
    const worker = new CellCommitWorker();
    // Handle the worker's response.
    worker.onmessage = (e) => {
      if (e.data.error) {
        console.error("Worker error:", e.data.error)
        // Fallback to synchronous update if needed.
        setData((old) => {
          const idx = old.findIndex((r) => r.__internalId === rowId)
          if (idx === -1) return old
          const currentValue = UTILS.getDeepValue(old[idx], accessor)
          const currentValueStr = currentValue == null ? '' : String(currentValue)
          const newValueStr = val == null ? '' : String(val)
          if (currentValueStr === newValueStr) return old
          const updatedRow = UTILS.setDeepValue(old[idx], accessor, val)
          const updated = old.map((r, i) => (i === idx ? updatedRow : r))
          if (!updated[idx].__isNew && onChange) {
            const sanitized = updated.map(({ __internalId, ...rest }) => rest)
            onChange(sanitized)
          }
          return updated
        })
      } else if (e.data.unchanged) {
        // No change was needed.
      } else if (e.data.updatedRow) {
        // Update the state by replacing the specific row.
        const { updatedRow } = e.data
        setData((old) => {
          const updated = [...old]
          updated[rowIndex] = updatedRow
          return updated
        })
        // Optionally call onChange.
        if (!rowData.__isNew && onChange) {
          setData((old) => {
            const updated = [...old]
            updated[rowIndex] = updatedRow
            const sanitized = updated.map(({ __internalId, ...rest }) => rest)
            onChange(sanitized)
            return updated
          })
        }
      }
      // In any case, clear editing state and loading indicator.
      setEditingCell(null)
      setCellLoading(false)
      worker.terminate()
    }
  
    worker.onerror = (error) => {
      console.error("Worker encountered an error:", error)
      // Fallback to synchronous update.
      setData((old) => {
        const idx = old.findIndex((r) => r.__internalId === rowId)
        if (idx === -1) return old
        const currentValue = UTILS.getDeepValue(old[idx], accessor)
        const currentValueStr = currentValue == null ? '' : String(currentValue)
        const newValueStr = val == null ? '' : String(val)
        if (currentValueStr === newValueStr) return old
        const updatedRow = UTILS.setDeepValue(old[idx], accessor, val)
        const updated = old.map((r, i) => (i === idx ? updatedRow : r))
        if (!updated[idx].__isNew && onChange) {
          const sanitized = updated.map(({ __internalId, ...rest }) => rest)
          onChange(sanitized)
        }
        return updated
      })
      setEditingCell(null)
      setCellLoading(false)
      worker.terminate()
    }
  
    // Send only the target row data and update details to the worker.
    worker.postMessage({ rowData, accessor, val })
  }

  const handleRowSelectionChange = (updaterOrValue: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)) => {
    const newSelection =
      typeof updaterOrValue === 'function'
        ? updaterOrValue(rowSelection)
        : updaterOrValue
    setRowSelection(newSelection)
    if (onSelectedRowsChange) {
      onSelectedRowsChange(
        Object.keys(newSelection).filter((key) => newSelection[key])
      )
    }
  }

  const handlePaginationChange = (updaterOrValue: PaginationState | ((prev: PaginationState) => PaginationState)) => {
    const newPagination =
      typeof updaterOrValue === 'function'
        ? updaterOrValue(pagination)
        : updaterOrValue
  
    setPagination(newPagination)
    if (onPageSizeChange && newPagination.pageSize !== pagination.pageSize) {
      onPageSizeChange(newPagination.pageSize)
    }
    if (onPageIndexChange && newPagination.pageIndex !== pagination.pageIndex) {
      onPageIndexChange(newPagination.pageIndex)
    }
  }

  // --- Updated handleAddRow using meta.hidden and meta.className ---
  const handleAddRow = () => {
    const newRow = { __isNew: true, __internalId: Date.now().toString() } as any as T
    columnSettings.forEach((col) => {
      newRow[col.column] = ''
    })
    setData((old) => [newRow, ...old] as DataRow[])

    // Find the first computed column based on its meta properties.
    const firstVisibleColumn: string = UTILS.getFirstVisibleKey(columnVisibility, columnOrder)
    if (firstVisibleColumn) {
      const newRowId = (newRow as any).__internalId
      setTimeout(() => {
        setSelectedCell({ rowId: newRowId, columnId: `${firstVisibleColumn}-0` })
      }, 0)
    }
  }

  // Use custom hook to get action handlers.
  const { handleSaveRow, handleDelete, handleCancelRow } = useRowActions({
    setData,
    editingCell,
    setEditingCell,
    onChange,
    partialRowDeletionID,
    rowSelection,
    setRowSelection,
  })

  // --- getRowCanExpand: determine expandability using expandedRowContent ---
  const getRowCanExpand = (row: any) => {
    if (expandedRowContent) {
      return expandedRowContent(row.original) != null
    }
    return (row as any)?.subRows?.length > 0
  }

  // --- Define the expander column if expandedRowContent is provided ---
  const expanderCol = expandedRowContent ? ExpanderColumn(expandedRowContent as () => void) : null

  // Transform new column settings into TanStack Table column definitions.
  const transformedColumns = transformColumnSettings<T>(columnSettings, cellTextAlignment)

  const transformColDef = (colDef: any): any => {
    // If it's a group column, recursively transform its child columns.
    if ('columns' in colDef && Array.isArray(colDef.columns)) {
      return {
        ...colDef,
        columns: colDef.columns.map(transformColDef)
      }
    }
    
    // Process non-group columns.
    const key: any = colDef.accessorKey || colDef.id
    let additionalProps = {}
    if (typeof key === 'string' && key.includes('.') && !colDef.accessorFn) {
      additionalProps = {
        accessorFn: (row: any) =>
          key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), row),
        id: key,
      }
    }

    return {
      ...colDef,
      ...additionalProps,
      meta: {
        // Merge any existing meta properties and add the isDisabledRow function.
        ...colDef.meta,
        isDisabledRow: (row: any) => disabledRows.includes(row.__internalId),
      },
      cell: (cellProps: any) => (
        <CellRenderer
          {...cellProps}
          {...colDef}
          cellLoading={cellLoading}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          handleCellCommit={handleCellCommit}
          columnFilters={columnFilters}
          globalFilter={globalFilter}
          uniqueValueMaps={uniqueValueMaps}
        />
      )
    }
  }

  // Custom Columns
  const actionColumns = [
    enableRowSelection ? SelectColumn<T>(disabledRows, enableMultiRowSelection) : null,
    ...(enableRowAdding || enableRowDeleting) ? [RowActionsColumn({
      columnSettings,
      handleSaveRow,
      handleCancelRow,
      handleDelete,
      enableRowDeleting,
      disabledRows,
      partialRowDeletionID
    })] : []
  ].filter(Boolean) as ColumnDef<RowData, any>[]

  // Prepend selection and row action columns.
  const columns = useMemo<ColumnDef<RowData, any>[]>(() => {
    return [
      ...(expanderCol ? [expanderCol] : []),
      ...actionColumns,
      ...transformedColumns?.map(transformColDef),
    ]
  }, [
    transformedColumns,
    editingCell,
    cellLoading,
    columnSettings,
    disabledRows,
    expanderCol,
    actionColumns,
    columnFilters,
    globalFilter,
    handleCellCommit
  ])

  const [columnOrder, setColumnOrder] = useState<string[]>(() => UTILS_CS.getInitialColumnOrder(columns))

  const table = useReactTable<RowData>({
    data,
    columns,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      expanded,
      pagination,
      columnOrder,
      rowSelection,
      globalFilter,
      columnSizing,
      columnPinning,
      columnFilters,
      columnVisibility,
    },
    filterFns: { dateFilter: UTILS.dateFilter, dateRangeFilter: UTILS.dateRangeFilter },
    enableColumnFilters: enableColumnFiltering,
    enableGlobalFilter: enableGlobalFiltering,
    enableSorting: enableColumnSorting,
    enableColumnResizing: enableColumnResizing,
    enableColumnPinning: enableColumnPinning,
    enableMultiRowSelection: enableMultiRowSelection,
    getRowCanExpand,
    getSubRows: (row) => (row as any)?.subRows,
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    onPaginationChange: handlePaginationChange,
    onRowSelectionChange: handleRowSelectionChange,
    onColumnSizingChange: setColumnSizing,
    onColumnPinningChange: setColumnPinning,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnOrderChange: setColumnOrder,
    getPaginationRowModel: getPaginationRowModel(),
    // Column filter related settings
    getFacetedRowModel: getFacetedRowModel(), // client-side faceting
    getFacetedUniqueValues: getFacetedUniqueValues(), // generate unique values for select filter/autocomplete
    getFacetedMinMaxValues: getFacetedMinMaxValues(), // generate min/max values for range filter
  })

  useDebouncedColumnSettingsChange({
    columnSettings,
    table,
    onColumnSettingsChange,
    columnSizing,
    columnPinning,
    sorting,
    columnOrder,
    columnVisibility
  })

  // Attach global key navigation handler
  useGlobalKeyNavigation({
    selectedCell,
    table,
    enableCellEditing,
    setSelectedCell,
    setEditingCell,
  })

  // Auto-scroll when a new cell is selected
  useAutoScroll(selectedCell)

  const handleConfirmDelete = () => {
    const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original)
    // Delete records when modal is confirmed
    const selectedIds = new Set(selectedRows.map((r) => (r as any).__internalId))
  
    setData((old) => {
      const updated: any = old.filter((r) => !selectedIds.has((r as any).__internalId))
      if (onChange) onChange(updated.map(({ __internalId, ...rest }) => rest))
      return updated
    })
    // Clear selection after bulk delete
    setRowSelection({})
    // Close the modal
    setShowAlert(false)
  }

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

  const totalSelectedRows = Object.keys(table.getState().rowSelection).filter((key) => rowSelection[key]).length
  const showDeleteIcon = enableSelectedRowDeleting && enableRowSelection && totalSelectedRows > 0

  return (
    <DataTableWrapper className='data-table-wrapper' $disabled={disabled}>
      {title && <TableTitle>{title}</TableTitle>}
      <SettingsPanel
        hasTitle={!!title}
        table={table}
        show={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
        setDefaultColumnVisibility={() => setColumnVisibility(UTILS_CS.setDefaultColumnVisibility(columnSettings))}
      />
      <MainHeader
        value={globalFilter ?? ''}
        enableGlobalFiltering={enableGlobalFiltering}
        onChange={(value) => setGlobalFilter(value as string)}
        onClear={() => setGlobalFilter('')}
        isClearDisabled={!globalFilter && columnFilters.length === 0}
        isAddBtnDisabled={data.some((row) => (row as any).__isNew)}
        enableRowAdding={enableRowAdding}
        onClearAllIconClick={() => {
          setGlobalFilter('')
          setColumnFilters([])
        }}
        isSettingsPanelOpen={showSettingsPanel}
        onSettingsIconClick={() => setShowSettingsPanel(true)}
        onAddBtnClick={handleAddRow}
        showDeleteIcon={showDeleteIcon}
        handleDeleteIconClick={() => setShowAlert(true)}
        handleResetColumnSettings={handleResetColumnSettings}
        headerRightControls={headerRightControls}
        headerRightButtons={headerRightButtons}
      />
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <DataTableContainer className='data-table-container' ref={tableContainerRef} style={{ height, maxHeight }}>
          <DataTableContentContainer style={{ width: table.getCenterTotalSize() }}>
            <ColumnHeader table={table} columnOrder={columnOrder} enableColumnDragging={enableColumnDragging}/>
            <Body
              table={table}
              columnError={columnError}
              columnOrder={columnOrder}
              editingCell={editingCell}
              setEditingCell={setEditingCell}
              enableCellEditing={enableCellEditing}
              selectedCell={selectedCell}
              setSelectedCell={setSelectedCell}
              activeRow={activeRow}
              disabledRows={disabledRows}
              enableColumnDragging={enableColumnDragging}
              onRowClick={onRowClick}
              onRowDoubleClick={onRowDoubleClick}
              expandedRowContent={expandedRowContent}
              uniqueValueMaps={uniqueValueMaps}
            />
          </DataTableContentContainer>
        </DataTableContainer>
      </DndContext>
      <Footer
        table={table}
        disabledRows={disabledRows}
        enableRowSelection={enableRowSelection}
      />
      {showDeleteIcon && (
        <Alert
          color='danger'
          title='Confirm'
          show={showAlert}
          toast
          placement='bottom-right'
          closeable
          animation='slide'
          onClose={() => setShowAlert(false)}
        >
          <RowsToDeleteText>
            Are you sure you want to delete <b>{totalSelectedRows}</b> row{totalSelectedRows > 1 ? 's' :''}?
          </RowsToDeleteText>
          <Button size='sm' data-testid='confirm-bulk-delete-button' color='danger' onClick={handleConfirmDelete}>Confirm Delete</Button>
        </Alert>
      )}
    </DataTableWrapper>
  )
}
