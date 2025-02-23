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
import { useOnClickOutside } from '@utils/index';
import { dateFilter, dateRangeFilter, DATA_TABLE_SELECT_ID } from './utils'
import { MainHeader } from './components/MainHeader'
import { SettingsPanel } from './components/MainHeader/SettingsPanel'
import { ColumnHeader } from './components/ColumnHeader'
import { Body } from './components/Body'
import { Footer } from './components/Footer'
import { CellRenderer } from './components/CellRenderer'
import { transformColumnSettings } from './utils/columnSettings'
import { SelectColumn } from './components/SelectColumn'
import { RowActionsColumn } from './components/RowActionsColumn';
import { useRowActions } from './hooks/useRowActions';

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
export const DataTable = <T extends object>({ dataSource, columnSettings, onChange }: DataTableProps<T>) => {
  // Augment rows with a stable internal ID.
  const initializeData = (data: T[]) => data.map((row, i) =>
    (row as any).__internalId ? row : { ...row, __internalId: i.toString() }
  )

  const [data, setData] = React.useState<T[]>(() => initializeData(dataSource));
  const [editingCell, setEditingCell] = React.useState<{ rowId: string; columnId: string } | null>(null);
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState<string>('')
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [showSettingsPanel, setShowSettingsPanel] = React.useState<boolean>(false)

  const currentEditorRef = React.useRef<HTMLInputElement | HTMLSelectElement>(null);

  // Use our custom hook to blur the current editor when clicking outside.
  useOnClickOutside(currentEditorRef, () => {
    if (editingCell) {
      currentEditorRef.current?.blur();
    }
  });

  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editingCell) {
        setEditingCell(null);
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [editingCell]);

  const handleCellCommit = (rowId: string, accessor: string, val: any) => {
    setEditingCell(null);
    setData((old) => {
      const rowIndex = old.findIndex((r) => (r as any).__internalId === rowId);
      if (rowIndex === -1) return old;
      const currentValue = (old[rowIndex] as any)[accessor];
      const currentValueStr = currentValue == null ? '' : String(currentValue);
      const newValueStr = val == null ? '' : String(val);
      if (currentValueStr === newValueStr) {
        return old;
      }
      const updated = old.map((r, i) =>
        i === rowIndex ? { ...r, [accessor]: val } : r
      );
      if (!((updated[rowIndex] as any).__isNew) && onChange) {
        onChange(updated);
      }
      return updated;
    });
  };

  const handleAddRow = () => {
    const newRow: any = { __isNew: true, __internalId: Date.now().toString() } as any as T;
    columnSettings.forEach((col) => {
      newRow[col.column] = '';
    });
    setData((old) => [newRow, ...old]);
    if (columnSettings.length > 0) {
      setTimeout(() => {
        setEditingCell({ rowId: (newRow as any).__internalId, columnId: columnSettings[0].column });
      }, 0);
    }
  };

  // Transform new column settings into TanStack Table column definitions.
  const transformedColumns = transformColumnSettings<T>(columnSettings);

  // Use custom hook to get action handlers.
  const { handleSaveRow, handleDelete, handleCancelRow } = useRowActions({
    data,
    setData,
    editingCell,
    setEditingCell,
    currentEditorRef,
    onChange,
  });

  // Prepend selection and row action columns.
  const columns = React.useMemo<ColumnDef<T, any>[]>(() => {
  const actionColumns = [
    SelectColumn<T>(),
    RowActionsColumn<T>({
      columnSettings,
      handleSaveRow,
      handleCancelRow,
      handleDelete,
    }),
  ];
    return [...actionColumns,
      ...transformedColumns?.map((colDef) => {
        if ('columns' in colDef) return colDef;
        return {
          ...colDef,
          cell: (cellProps: any) => (
            <CellRenderer
              {...cellProps}
              {...colDef}
              editingCell={editingCell}
              currentEditorRef={currentEditorRef}
              setEditingCell={setEditingCell}
              handleCellCommit={handleCellCommit}
            />
          ),
        };
      }),
    ];
  }, [transformedColumns, editingCell, onChange, columnSettings]); 

  const [columnOrder, setColumnOrder] = React.useState<string[]>(() =>
    columns.map(c => c.id!)
  )

  const table = useReactTable({
    data,
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
        isAddBtnDisabled={data.some((row) => (row as any).__isNew)}
        onClearAllIconClick={() => {
          setGlobalFilter('')
          setColumnFilters([])
        }}
        onSettingsIconClick={() => setShowSettingsPanel(!showSettingsPanel)}
        onAddBtnClick={handleAddRow}
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
            <Body
              table={table}
              columnOrder={columnOrder}
              editingCell={editingCell}
              setEditingCell={setEditingCell}
            />
          </DataTableContentContainer>
        </DataTableContainer>
      </DndContext>
      <Footer table={table} selectedRows={Object.keys(rowSelection).length}/>
    </DataTableWrapper>
  )
}
