import { FilterFn } from "@tanstack/react-table";
import type { Table, PaginationState } from "@tanstack/react-table";
import {
  ColumnSetting,
  SelectedCellType,
  DataRow,
  SelectedCellCoordProp,
} from "../interface";

export const BUILTIN_COLUMN_IDS = new Set([
  "data-table-expander",
  "data-table-select",
  "data-table-row-action",
]);

export const dateFilter: FilterFn<unknown> = (row, columnId, filterValue) => {
  // defined inline here
  if (!filterValue) return true;

  const rowValue = row.getValue(columnId);

  if (
    !rowValue ||
    (typeof rowValue !== "string" &&
      typeof rowValue !== "number" &&
      !(rowValue instanceof Date))
  ) {
    return false;
  }

  const rowDate = new Date(rowValue);
  const filterDate = new Date(filterValue);

  return rowDate.toDateString() === filterDate.toDateString();
};

export const dateRangeFilter: FilterFn<unknown> = (
  row,
  columnId,
  filterValue,
) => {
  // Expect filterValue as a comma-separated string: 'start,end'
  const [start, end] =
    typeof filterValue === "string" ? filterValue.split(",") : [];

  // If neither start nor end is provided, don't filter out this row.
  if (!start && !end) return true;

  const rowValue = row.getValue(columnId);

  // If there's no row value, or it's not a valid date type, filter out.
  if (
    !rowValue ||
    (typeof rowValue !== "string" &&
      typeof rowValue !== "number" &&
      !(rowValue instanceof Date))
  ) {
    return false;
  }

  const rowDate = new Date(rowValue);

  // If a start date is provided, rowDate must be on or after it.
  if (start && rowDate < new Date(start)) return false;
  // If an end date is provided, rowDate must be on or before it.
  if (end && rowDate > new Date(end)) return false;

  return true;
};

export const checkUniqueColumns = (settings: ColumnSetting[]): void => {
  const seen = new Set<string>();
  settings.forEach((setting) => {
    if (seen.has(setting.column)) {
      throw new Error(`Duplicate column key detected: ${setting.column}`);
    }
    seen.add(setting.column);
  });
};

// Utility to set a deep value. If the path doesn't have dots, it simply updates the value.
export const setDeepValue = (obj: any, path: string, value: unknown): any => {
  if (!path.includes(".")) {
    return { ...obj, [path]: value };
  }
  const keys = path.split(".");
  const key = keys[0];
  const arrayMatch = key.match(/^\[(\d+)\]$/);

  if (keys.length === 1) {
    if (arrayMatch) {
      const index = parseInt(arrayMatch[1], 10);
      const arr = Array.isArray(obj) ? [...obj] : [];
      arr[index] = value;
      return arr;
    }
    return { ...obj, [key]: value };
  }

  if (arrayMatch) {
    const index = parseInt(arrayMatch[1], 10);
    const arr = Array.isArray(obj) ? [...obj] : [];
    arr[index] = setDeepValue(arr[index] || {}, keys.slice(1).join("."), value);
    return arr;
  } else {
    return {
      ...obj,
      [key]: setDeepValue(
        obj ? obj[key] || {} : {},
        keys.slice(1).join("."),
        value,
      ),
    };
  }
};

// Utility to get a deep value. If the path doesn't have dots, it directly returns the value.
export const getDeepValue = (obj: any, path: string): any => {
  if (!path.includes(".")) {
    return obj ? obj[path] : undefined;
  }
  return path.split(".").reduce((acc, key) => {
    if (acc == null) return undefined;
    const arrayMatch = key.match(/^\[(\d+)\]$/);
    if (arrayMatch) {
      const index = parseInt(arrayMatch[1], 10);
      return Array.isArray(acc) ? acc[index] : undefined;
    }
    return acc[key];
  }, obj);
};

// This utility function removes the __internalId property from each row.
// It returns an array of rows without the internal meta property.
export const sanitizeData = <T extends { __internalId: string }>(
  data: T[],
): Omit<T, "__internalId">[] => data.map(({ __internalId, ...rest }) => rest);

export const getFirstVisibleKey = (visibility, keyNames) => {
  for (let i = 0; i < keyNames.length; i++) {
    if (visibility[keyNames[i]] === true) {
      return keyNames[i];
    }
  }
  return null;
};

export const filterUniqueMap = (arr?: string[], value?: string) => {
  const _arr = Array.isArray(arr) ? arr : undefined;
  if (!_arr || value === undefined) return _arr;
  const index = _arr.indexOf(value);
  if (index === -1) return _arr;
  return [..._arr.slice(0, index), ..._arr.slice(index + 1)];
};

/** Visible, user-only leaf columns in visual order (pinned + order + visibility respected) */
export function getVisibleUserLeafColumns(
  table: Table<any>,
  builtin = BUILTIN_COLUMN_IDS,
) {
  return table.getVisibleLeafColumns().filter((c) => !builtin.has(c.id));
}

export function parseSelectedCellInput(
  input?: SelectedCellCoordProp,
): [number, number] | null {
  if (Array.isArray(input) && input.length >= 2) {
    const [r, c] = input;
    return Number.isInteger(r) && Number.isInteger(c) ? [r, c] : null;
  }
  if (typeof input === "string") {
    const [rs, cs] = input.split(",");
    const r = Number.parseInt((rs ?? "").trim(), 10);
    const c = Number.parseInt((cs ?? "").trim(), 10);
    return Number.isInteger(r) && Number.isInteger(c) ? [r, c] : null;
  }
  return null;
}

/**
 * Map [rowIdx, userColIdx] → { rowId, columnId } with NO numeric suffix.
 * - userColIdx is among visible NON-built-in columns.
 */
