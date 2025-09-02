import React from "react";
import { DataTableRow } from "./styled";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Cell } from "./Cell";
import {
  EditingCellType,
  SelectedCellType,
  DataTableProps,
} from "../../interface";
import { getValidationError } from "../../utils/validation";
import { useClickAndDoubleClick } from "../../hooks/useClickAndDoubleClick";

type Props = {
  row: any;
  activeRow?: string;
  disabledRows?: string[];
  onRowClick?: DataTableProps["onRowClick"];
  onRowDoubleClick?: DataTableProps["onRowDoubleClick"];
  enableCellEditing: boolean;
  editingCell: EditingCellType;
  setEditingCell: any;
  selectedCell: SelectedCellType;
  setSelectedCell: (cell: SelectedCellType) => void;
  columnOrder: string[];
  uniqueValueMaps?: Record<
    string,
    string[] | Record<string, number> | undefined
  >;
};

function RowComponent({
  row,
  activeRow,
  disabledRows,
  onRowClick,
  onRowDoubleClick,
  enableCellEditing,
  editingCell,
  setEditingCell,
  selectedCell,
  setSelectedCell,
  columnOrder,
  uniqueValueMaps,
}: Props) {
  const isActiveRow =
    activeRow && (row.original as any).__internalId === activeRow;
  const isNewRow =
    (row.original as any).__isNewImported || (row.original as any).__isNew;
  const isDisabledRow = disabledRows?.includes(
    (row.original as any).__internalId,
  );
  const clickHandlers = useClickAndDoubleClick({
    onClick: !isDisabledRow
      ? (e: React.MouseEvent<HTMLElement>) => {
          const { __internalId, ...cleanRow } = row.original;
          onRowClick && onRowClick(cleanRow, row.original.__internalId, e);
        }
      : undefined,
    onDoubleClick: !isDisabledRow
      ? (e: React.MouseEvent<HTMLElement>) => {
          const { __internalId, ...cleanRow } = row.original;
          onRowDoubleClick &&
            onRowDoubleClick(cleanRow, row.original.__internalId, e);
        }
      : undefined,
  });

  return (
    <DataTableRow
      key={row.id}
      {...clickHandlers}
      $isActiveRow={!!isActiveRow}
      $isDisabled={!!isDisabledRow}
      $isNewRow={!!isNewRow}
      className={`data-table-row ${isNewRow ? "new" : ""} ${isActiveRow ? "active" : ""} ${row.getIsSelected() ? "selected" : ""} ${isDisabledRow ? "disabled" : ""}`}
      data-testid={`row-${row.original.id ?? row.original.__internalId}`}
      role="row"
    >
      {row.getVisibleCells().map((cell: any, i: number) => {
        const colMeta = cell.column.columnDef.meta ?? {};
        const { editor, validation, columnId, className, disabled } = colMeta;
        const isDisabled =
          typeof disabled === "function" ? disabled(row.original) : disabled;
        const rawValue = cell.getValue();
        const isEditable = editor !== false;
        const isNotEditMode =
          !editingCell ||
          editingCell.rowId !== (row.original as any).__internalId ||
          editingCell.columnId !== columnId;

        const errorMsg = getValidationError(
          rawValue,
          validation,
          cell.column.id,
          uniqueValueMaps?.[cell.column.id] as string[],
          row.original,
          true,
        );

        const disableSelection = className === "custom-column";

        const isCellSelected =
          !disableSelection &&
          selectedCell &&
          selectedCell.rowId === (row.original as any).__internalId &&
          selectedCell.columnId === columnId;

        const rowId = (row.original as any).__internalId;

        return (
          <SortableContext
            key={`${cell.id}-${i}`}
            items={columnOrder}
            strategy={horizontalListSortingStrategy}
          >
            <Cell
              testId={`column-${row.id}-${cell.column.id}`}
              cell={cell}
              rowId={rowId}
              columnId={columnId}
              errorMsg={errorMsg}
              isDisabledRow={isDisabledRow}
              isDisabled={isDisabled}
              isEditable={isEditable}
              isEditMode={!isNotEditMode}
              isCellSelected={isCellSelected as boolean}
              onClick={(e: React.MouseEvent<HTMLSpanElement>) => {
                if (disableSelection) {
                  e.stopPropagation();
                  return;
                }
                setSelectedCell({ rowId, columnId });
              }}
              onDoubleClick={(e: React.MouseEvent<HTMLSpanElement>) => {
                if (disableSelection) {
                  e.stopPropagation();
                  return;
                }

                // Allow editing if global editing is enabled OR if this row is newly added.
                if (
                  (enableCellEditing || (row.original as any).__isNew) &&
                  isEditable
                ) {
                  // Prevent triggering editing if the event target is an input element.
                  if (e.target instanceof HTMLElement) {
                    const tag = e.target.tagName.toLowerCase();
                    if (
                      tag === "input" ||
                      tag === "select" ||
                      tag === "textarea"
                    ) {
                      e.stopPropagation();
                      return;
                    }
                  }
                  setEditingCell({
                    rowId: (row.original as any).__internalId,
                    columnId,
                  });
                }
              }}
            />
          </SortableContext>
        );
      })}
    </DataTableRow>
  );
}

// 🧠 Memoize Row to reduce rerenders on large tables
export const Row = React.memo(RowComponent, (prev, next) => {
  // If the row identity changes, re-render
  if (prev.row.id !== next.row.id) return false;

  // Props that affect row visual state / behavior
  if (prev.activeRow !== next.activeRow) return false;
  if (prev.editingCell !== next.editingCell) return false;
  if (prev.selectedCell !== next.selectedCell) return false;

  // Keep simple reference checks for arrays/objects that, if replaced, should re-render
  if (prev.disabledRows !== next.disabledRows) return false;
  if (prev.columnOrder !== next.columnOrder) return false;
  if (prev.uniqueValueMaps !== next.uniqueValueMaps) return false;

  // If handlers change identity, re-render
  if (prev.onRowClick !== next.onRowClick) return false;
  if (prev.onRowDoubleClick !== next.onRowDoubleClick) return false;

  return true;
});
