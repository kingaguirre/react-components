import React, { useMemo } from "react";
import { EditableCell } from "./EditableCell";

// helpers (keep these as you had previously or from my last message)
const ESCAPE_RE = /[.*+?^${}()|[\]\\]/g;
const escapeRegExp = (s: string) => s.replace(ESCAPE_RE, "\\$&");
const tokenize = (s?: string) =>
  (s ?? "")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

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

  // 1) Build normalized, deduped, length-sorted tokens
  const filterTerms = useMemo(() => {
    const globalTokens = tokenize(globalFilter);
    const colTokens = (() => {
      if (!columnFilters || !Array.isArray(columnFilters)) return [];
      const f = columnFilters.find((f) => f.id === column?.id);
      const v = (typeof f?.value === "string" ? f.value : "")?.trim();
      return tokenize(v);
    })();

    const seen = new Set<string>();
    const all = [...globalTokens, ...colTokens]
      .map((t) => t.slice(0, 64))
      .filter((t) => {
        const key = t.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    all.sort((a, b) => b.length - a.length);
    return all.slice(0, 10);
  }, [globalFilter, columnFilters, column?.id]);

  // 2) Combined, escaped regex with capturing group
  const combinedRegex = useMemo(() => {
    if (filterTerms.length === 0) return null;
    const pattern = filterTerms.map(escapeRegExp).join("|");
    // NOTE: capturing group is required so split() keeps matches
    return new RegExp(`(${pattern})`, "gi");
  }, [filterTerms]);

  // 3) Highlighted text — no .test() with /g/, use index parity instead
  const highlightedText = useMemo(() => {
    if (!combinedRegex || !text) return text;

    const parts = text.split(combinedRegex);
    // parts: [nonMatch, match, nonMatch, match, ...]
    return parts.map((part, idx) =>
      idx % 2 === 1 ? (
        <span
          key={idx}
          data-highlight="true"
          style={{ backgroundColor: "yellow" }}
        >
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