export function coordToInternalSelection(
  table: Table<any>,
  rowIdx: number,
  userColIdx: number,
  builtin = BUILTIN_COLUMN_IDS,
): SelectedCellType | null {
  if (rowIdx < 0 || userColIdx < 0) return null;

  const rows = table.getRowModel().rows;
  const cols = getVisibleUserLeafColumns(table, builtin);

  const rowModel = rows[rowIdx];
  const col = cols[userColIdx];
  if (!rowModel || !col) return null;

  const rowId =
    (rowModel.original as DataRow)?.__internalId ?? (rowModel.id as string);

  // 🔑 columnId is JUST the real column id now
  const columnId = col.id;

  return { rowId, columnId };
}

/** Initialize rows with a stable internal ID */
export function initializeDataWithIds(rows: unknown): DataRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, i) =>
    (row as DataRow).__internalId
      ? (row as DataRow)
      : ({ ...(row as any), __internalId: String(i) } as DataRow),
  );
}

/** Compute the right-side offset for expanded rows given extra columns */
export function getExpandedRowRightOffset(
  enableRowSelection: boolean,
  enableRowAdding: boolean,
  enableRowDeleting: boolean,
): number {
  let offset = 30; // base gutter
  if (enableRowSelection) offset += 30; // selection col
  if (enableRowAdding || enableRowDeleting) offset += 65; // actions col
  return offset;
}

/** Factory for a getRowCanExpand fn that respects expandedRowContent */
export function makeRowCanExpand(
  expandedRowContent?: (rowOriginal: any) => any,
) {
  return (row: any) =>
    expandedRowContent
      ? expandedRowContent(row.original) != null
      : Array.isArray((row as any)?.subRows) && (row as any).subRows.length > 0;
}

/** Merge default sizing with any user-sized columns */
export function mergeSizing(
  defaultSizing: Record<string, number>,
  prev: Record<string, number>,
  userSizedCols: Set<string>,
): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const colId of Object.keys(defaultSizing)) {
    merged[colId] = userSizedCols.has(colId)
      ? typeof prev[colId] === "number"
        ? prev[colId]
        : defaultSizing[colId]
      : defaultSizing[colId];
  }
  return merged;
}

/** One-shot + timed suppression controller for auto page resets */
export function createPageResetController(windowMs = 1200) {
  const skipPageResetRef = { current: false as boolean };
  const suppressUntilRef = { current: 0 as number };

  const queue = (cb: () => void) =>
    typeof queueMicrotask === "function"
      ? queueMicrotask(cb)
      : Promise.resolve().then(cb);

  const noPageReset = <R,>(fn: () => R): R => {
    skipPageResetRef.current = true;
    const out = fn();
    queue(() => {
      skipPageResetRef.current = false;
    });
    return out;
  };

  const suppressPageReset = (ms = windowMs) => {
    suppressUntilRef.current = Math.max(
      suppressUntilRef.current,
      Date.now() + ms,
    );
  };

  const isPageResetSuppressed = () => Date.now() < suppressUntilRef.current;

  return {
    skipPageResetRef,
    noPageReset,
    suppressPageReset,
    isPageResetSuppressed,
  };
}

/** Gate to ignore TanStack’s internal "reset to page 0" during an edit echo */
export function shouldIgnoreAutoReset(
  prev: PaginationState,
  next: PaginationState,
  suppressed: boolean,
): boolean {
  return (
    suppressed &&
    next.pageIndex === 0 &&
    prev.pageIndex !== 0 &&
    next.pageSize === prev.pageSize
  );
}

export type ExportColumn = { column: string; title: string };
type ExportOpts = {
  fileName?: string;
  format?: "xlsx" | "csv";
  sheetName?: string;
};

export async function exportRows(
  rows: any[],
  columns: ExportColumn[],
  opts: ExportOpts = {},
): Promise<void> {
  const fileName = (opts.fileName || "export").trim() || "export";
  const format = opts.format || "xlsx";
  const sheetName = opts.sheetName || "Data";

  const header = columns.map((c) => c.title);
  const body = (Array.isArray(rows) ? rows : []).map((r) =>
    columns.map((c) => {
      const v = (r as any)?.[c.column];
      if (Array.isArray(v))
        return v.map((x) => (x == null ? "" : String(x))).join(",");
      if (v == null) return "";
      return v instanceof Date ? v.toISOString() : v;
    }),
  );
  const aoa: any[][] = [header, ...body];

  const safeBase = fileName.replace(/\.(xlsx|csv)$/i, "");
  const dl = (blob: Blob, ext: "xlsx" | "csv") => {
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `${safeBase}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (format === "csv") {
    const esc = (val: any) => {
      const s = val == null ? "" : String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = aoa.map((row) => row.map(esc).join(",")).join("\n");
    dl(new Blob([csv], { type: "text/csv;charset=utf-8" }), "csv");
    return;
  }

  const getExcelJS = async () => {
    try {
      const mod = await import(/* @vite-ignore */ "exceljs");
      return (mod as any).default ?? (mod as any);
    } catch {
      const g = (window as any)?.ExcelJS;
      if (g) return g;
      throw new Error("ExcelJS not found.");
    }
  };
  const ExcelJS = await getExcelJS();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.addRows(aoa);
  const buf: ArrayBuffer = await wb.xlsx.writeBuffer();
  dl(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "xlsx",
  );
}

// helper: shallow compare number maps
export const shallowEqualNumberMap = (
  a: Record<string, number>,
  b: Record<string, number>,
) => {
  if (a === b) return true;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) if (a[k] !== b[k]) return false;
  return true;
};
