import { useMemo, useState, useEffect, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { EditableCell } from './EditableCell';
import { ColumnVisibilityPanel } from './ColumnVisibilityPanel';
import { ExcelActions } from './ExcelActions';
import { useOnClickOutside } from '@utils/index';
import { ColumnSetting, transformColumnSettings } from './ColumnSettings';
import { Filter } from '../components/ColumnHeader/Filter'
import {
  TableWrapper,
  TableStyled,
  ThStyled,
  TdStyled,
  ActionButton,
  getCommonPinningStyles
} from './styled'
import { ColumnPinAndResize } from './ColumnPinAndResize'
import { getValidationError } from './validationutils'; // or from wherever you centralize this

interface DataTableProps<T extends object> {
  dataSource: T[];
  columnSettings: ColumnSetting[];
  onChange?: (updatedData: T[]) => void;
}

export function DataTable<T extends object>({ dataSource, columnSettings, onChange }: DataTableProps<T>) {
  // Augment rows with a stable internal ID.
  const initializeData = (data: T[]) =>
    data.map((row, i) =>
      (row as any).__internalId ? row : { ...row, __internalId: i.toString() }
    );

  const [data, setData] = useState<T[]>(() => initializeData(dataSource));
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [columnSizing, setColumnSizing] = useState({});
  const [columnPinning, setColumnPinning] = useState({});

  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const currentEditorRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const visibility: Record<string, boolean> = {};
    columnSettings.forEach((col) => {
      visibility[col.accessor] = true;
    });
    setColumnVisibility(visibility);
  }, [columnSettings]);

  // Use our custom hook to blur the current editor when clicking outside.
  useOnClickOutside(currentEditorRef, () => {
    if (editingCell) {
      currentEditorRef.current?.blur();
    }
  });

  useEffect(() => {
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

  const handleSaveRow = (rowId: string) => {
    if (editingCell && editingCell.rowId === rowId && currentEditorRef.current) {
      currentEditorRef.current.blur();
      setTimeout(() => {
        setData((old) => {
          const rowIndex = old.findIndex((r) => (r as any).__internalId === rowId);
          if (rowIndex === -1) return old;
          const updated = old.map((row, i) => {
            if (i === rowIndex) {
              const newRow = { ...row };
              delete (newRow as any).__isNew;
              return newRow;
            }
            return row;
          });
          if (onChange) onChange(updated);
          return updated;
        });
      }, 0);
    } else {
      setData((old) => {
        const rowIndex = old.findIndex((r) => (r as any).__internalId === rowId);
        if (rowIndex === -1) return old;
        const updated = old.map((row, i) => {
          if (i === rowIndex) {
            const newRow = { ...row };
            delete (newRow as any).__isNew;
            return newRow;
          }
          return row;
        });
        if (onChange) onChange(updated);
        return updated;
      });
    }
    setEditingCell(null);
  };

  const handleDelete = (rowId: string) => {
    setEditingCell(null);
    setData((old) => {
      const updated = old.filter((r) => (r as any).__internalId !== rowId);
      if (onChange) onChange(updated);
      return updated;
    });
  };

  const handleCancelRow = (rowId: string) => {
    if (editingCell && editingCell.rowId === rowId && currentEditorRef.current) {
      currentEditorRef.current.blur();
    }
    setData((old) => old.filter((r) => (r as any).__internalId !== rowId));
    setEditingCell(null);
  };

  const handleAddRow = () => {
    const newRow = { __isNew: true, __internalId: Date.now().toString() } as any as T;
    columnSettings.forEach((col) => {
      newRow[col.accessor] = '';
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
  // Prepend selection and row action columns.
  const columns = useMemo<ColumnDef<T, any>[]>(() => {
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        size: 50,
        enableSorting: false,
      },
      {
        id: 'rowActions',
        header: 'Actions',
        cell: ({ row }) => {
          const rowData = row.original as any;
          if (rowData.__isNew) {
            const hasError = columnSettings.some(
              (col) => col.validation && getValidationError(rowData[col.column], col.validation)
            );
            return (
              <>
                <ActionButton onClick={() => handleSaveRow(rowData.__internalId)} disabled={hasError}>Save</ActionButton>
                <ActionButton onClick={() => handleCancelRow(rowData.__internalId)}>Cancel</ActionButton>
              </>
            );
          }
          return (
            <ActionButton onClick={() => handleDelete(rowData.__internalId)}>Delete</ActionButton>
          );
        },
        size: 100,
        enableSorting: false,
      },
      ...transformedColumns?.map((colDef) => {
        if ('columns' in colDef) return colDef;
        const { editor, cell: customCell } = colDef as any;
        return {
          ...colDef,
          cell: ({ row, getValue, column }) => {
            if (
              editingCell &&
              editingCell.rowId === (row.original as any).__internalId &&
              editingCell.columnId === column.id &&
              editor !== false
            ) {
              const rawValue = getValue();
              let cellValue;
              if (editor === 'date-range' || editor === 'number-range') {
                cellValue = Array.isArray(rawValue) ? rawValue : ['', ''];
              } else if (
                editor === 'checkbox-group' ||
                editor === 'switch-group' ||
                editor === 'radio-group'
              ) {
                cellValue = editor === 'radio-group' ? rawValue : Array.isArray(rawValue) ? rawValue : [];
              } else if (editor === 'checkbox') {
                cellValue = Boolean(rawValue);
              } else {
                cellValue = rawValue != null ? rawValue : '';
              }
              return (
                <EditableCell
                  ref={currentEditorRef}
                  editorType={editor || 'text'}
                  value={cellValue}
                  validation={column.columnDef.meta?.validation}
                  onChange={(val) =>
                    handleCellCommit((row.original as any).__internalId, column.id, val)
                  }
                  autoFocus
                  onCancel={() => setEditingCell(null)}
                />
              );
            }

            if (customCell) {
              return customCell({ rowValue: row.original, index: row.index });
            }

            const rawValue = getValue();
            let cellValue = '';
            if (editor === 'date-range' || editor === 'number-range') {
               // If both values are empty, render nothing instead of a comma.
               if (
                Array.isArray(rawValue) &&
                rawValue[0] === '' &&
                rawValue[1] === ''
              ) {
                cellValue = '';
              } else if (Array.isArray(rawValue)) {
                cellValue = rawValue.join(' - ');
              } else {
                cellValue = rawValue;
              }
            } else if (
              editor === 'checkbox-group' ||
              editor === 'switch-group' ||
              editor === 'radio-group'
            ) {
              cellValue = editor === 'radio-group' ? rawValue : Array.isArray(rawValue) ? rawValue : [];
            } else if (editor === 'checkbox' || editor === 'radio') {
              cellValue = Boolean(rawValue);
            } else {
              cellValue = rawValue != null ? rawValue : '';
            }

            return <>{cellValue?.toString()}</>;
          },
        };
      }),
    ];
  }, [transformedColumns, editingCell, onChange, columnSettings]);

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility, rowSelection, sorting, pagination, columnSizing, columnPinning },
    initialState: {
      columnPinning: { left: ['select', 'rowActions' ]}
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnSizingChange: setColumnSizing,
    onColumnPinningChange: setColumnPinning,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableColumnFilters: true // add data-table props to enable disabled
  });

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        {Object.keys(rowSelection).length > 0 && (
          <ActionButton
            onClick={() => {
              const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
              if (window.confirm(`Are you sure you want to delete ${selectedRows.length} rows?`)) {
                const selectedIds = new Set(
                  table.getSelectedRowModel().rows.map((r) => (r.original as any).__internalId)
                );
                setData((old) => {
                  const updated = old.filter((r) => !selectedIds.has((r as any).__internalId));
                  if (onChange) onChange(updated);
                  return updated;
                });
              }
            }}
          >
            Bulk Delete ({Object.keys(rowSelection).length})
          </ActionButton>
        )}
        <button onClick={handleAddRow} disabled={data.some((row) => (row as any).__isNew)}>
          Add New Row
        </button>
        <ExcelActions
          data={data}
          columnSettings={columnSettings}
          selectedRows={table.getSelectedRowModel().rows.map((r) => r.original)}
          onDataUpdate={(newData) => {
            setData(newData);
            if (onChange) onChange(newData);
          }}
        />
      </div>
      <TableWrapper ref={tableWrapperRef}>
        <TableStyled style={{ width: `${table.getCenterTotalSize()}px` }}>
          <div>
            {table.getHeaderGroups().map((headerGroup, ii) => (
              <div key={headerGroup.id} style={{ display: 'flex' }}>
                {headerGroup.headers.map((header, i) => (
                  <ThStyled key={`${header.id}-${i}`} style={{ ...getCommonPinningStyles(header.column), width: `${header.getSize()}px` }}>
                    {header.isPlaceholder ? null : (
                      <>
                        <div style={{ flex: 1 }}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </div>
                        {header.column.getCanFilter() && <Filter column={header.column} />}
                        <ColumnPinAndResize header={header}/>
                      </>
                    )}
                  </ThStyled>
                ))}
              </div>
            ))}
          </div>
          <div style={{ height: '300px' }}>
          {table.getRowModel().rows.map((row, ri) => (
            <div
              key={row.id}
              style={{
                display: 'flex',
                backgroundColor: ((row.original as any).__isNewImported || (row.original as any).__isNew) ? 'lightgreen' : 'inherit',
                transition: 'background-color .3s ease-out',
              }}
            >
              {row.getVisibleCells().map((cell, ci) => {
                const cellEditor = (cell.column.columnDef as any)?.editor;
                const rawValue = cell.getValue();
                let errorMsg: string | null = null;
                // Only compute error when not in edit mode (EditableCell handles its own error display)
                if (
                  !editingCell ||
                  editingCell.rowId !== (row.original as any).__internalId ||
                  editingCell.columnId !== cell.column.id
                ) {
                  errorMsg = getValidationError(rawValue, cell.column.columnDef.meta?.validation);
                }
                return (
                  <TdStyled
                    key={`${cell.id}-${ci}`}
                    hasError={!!errorMsg}
                    title={errorMsg || undefined} // tooltip showing the error
                    style={{
                      ...getCommonPinningStyles(cell.column),
                      width: `${cell.column.getSize()}px`,
                      cursor: cellEditor !== undefined && cellEditor !== false ? 'pointer' : 'default',
                    }}
                    {...(cellEditor !== undefined && cellEditor !== false
                      ? {
                          onClick: (e) => {
                            if (e.target instanceof HTMLElement) {
                              const tag = e.target.tagName.toLowerCase();
                              if (tag === 'input' || tag === 'select' || tag === 'textarea')
                                return;
                            }
                            setEditingCell({
                              rowId: (row.original as any).__internalId,
                              columnId: cell.column.id,
                            });
                          },
                        }
                      : {})}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TdStyled>
                );
              })}
            </div>
          ))}

          </div>
        </TableStyled>
      </TableWrapper>
      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </button>
        <span style={{ margin: '0 8px' }}>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </button>
      </div>
      <ColumnVisibilityPanel
        columnSettings={columnSettings}
        columnVisibility={columnVisibility}
        onVisibilityChange={setColumnVisibility}
      />
    </div>
  );
}
