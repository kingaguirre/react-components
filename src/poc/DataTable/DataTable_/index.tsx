import React, { useMemo, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { EditableCell } from './EditableCell';
import { ColumnVisibilityPanel } from './ColumnVisibilityPanel';
import { exportToExcel, importFromExcel } from './ExcelUtils';

// --- Types used by the component ---
export interface ColumnSetting {
  title: string;
  accessor: string;
  pinned?: 'left' | 'right';
  sortable?: boolean;
  editor?: 'text' | 'checkbox' | 'radio' | 'date' | 'tags' | 'select';
  width?: number;
}

interface DataTableProps<T extends object> {
  dataSource: T[];
  columnSettings: ColumnSetting[];
}

// --- Styled Components ---
const TableWrapper = styled.div`
  width: 100%;
  overflow: auto;
`;

const TableStyled = styled.table`
  border-collapse: collapse;
  width: 100%;
`;

const ThStyled = styled.th`
  border: 1px solid #ccc;
  padding: 8px;
  background: #f4f4f4;
`;

const TdStyled = styled.td`
  border: 1px solid #ccc;
  padding: 8px;
  cursor: pointer;
`;

const ActionButton = styled.button`
  margin: 0 4px;
`;

// --- DataTable Component ---
export function DataTable<T extends object>({ dataSource, columnSettings }: DataTableProps<T>) {
  // Local state for table data and per-cell editing
  const [data, setData] = useState<T[]>(dataSource);
  const [originalData, setOriginalData] = useState<T[]>(dataSource);
  // Track the specific cell being edited (by row index and column accessor)
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnId: string } | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  // Initialize column visibility based on provided settings
  useEffect(() => {
    const visibility: Record<string, boolean> = {};
    columnSettings.forEach(col => {
      visibility[col.accessor] = true;
    });
    setColumnVisibility(visibility);
  }, [columnSettings]);

  // Global click: if click is outside the table, commit any active edit.
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (
        editingCell &&
        tableWrapperRef.current &&
        !tableWrapperRef.current.contains(e.target as Node)
      ) {
        setEditingCell(null);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [editingCell]);

  // Global Escape key: cancel editing even if the input isn’t focused.
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editingCell) {
        handleCancelCell(editingCell.rowIndex, editingCell.columnId);
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [editingCell]);

  // --- Handlers ---
  const handleCellChange = (rowIndex: number, accessor: string, value: any) => {
    setData(old =>
      old.map((row, index) =>
        index === rowIndex ? { ...row, [accessor]: value } : row
      )
    );
  };

  // For existing rows: revert the cell's value to its original and cancel editing.
  const handleCancelCell = (rowIndex: number, accessor: string) => {
    setData(old =>
      old.map((row, index) =>
        index === rowIndex
          ? { ...row, [accessor]: (originalData[rowIndex] as any)[accessor] }
          : row
      )
    );
    setEditingCell(null);
  };

  const handleDelete = (rowIndex: number) => {
    setData(old => old.filter((_, index) => index !== rowIndex));
  };

  // Row-level save for new rows: remove the __isNew flag.
  const handleSaveRow = (rowIndex: number) => {
    setData(old =>
      old.map((row, index) => {
        if (index === rowIndex) {
          const newRow = { ...row };
          delete (newRow as any).__isNew;
          return newRow;
        }
        return row;
      })
    );
  };

  // Row-level cancel for new rows: remove the row.
  const handleCancelRow = (rowIndex: number) => {
    setData(old => old.filter((_, index) => index !== rowIndex));
  };

  const handleAddRow = () => {
    // Mark the row as new by adding a __isNew flag.
    const newRow = { __isNew: true } as any as T;
    columnSettings.forEach(col => {
      newRow[col.accessor] = '';
    });
    setData(old => [newRow, ...old]);
    setOriginalData(old => [newRow, ...old]);
    // Open the first editable cell of the new row automatically.
    if (columnSettings.length > 0) {
      setEditingCell({ rowIndex: 0, columnId: columnSettings[0].accessor });
    }
  };

  const handleExcelExport = () => {
    exportToExcel(data, columnSettings);
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const importedData = await importFromExcel<T>(file, columnSettings);
      setData(importedData);
      setOriginalData(importedData);
    }
  };

  // Copy cell value on Ctrl/Cmd+C.
  const handleTdKeyDown = (e: React.KeyboardEvent<HTMLTableCellElement>, cellValue: any) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      navigator.clipboard.writeText(String(cellValue));
    }
  };

  // --- Build Table Columns ---
  const columns = useMemo<ColumnDef<T, any>[]>(() => {
    const cols: ColumnDef<T, any>[] = [];

    // --- Selection Column ---
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
    });

    // --- Row Actions Column ---
    cols.push({
      id: 'rowActions',
      header: 'Actions',
      cell: ({ row }) => {
        // Check if the row is a newly added one.
        const rowData = row.original as any;
        if (rowData.__isNew) {
          return (
            <>
              <ActionButton onClick={() => handleSaveRow(row.index)}>Save</ActionButton>
              <ActionButton onClick={() => handleCancelRow(row.index)}>Cancel</ActionButton>
            </>
          );
        }
        return (
          <ActionButton onClick={() => handleDelete(row.index)}>Delete</ActionButton>
        );
      },
      size: 100,
      enableSorting: false,
    });

    // --- Data Columns ---
    columnSettings.forEach(setting => {
      cols.push({
        accessorKey: setting.accessor,
        header: setting.title,
        cell: ({ row, getValue }) => {
          const editorType = setting.editor || 'text';
          // If this cell is being edited...
          if (
            editingCell &&
            editingCell.rowIndex === row.index &&
            editingCell.columnId === setting.accessor
          ) {
            const handleChange = (val: any) => {
              handleCellChange(row.index, setting.accessor, val);
              if (editorType !== 'text') {
                setEditingCell(null);
              }
            };

            const handleBlur = () => {
              // For text editors, commit on blur.
              if (
                editingCell &&
                editingCell.rowIndex === row.index &&
                editingCell.columnId === setting.accessor
              ) {
                setEditingCell(null);
              }
            };

            const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Escape') {
                handleCancelCell(row.index, setting.accessor);
                e.stopPropagation();
              }
            };

            return (
              <EditableCell
                value={getValue()}
                editorType={editorType}
                onChange={handleChange}
                onBlur={editorType === 'text' ? handleBlur : undefined}
                onKeyDown={editorType === 'text' ? handleKeyDown : undefined}
                autoFocus
              />
            );
          }
          // Not in edit mode: simply display the cell value.
          return <>{String(getValue())}</>;
        },
        enableSorting: setting.sortable,
        size: setting.width || 150,
        meta: {
          pinned: setting.pinned,
        },
      });
    });

    return cols;
  }, [columnSettings, editingCell, data, originalData]);

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    debugTable: true,
  });

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <button onClick={handleAddRow}>Add New Row</button>
        <button onClick={handleExcelExport}>Export Excel</button>
        <input type="file" accept=".xlsx, .xls" onChange={handleExcelImport} />
        <ColumnVisibilityPanel
          columnSettings={columnSettings}
          columnVisibility={columnVisibility}
          onVisibilityChange={setColumnVisibility}
        />
      </div>
      <TableWrapper ref={tableWrapperRef}>
        <TableStyled>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <ThStyled key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </ThStyled>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TdStyled
                    key={cell.id}
                    tabIndex={0}
                    onKeyDown={(e) => handleTdKeyDown(e, cell.getValue())}
                    onClick={(e) => {
                      // Prevent clicks from form elements inside the cell from re-triggering editing.
                      if (e.target instanceof HTMLElement) {
                        const tag = e.target.tagName.toLowerCase();
                        if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
                      }
                      // Only enable editing for data cells.
                      if (
                        cell.column.columnDef.accessorKey &&
                        cell.column.id !== 'select' &&
                        cell.column.id !== 'rowActions'
                      ) {
                        // If this cell is already in edit mode, do nothing.
                        if (
                          editingCell &&
                          editingCell.rowIndex === row.index &&
                          editingCell.columnId === cell.column.columnDef.accessorKey
                        ) {
                          return;
                        }
                        // Otherwise, set this cell as active for editing.
                        setEditingCell({
                          rowIndex: row.index,
                          columnId: cell.column.columnDef.accessorKey,
                        });
                      }
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TdStyled>
                ))}
              </tr>
            ))}
          </tbody>
        </TableStyled>
      </TableWrapper>
    </div>
  );
}
