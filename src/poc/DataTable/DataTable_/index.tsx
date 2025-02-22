import React, { useMemo, useState, useEffect, useRef, CSSProperties } from 'react';
import styled from 'styled-components';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  Column
} from '@tanstack/react-table';
import { EditableCell } from './EditableCell';
import { ColumnVisibilityPanel } from './ColumnVisibilityPanel';
import { ExcelActions } from './ExcelActions';
import { Icon } from '@atoms/Icon';
import { useOnClickOutside } from '@utils/index';

export interface ColumnSetting {
  title: string;
  accessor: string;
  pinned?: 'left' | 'right';
  sortable?: boolean;
  editor:
    | 'text'
    | 'date'
    | 'date-range'
    | 'select'
    | 'number'
    | 'number-range'
    | 'checkbox'
    | 'radio'
    | 'switch'
    | 'checkbox-group'
    | 'radio-group'
    | 'switch-group';
  width?: number;
}

interface DataTableProps<T extends object> {
  dataSource: T[];
  columnSettings: ColumnSetting[];
  onChange?: (updatedData: T[]) => void;
}

const TableWrapper = styled.div`
  width: 100%;
  overflow: auto;
`;

const TableStyled = styled.div`
  border-collapse: collapse;
  width: 100%;
`;

const ThStyled = styled.div`
  border: 1px solid #ccc;
  padding: 8px;
  background: #f4f4f4;
  user-select: none;
  position: relative;
  display: flex;
  align-items: center;
`;

const TdStyled = styled.div<{ isFocused?: boolean }>`
  border: 1px solid #ccc;
  padding: 8px;
  cursor: pointer;
  background-color: ${(props) => (props.isFocused ? 'lightblue' : 'inherit')};
`;

const Resizer = styled.div`
  display: inline-block;
  width: 5px;
  height: 100%;
  position: absolute;
  right: 0;
  top: 0;
  transform: translateX(50%);
  cursor: col-resize;
  user-select: none;
  touch-action: none;
  background-color: grey;
`;

const ActionButton = styled.button`
  margin: 0 4px;
`;

// Helper styled components for pin/sort icons.
const LeftIconContainer = styled.div`
  display: flex;
  align-items: center;
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-right: 4px;
`;

const getCommonPinningStyles = (column: Column<any>): CSSProperties => {
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn =
    isPinned === 'left' && column.getIsLastColumn('left')
  const isFirstRightPinnedColumn =
    isPinned === 'right' && column.getIsFirstColumn('right')

  return {
    boxShadow: isLastLeftPinnedColumn
      ? '-4px 0 4px -4px gray inset'
      : isFirstRightPinnedColumn
        ? '4px 0 4px -4px gray inset'
        : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    opacity: isPinned ? 0.95 : 1,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  }
}

