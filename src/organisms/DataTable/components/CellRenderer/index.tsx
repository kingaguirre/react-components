import React, { useMemo } from "react";
import { EditableCell } from "./EditableCell";

export interface CellRendererProps {
  row: any;
  getValue: () => any;
  column?: any; // mark as optional just in case
  editingCell: { rowId: string; columnId: string } | null;
  setEditingCell: React.Dispatch<
    React.SetStateAction<{ rowId: string; columnId: string } | null>
  >;
  handleCellCommit: (rowId: string, columnId: string, value: any) => void;
  cell?: any;
  globalFilter?: string;
  columnFilters?: { id: string; value: string }[];
  uniqueValueMaps?: Record<string, Record<string, number>>;
}

const CellRendererComponent: React.FC<CellRendererProps> = ({
  row,
  getValue,
  column,
  editingCell,
  setEditingCell,
  handleCellCommit,
  cell,
  globalFilter,
  columnFilters,
  uniqueValueMaps,
}) => {
  const colMeta = column.columnDef.meta ?? {};
  const { validation, editor, columnId } = colMeta;
  const { type: editorType, options = [], disabled } = editor ?? {};
  const isDisabled =
    typeof disabled === "function" ? disabled(row.original) : disabled;

  // If the cell is in editing mode and an editor is allowed.
  if (
    editingCell &&
    editingCell.rowId === row.original.__internalId &&
    editingCell.columnId === columnId &&
    editorType !== false
  ) {
    const rawValue = getValue();
    let cellValue: any;
    if (editorType === "date-range") {
      cellValue = Array.isArray(rawValue) ? rawValue.join(",") : rawValue;
    } else if (
      editorType === "checkbox-group" ||
      editorType === "switch-group" ||
      editorType === "radio-group"
    ) {
      cellValue =
        editorType === "radio-group"
          ? rawValue
          : Array.isArray(rawValue)
            ? rawValue
            : rawValue;
    } else if (editorType === "checkbox" || editorType === "radio") {
      cellValue = Boolean(rawValue);
    } else {
      cellValue = rawValue != null ? rawValue : "";
    }

    return (
      <EditableCell
        editorType={editorType || "text"}
        options={options}
        value={cellValue}
        validation={validation}
        onChange={(val) =>
          handleCellCommit(row.original.__internalId, column.id, val)
        }
        autoFocus
        onCancel={() => setEditingCell(null)}
        name={`${row.original.__internalId}-${columnId}`}
        testId={`form-control-${row.id}-${column.id}`}
        uniqueValueMaps={uniqueValueMaps}
        columnId={column.id}
        rowData={row.original}
        disabled={isDisabled}
      />
    );
  }

  // If a custom cell renderer is provided, use it.
  if (cell && typeof cell === "function") {
    return cell({ rowValue: row.original, index: row.index });
  }

  // Default cell rendering logic.
  const rawValue = getValue();

  let cellValue: any = "";
  if (editorType === "date-range" || editorType === "number-range") {
    if (Array.isArray(rawValue) && rawValue[0] === "" && rawValue[1] === "") {
      cellValue = "";
    } else if (Array.isArray(rawValue)) {
      cellValue = rawValue.join(",");
    } else {
      cellValue = rawValue;
    }
  } else if (
    editorType === "checkbox-group" ||
    editorType === "switch-group" ||
    editorType === "radio-group"
  ) {
    cellValue = Array.isArray(rawValue) ? rawValue.join(",") : rawValue;
  } else if (editorType === "checkbox" || editorType === "radio") {
    cellValue = Boolean(rawValue);
  } else {
    cellValue = rawValue != null ? rawValue : "";
  }

  const text = cellValue?.toString() || "";

  // Memoize the filter terms.
  const filterTerms = useMemo(() => {
    const terms: string[] = [];
    if (globalFilter && globalFilter.trim()) {
      terms.push(globalFilter.trim());
    }
    if (columnFilters && Array.isArray(columnFilters)) {
      const currentColumnFilter = columnFilters.find((f) => f.id === column.id);
      if (currentColumnFilter && currentColumnFilter.value.trim()) {
        terms.push(currentColumnFilter.value.trim());
      }
    }
    return terms;
  }, [globalFilter, columnFilters, columnId, column.id]);

  // Create a combined regex for the filter terms.
  const combinedRegex = useMemo(() => {
    return filterTerms.length > 0
      ? new RegExp(`(${filterTerms.join("|")})`, "gi")
      : null;
  }, [filterTerms]);

  // Compute the highlighted text.
  const highlightedText = useMemo(() => {
    if (!combinedRegex) return text;
    return text.split(combinedRegex).map((part, index) =>
      part.match(combinedRegex) ? (
        <span key={index} style={{ backgroundColor: "yellow" }}>
          {part}
        </span>
      ) : (
        part
      ),
    );
  }, [text, combinedRegex]);

  return <>{highlightedText}</>;
};

export const CellRenderer = React.memo(CellRendererComponent);
