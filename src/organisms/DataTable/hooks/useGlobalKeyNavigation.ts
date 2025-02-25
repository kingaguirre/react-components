import { useEffect } from 'react';
import { SelectedCellType, EditingCellType } from '../interface';

interface GlobalKeyNavigationParams {
  selectedCell: SelectedCellType | null;
  table: any; // Replace with your specific table type if available
  enableCellEditing: boolean;
  setSelectedCell: (cell: SelectedCellType) => void;
  setEditingCell: (cell: EditingCellType) => void;
}

export const useGlobalKeyNavigation = ({
  selectedCell,
  table,
  enableCellEditing,
  setSelectedCell,
  setEditingCell,
}: GlobalKeyNavigationParams) => {
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;
      if (
        document.activeElement &&
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)
      ) {
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const rows = table.getRowModel().rows;
        const row = rows.find((r: any) => (r.original as any).__internalId === selectedCell.rowId);
        if (!row) return;
        const cell = row.getVisibleCells().find((c: any) => {
          const columnId = (c.column.columnDef.meta as any)?.columnId || '';
          return columnId === selectedCell.columnId;
        });
        if (!cell) return;
        const meta: any = cell.column.columnDef.meta || {};
        if (meta.className === 'custom-column') return;
        // Allow editing if globally enabled or if the row is new.
        if ((enableCellEditing || (row.original as any).__isNew) && meta.editor !== false) {
          setEditingCell({ rowId: selectedCell.rowId, columnId: meta.columnId });
        }
        return;
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const rows = table.getRowModel().rows;
        const currentRowIndex = rows.findIndex(
          (r: any) => (r.original as any).__internalId === selectedCell.rowId
        );
        if (currentRowIndex === -1) return;
        const currentRow = rows[currentRowIndex];
        const currentSelectableCells = currentRow.getVisibleCells().filter((c: any) => {
          const meta: any = c.column.columnDef.meta || {};
          return meta.className !== 'custom-column';
        });
        const currentSelectableIndex = currentSelectableCells.findIndex((c: any) => {
          const columnId = (c.column.columnDef.meta as any)?.columnId || '';
          return columnId === selectedCell.columnId;
        });
        const updateSelectionFromRow = (rowIndex: number, selectableIndex: number) => {
          const targetRow = rows[rowIndex];
          const targetSelectable = targetRow.getVisibleCells().filter((c: any) => {
            const meta: any = c.column.columnDef.meta || {};
            return meta.className !== 'custom-column';
          });
          if (!targetSelectable.length) return;
          const newSelectableIndex = Math.min(selectableIndex, targetSelectable.length - 1);
          const newCell = targetSelectable[newSelectableIndex];
          const columnId = (newCell.column.columnDef.meta as any)?.columnId || '';
          setSelectedCell({
            rowId: (targetRow.original as any).__internalId,
            columnId,
          });
        };
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          const delta = e.key === 'ArrowLeft' ? -1 : 1;
          const newSelectableIndex = currentSelectableIndex + delta;
          if (newSelectableIndex >= 0 && newSelectableIndex < currentSelectableCells.length) {
            const newCell = currentSelectableCells[newSelectableIndex];
            const columnId = (newCell.column.columnDef.meta as any)?.columnId || '';
            setSelectedCell({
              rowId: (currentRow.original as any).__internalId,
              columnId,
            });
          }
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          const delta = e.key === 'ArrowUp' ? -1 : 1;
          const newRowIndex = currentRowIndex + delta;
          if (newRowIndex >= 0 && newRowIndex < rows.length) {
            updateSelectionFromRow(newRowIndex, currentSelectableIndex);
          }
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
    };
  }, [selectedCell, table, enableCellEditing, setSelectedCell, setEditingCell]);
};