export function DataTable<T extends object>({ dataSource, columnSettings, onChange }: DataTableProps<T>) {
  // Augment rows with a stable internal ID.
  const initializeData = (data: T[]) =>
    data.map((row, i) =>
      (row as any).__internalId ? row : { ...row, __internalId: i.toString() }
    );

  const [data, setData] = useState<T[]>(() => initializeData(dataSource));
  const [originalData, setOriginalData] = useState<T[]>(() => initializeData(dataSource));
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
    setOriginalData((old) => [newRow, ...old]);
    if (columnSettings.length > 0) {
      setTimeout(() => {
        setEditingCell({ rowId: (newRow as any).__internalId, columnId: columnSettings[0].accessor });
      }, 0);
    }
  };

  // In DataTable.tsx, inside your useMemo for columns:
  const columns = useMemo<ColumnDef<T, any>[]>(() => {
    const cols: ColumnDef<T, any>[] = [];
    // Selection column...
    cols.push({
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
      enableResizing: false,
      enablePinning: false,
    });
    // Row actions column...
    cols.push({
      id: 'rowActions',
      header: 'Actions',
      cell: ({ row }) => {
        const rowData = row.original as any;
        if (rowData.__isNew) {
          return (
            <>
              <ActionButton onClick={() => handleSaveRow(rowData.__internalId)}>Save</ActionButton>
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
      enableResizing: false,
      enablePinning: false,
    });
    // Data columns.
    // In DataTable.tsx, inside your useMemo for columns:
    columnSettings.forEach((setting) => {
      cols.push({
        accessorKey: setting.accessor,
        header: setting.title,
        cell: ({ row, getValue }) => {
          const rawValue = getValue();
          const editorType = setting.editor;
          let cellValue;
          if (
            editorType === 'date-range' ||
            editorType === 'number-range' ||
            editorType === 'checkbox-group' ||
            editorType === 'switch-group' ||
            editorType === 'radio-group'
          ) {
            if (editorType === 'radio-group') {
              cellValue = rawValue
            } else {
              cellValue = Array.isArray(rawValue) ? rawValue : [];
            }
          } else if (
              editorType === 'checkbox' || editorType === 'radio'
            ) {
            cellValue = Boolean(rawValue);
          } else {
            cellValue = rawValue != null ? String(rawValue) : '';
          }
          if (
            editingCell &&
            editingCell.rowId === (row.original as any).__internalId &&
            editingCell.columnId === setting.accessor
          ) {
            return (
              <EditableCell
                ref={currentEditorRef}
                editorType={editorType}
                value={cellValue}
                onChange={(val) => handleCellCommit((row.original as any).__internalId, setting.accessor, val)}
                autoFocus
                onCancel={() => setEditingCell(null)}
              />
            );
          }
          // For array-based editors, join the array with a comma.
          if (
            editorType === 'date-range' ||
            editorType === 'number-range' ||
            editorType === 'checkbox-group' ||
            editorType === 'switch-group' ||
            editorType === 'radio-group'
          ) {
            return <>{Array.isArray(cellValue) ? cellValue.join(', ') : cellValue.toString()}</>;
          }
          return <>{cellValue.toString()}</>;
        },
        enableSorting: setting.sortable,
        size: setting.width || 150,
        meta: { pinned: setting.pinned },
      });
    });

    return cols;
  }, [columnSettings, editingCell, onChange]);

  const table = useReactTable({
    data,
    columns,
    initialState: {
      columnPinning: { left: ['select', 'rowActions']}
    },
    state: { columnVisibility, rowSelection, sorting, pagination, columnSizing, columnPinning },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnSizingChange: setColumnSizing,
    onColumnPinningChange: setColumnPinning,
    // enableColumnResizing: true,
    columnResizeMode: 'onChange',
    // enableColumnPinning: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
            setOriginalData(newData);
            if (onChange) onChange(newData);
          }}
        />
      </div>
      <TableWrapper ref={tableWrapperRef}>
        <TableStyled style={{ width: `${table.getCenterTotalSize()}px` }}>
          <div>
            {table.getHeaderGroups().map((headerGroup) => (
              <div key={headerGroup.id} style={{ display: 'flex' }}>
                {headerGroup.headers.map((header) => (
                  <ThStyled key={header.id} style={{ ...getCommonPinningStyles(header.column), width: `${header.getSize()}px` }}>
                    {header.isPlaceholder ? null : (
                      <>
                        <div style={{ flex: 1 }}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </div>
                        {(header.column.getCanPin() || header.column.getCanSort()) && (
                          <LeftIconContainer>
                            {header.column.getCanPin() && (
                              <IconContainer
                                title={`${header.column.getIsPinned() ? 'Unpin' : 'Pin'} ${flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const isPinned = header.column.getIsPinned() === 'left';
                                  header.column.pin(isPinned ? false : 'left');
                                }}
                              >
                                <Icon icon="push_pin" />
                              </IconContainer>
                            )}
                            {header.column.getCanSort() && (
                              <IconContainer
                                onClick={header.column.getToggleSortingHandler()}
                                title={
                                  header.column.getCanSort()
                                    ? header.column.getNextSortingOrder() === 'asc'
                                      ? 'Sort ascending'
                                      : header.column.getNextSortingOrder() === 'desc'
                                        ? 'Sort descending'
                                        : 'Clear sort'
                                    : undefined
                                }
                              >
                                <Icon
                                  icon={
                                    header.column.getIsSorted() === 'asc'
                                      ? 'keyboard_arrow_up'
                                      : header.column.getIsSorted() === 'desc'
                                      ? 'keyboard_arrow_down'
                                      : 'unfold_more'
                                  }
                                />
                              </IconContainer>
                            )}
                          </LeftIconContainer>
                        )}
                        {header.column.getCanResize() && (
                          <Resizer
                            {...{
                              onDoubleClick: () => header.column.resetSize(),
                              onMouseDown: header.getResizeHandler(),
                              onTouchStart: header.getResizeHandler(),
                              className: `column-resizer onChange ${
                                header.column.getIsResizing() ? 'is-resizing' : ''
                              }`,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </>
                    )}
                  </ThStyled>
                ))}
              </div>
            ))}
          </div>
          <div style={{ height: '300px' }}>
            {table.getRowModel().rows.map((row) => (
              <div
                key={row.id}
                style={{
                  display: 'flex',
                  backgroundColor: (row.original as any).__isNewImported ? 'lightgreen' : 'inherit',
                  transition: 'background-color 3s ease-out',
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TdStyled
                    key={cell.id}
                    style={{ ...getCommonPinningStyles(cell.column), width: `${cell.column.getSize()}px` }}
                    onClick={(e) => {
                      if (e.target instanceof HTMLElement) {
                        const tag = e.target.tagName.toLowerCase();
                        if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
                      }
                      setEditingCell({
                        rowId: (row.original as any).__internalId,
                        columnId: cell.column.columnDef.accessorKey,
                      });
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TdStyled>
                ))}
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
