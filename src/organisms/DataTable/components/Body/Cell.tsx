import React, { memo } from "react";
import { Cell as CellProps, flexRender } from "@tanstack/react-table";
import { CellContainer, CellContent, TooltipContent } from "./styled";
import { getColumnStyles } from "../../utils/columnSettings";
import { Tooltip } from "../../../../atoms/Tooltip";
import { useHasEllipsis } from "../../hooks/useHasEllipsis";
import { useSortable } from "@dnd-kit/sortable";
import { BUILTIN_COLUMN_IDS } from "../../utils";

// Inner content isolated so selection changes do not re-render it
const InnerCellContent = memo(
  ({
    cell,
    colDef,
    colMeta,
    isEditMode,
    isEditable,
    isDisabled,
    isDisabledRow,
  }: {
    cell: CellProps<unknown, unknown>;
    colDef: any;
    colMeta: any;
    isEditMode?: boolean;
    isEditable?: boolean;
    isDisabled?: boolean;
    isDisabledRow?: boolean;
    highlightKey?: string;
  }) => {
    const cellContext = flexRender(colDef.cell, cell.getContext());
    const { ref, hasEllipsis } = useHasEllipsis(cellContext);

    const maybeEllipsized = hasEllipsis ? (
      <Tooltip
        minWidth={150}
        maxWidth={cell.column.getSize()}
        content={cellContext}
        type="title"
      >
        {cellContext}
      </Tooltip>
    ) : (
      cellContext
    );

    return (
      <CellContent
        className={`cell-content ${colMeta?.className ?? ""} ${isDisabled ? "disabled" : ""} ${isDisabledRow ? "disabled-row" : ""}`}
        $isEditMode={!!isEditMode}
        $align={colMeta?.align}
        $isEditable={isEditable}
      >
        {isEditMode ? cellContext : <span className="cell-content-inner" ref={ref}>{maybeEllipsized}</span>}
      </CellContent>
    );
  },
  (a, b) => {
    // Disable memoization for built-in columns (always re-render)
    if (BUILTIN_COLUMN_IDS.has(a.cell.column.id)) return false;

    // 🔑 Re-render when highlight inputs (global/column filter) change
    if (a.highlightKey !== b.highlightKey) return false;

    // 🔑 If the displayed value changed, re-render
    const aVal = a.cell.getValue?.();
    const bVal = b.cell.getValue?.();
    if (aVal !== bVal) return false;

    // width impacts tooltip/ellipsis
    if (a.cell.column.getSize() !== b.cell.column.getSize()) return false;

    // meta that affects rendering
    const aCls = a.colMeta?.className ?? "";
    const bCls = b.colMeta?.className ?? "";
    if (aCls !== bCls) return false;
    if (a.colMeta?.align !== b.colMeta?.align) return false;

    return (
      a.isEditMode === b.isEditMode &&
      a.isEditable === b.isEditable &&
      a.isDisabled === b.isDisabled &&
      a.isDisabledRow === b.isDisabledRow
    );
  },
);

export const Cell = memo(
  ({
    cell,
    errorMsg,
    isCellSelected,
    isEditable,
    isEditMode,
    isDisabled,
    isDisabledRow,
    onClick,
    onDoubleClick,
    columnId,
    rowId,
    testId,
  }: {
    cell: CellProps<unknown, unknown>;
    errorMsg?: string | null;
    isCellSelected: boolean;
    isEditable?: boolean;
    isEditMode?: boolean;
    isDisabled?: boolean;
    isDisabledRow?: boolean;
    onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
    onDoubleClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
    columnId?: string;
    rowId?: string;
    testId?: string;
  }) => {
    const colDef: any = cell.column.columnDef;
    const { isDragging, setNodeRef, transform } = useSortable({
      id: cell.column.id,
    });
    const colMeta: any = colDef.meta;

    // 🔑 Highlight key derived from table state (global + this column's filter)
    const tState: any = cell.getContext().table.getState();
    const global = (tState?.globalFilter ?? "").toString();
    const colFilterVal = (() => {
      const f = (tState?.columnFilters ?? []).find(
        (x: any) => x.id === cell.column.id,
      );
      const v = f?.value;
      return typeof v === "string" ? v : v == null ? "" : String(v);
    })();
    const highlightKey = `${global}␟${colFilterVal}`; // stable small string

    const inner = (
      <InnerCellContent
        cell={cell}
        colDef={colDef}
        colMeta={colMeta}
        isEditMode={isEditMode}
        isEditable={isEditable}
        isDisabled={isDisabled}
        isDisabledRow={isDisabledRow}
        highlightKey={highlightKey}
      />
    );

    return (
      <CellContainer
        className={`cell-container ${colMeta?.className ?? ""} ${
          isDisabled ? "disabled" : ""
        } ${isDisabledRow ? "disabled-row" : ""} ${
          isCellSelected ? "selected" : ""
        }`}
        ref={setNodeRef}
        $hasError={!!errorMsg}
        $isDisabled={isDisabled}
        $isEditMode={!!isEditMode}
        $isPinned={!!cell.column.getIsPinned()}
        $isCellSelected={isCellSelected}
        style={getColumnStyles(cell.column, isDragging, transform)}
        data-row-id={rowId}
        data-col-id={columnId}
        onDoubleClick={!isDisabled ? onDoubleClick : undefined}
        onClick={!isDisabled ? onClick : undefined}
        data-testid={testId}
      >
        {!!errorMsg && !isEditMode && !isDisabled ? (
          <Tooltip
            testId={`${testId}-tooltip`}
            content={<TooltipContent>{errorMsg}</TooltipContent>}
            color="danger"
            maxWidth={150}
          >
            {inner}
          </Tooltip>
        ) : (
          inner
        )}
      </CellContainer>
    );
  },
);
