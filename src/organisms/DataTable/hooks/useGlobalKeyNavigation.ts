import { useEffect, useRef } from "react";
import { SelectedCellType, EditingCellType } from "../interface";
import { getActiveTable } from "../utils/activeTable";

interface GlobalKeyNavigationParams {
  selectedCell: SelectedCellType | null;
  table: any;
  enableCellEditing: boolean;
  setSelectedCell: (cell: SelectedCellType) => void;
  setEditingCell: (cell: EditingCellType) => void;
  activeRowId: string | undefined;
  setActiveRowId: (rowId: string) => void;
  instanceId: number; // 👈 new
}

export const useGlobalKeyNavigation = ({
  selectedCell,
  table,
  enableCellEditing,
  setSelectedCell,
  setEditingCell,
  activeRowId,
  setActiveRowId,
  instanceId,
}: GlobalKeyNavigationParams) => {
  // keep latest state without rebinding
  const stateRef = useRef({
    selectedCell,
    table,
    enableCellEditing,
    setSelectedCell,
    setEditingCell,
    activeRowId,
    setActiveRowId,
  });
  useEffect(() => {
    stateRef.current = {
      selectedCell,
      table,
      enableCellEditing,
      setSelectedCell,
      setEditingCell,
      activeRowId,
      setActiveRowId,
    };
  }, [
    selectedCell,
    table,
    enableCellEditing,
    setSelectedCell,
    setEditingCell,
    activeRowId,
    setActiveRowId,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only the last "active" table responds
      if (getActiveTable() !== instanceId) return;

      const {
        selectedCell,
        table,
        enableCellEditing,
        setSelectedCell,
        setEditingCell,
        activeRowId,
        setActiveRowId,
      } = stateRef.current;

      if (!selectedCell) return;

      // Don’t hijack typing in form fields anywhere
      const ae = document.activeElement as HTMLElement | null;
      const tag = (ae?.tagName || "").toUpperCase();
      const type = (ae as HTMLInputElement | null)?.type?.toLowerCase();

      const isTypingContext =
        (ae?.isContentEditable ?? false) ||
        tag === "TEXTAREA" ||
        tag === "SELECT" || // let selects keep Arrow behavior
        (tag === "INPUT" &&
          // block only texty inputs; allow checkbox/radio/buttons to pass through
          ![
            "checkbox",
            "radio",
            "button",
            "submit",
            "reset",
            "range",
            "color",
            "file",
          ].includes(type || ""));

      if (isTypingContext) return;

      if (e.key === "Enter") {
        e.preventDefault();
        const rows = table.getRowModel().rows;
        const row = rows.find(
          (r: any) => (r.original as any).__internalId === selectedCell.rowId,
        );
        if (!row) return;

        if (selectedCell.rowId !== activeRowId)
          setActiveRowId(selectedCell.rowId);

        const cell = row.getVisibleCells().find((c: any) => {
          const columnId = (c.column.columnDef.meta as any)?.columnId || "";
          return columnId === selectedCell.columnId;
        });
        if (!cell) return;

        const meta: any = cell.column.columnDef.meta || {};
        const disabled = meta.disabled;
        const disabledRowFn = meta.isDisabledRow;
        const isDisabled =
          typeof disabled === "function" ? disabled(row.original) : !!disabled;
        const isDisabledRow =
          typeof disabledRowFn === "function"
            ? disabledRowFn(row.original)
            : false;

        if (meta.className === "custom-column" || isDisabled || isDisabledRow)
          return;

        if (
          (enableCellEditing || (row.original as any).__isNew) &&
          meta.editor !== false
        ) {
          setEditingCell({
            rowId: selectedCell.rowId,
            columnId: meta.columnId,
          });
        }
        return;
      }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();

        const rows = table.getRowModel().rows;
        const currentRowIndex = rows.findIndex(
          (r: any) => (r.original as any).__internalId === selectedCell.rowId,
        );
        if (currentRowIndex === -1) return;
        const currentRow = rows[currentRowIndex];

        const selectable = (r: any) =>
          r
            .getVisibleCells()
            .filter(
              (c: any) =>
                (c.column.columnDef.meta || {}).className !== "custom-column",
            );

        const currentSelectableCells = selectable(currentRow);
        const currIdx = currentSelectableCells.findIndex((c: any) => {
          const columnId = (c.column.columnDef.meta as any)?.columnId || "";
          return columnId === selectedCell.columnId;
        });

        const moveTo = (rowIndex: number, selIdx: number) => {
          const targetRow = rows[rowIndex];
          const targetCells = selectable(targetRow);
          if (!targetCells.length) return;
          const newSelIdx = Math.min(selIdx, targetCells.length - 1);
          const newCell = targetCells[newSelIdx];
          const columnId =
            (newCell.column.columnDef.meta as any)?.columnId || "";
          setSelectedCell({
            rowId: (targetRow.original as any).__internalId,
            columnId,
          });
        };

        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          const delta = e.key === "ArrowLeft" ? -1 : 1;
          const nextIdx = currIdx + delta;
          if (nextIdx >= 0 && nextIdx < currentSelectableCells.length) {
            const newCell = currentSelectableCells[nextIdx];
            const columnId =
              (newCell.column.columnDef.meta as any)?.columnId || "";
            setSelectedCell({
              rowId: (currentRow.original as any).__internalId,
              columnId,
            });
          }
        } else {
          const delta = e.key === "ArrowUp" ? -1 : 1;
          const nextRow = currentRowIndex + delta;
          if (nextRow >= 0 && nextRow < rows.length) moveTo(nextRow, currIdx);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [instanceId]);
};
