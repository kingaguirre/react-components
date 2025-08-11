// src/poc/DataTable/utils/columnSettings.tsx
import { Column } from "@tanstack/react-table";
import { CSSProperties } from "react";
import { ColumnSetting, ColumnPinningType } from "../interface";
// needed for row & cell level scope DnD setup
import { CSS } from "@dnd-kit/utilities";
import { DATA_TABLE_ROW_ACTION_ID } from "../components/RowActionsColumn";
import { DATA_TABLE_SELECT_ID } from "../components/SelectColumn";
import { DATA_TABLE_EXPANDER_ID } from "../components/ExpanderColumn";

export const CUSTOM_COLUMN = [
  DATA_TABLE_SELECT_ID,
  DATA_TABLE_EXPANDER_ID,
  DATA_TABLE_ROW_ACTION_ID,
];

export const getColumnStyles = (
  column: Column<unknown>,
  isDragging: boolean,
  transform: Parameters<typeof CSS.Translate.toString>[0],
): CSSProperties => {
  const isPinned = column.getIsPinned();

  // Pinning-specific styles.
  const pinningStyles: CSSProperties = {
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    opacity: 1,
    position: isPinned ? "sticky" : "relative",
    width: column.getSize(),
    zIndex: isPinned ? 11 : 0,
  };

  // Dragging-specific styles.
  const draggingStyles: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform),
    transition: "width transform 0.2s ease-in-out",
    whiteSpace: "nowrap",
    width: column.getSize(),
    zIndex: isDragging ? 1 : 0,
  };

  // If the column is pinned, we want to keep the sticky positioning,
  // but if it’s dragging, we include transform & transition.
  if (isPinned) {
    return {
      ...pinningStyles,
      ...(isDragging && {
        transform: draggingStyles.transform,
        transition: draggingStyles.transition,
      }),
      whiteSpace: draggingStyles.whiteSpace,
    };
  }

  // For non-pinned columns, use dragging styles.
  return {
    ...draggingStyles,
  };
};

interface SortingColumn {
  id: string;
  desc: boolean;
}

export const getInitialSorting = (
  columnSettings: ColumnSetting[],
): SortingColumn[] =>
  columnSettings
    .filter((col) => col.sort === "asc" || col.sort === "desc")
    .map((col) => ({
      id: col.column,
      desc: col.sort === "desc",
    }));

export const getInitialPinning = (
  columnSettings: ColumnSetting[],
): ColumnPinningType => {
  const initialPinnedColumn = columnSettings
    .filter((col) => col.pin === "pin")
    .map((col) => col.column);

  return { left: [...CUSTOM_COLUMN, ...initialPinnedColumn] };
};

interface SizeOptions {
  enableCellEditing?: boolean;
  enableRowAdding?: boolean;
  enableRowDeleting?: boolean;
  enableRowSelection?: boolean;
  hasExpandedContent?: boolean;
}

export const getInitialSize = (
  columns: any[],
  parentWidth: number,
  columnVisibility: Record<string, boolean>,
  opts: SizeOptions = {},
): Record<string, number> => {
  // 0) compute built‑in offset
  let offset = 0;
  if (
    opts.enableCellEditing ||
    opts.enableRowAdding ||
    opts.enableRowDeleting
  ) {
    offset += 65;
  }
  if (opts.enableRowSelection) {
    offset += 30;
  }
  if (opts.hasExpandedContent) {
    offset += 30;
  }

  const availableWidth = parentWidth - offset;

  // 1) Only size visible columns
  const visibleCols = columns.filter((col) => columnVisibility[col.column]);

  // 2) sum defined widths
  const totalDefined = visibleCols
    .filter((c) => typeof c.width === "number")
    .reduce((sum, c) => sum + (c.width as number), 0);

  // 3) figure out how many still need sizing
  const flexCols = visibleCols.filter((c) => typeof c.width !== "number");
  const flexCount = flexCols.length;

  // 4) split leftover (never under 150)
  const leftover = availableWidth - totalDefined;
  const share = flexCount > 0 ? Math.max(150, leftover / flexCount) : 0;

  // 5) build your map (hidden → 0)
  const result: Record<string, number> = {};
  columns.forEach((col) => {
    if (!columnVisibility[col.column]) {
      result[col.column] = 0;
    } else if (typeof col.width === "number") {
      result[col.column] = col.width;
    } else {
      result[col.column] = share;
    }
  });

  return result;
};

interface ColumnWithMeta {
  accessorKey?: string;
  id?: string;
  meta?: {
    className?: string;
    order?: string | number;
  };
  columns?: ColumnWithMeta[];
}

export const getInitialColumnOrder = (columns: ColumnWithMeta[]): string[] => {
  // Helper: Use meta.columnId if available, otherwise use column.id
  const getKey = (col: ColumnWithMeta): string =>
    col.accessorKey ?? col.id ?? "";

  // Recursively flatten columns. This extracts leaf columns from groups.
  const flattenColumns = (cols: ColumnWithMeta[]): ColumnWithMeta[] => {
    return cols.reduce((acc, col) => {
      if (col.columns && Array.isArray(col.columns)) {
        // Recursively flatten nested columns
        return [...acc, ...flattenColumns(col.columns)];
      }
      return [...acc, col];
    }, [] as ColumnWithMeta[]);
  };

  // Flatten all columns (groups become a list of leaf columns)
  const flatColumns = flattenColumns(columns);

  // Array to store non-custom columns (those that don't have className 'custom-column').
  // We'll capture the column itself and, if available, its numeric order.
  const nonCustomColumns: {
    col: ColumnWithMeta;
    order?: number;
  }[] = [];

  // One pass to separate non-custom columns.
  // Custom columns (meta.className === 'custom-column') are left in place.
  flatColumns.forEach((col) => {
    if (col.meta?.className !== "custom-column") {
      // Try to convert meta.order to a number (works if it's a string numeric value).
      if (
        col.meta &&
        col.meta.order != null &&
        !isNaN(parseFloat(col.meta.order.toString()))
      ) {
        nonCustomColumns.push({
          col,
          order: parseFloat(col.meta.order.toString()),
        });
      } else {
        nonCustomColumns.push({ col });
      }
    }
  });

  // Among non-custom columns, split into those with a valid order and those without.
  const orderedNonCustom = nonCustomColumns
    .filter((item) => item.order !== undefined)
    .sort((a, b) => (a.order as number) - (b.order as number));

  const unorderedNonCustom = nonCustomColumns.filter(
    (item) => item.order === undefined,
  );

  // Merge: For non-custom columns, the ones with order come first.
  const sortedNonCustom = [...orderedNonCustom, ...unorderedNonCustom];

  // Build the final order:
  // Iterate over the original columns if a column is custom, keep its original position,
  // otherwise replace it with the next sorted non-custom column.
  const result: string[] = [];
  let nonCustomIndex = 0;
  for (let i = 0; i < columns.length; i++) {
    if (columns[i].meta?.className === "custom-column") {
      result.push(getKey(columns[i]));
    } else {
      result.push(getKey(sortedNonCustom[nonCustomIndex].col));
      nonCustomIndex++;
    }
  }

  return result;
};

export const setDefaultColumnVisibility = (
  columnSettings: ColumnSetting[],
): Record<string, boolean> =>
  columnSettings.reduce(
    (acc, col) => {
      acc[col.column] = col.hidden === true ? false : true;
      return acc;
    },
    {} as Record<string, boolean>,
  );

// Helper function to remove functions from columnSettings.
export const makeSerializableColumnSettings = (columnSettings: any[]) => {
  return columnSettings.map((col) => {
    // Create a shallow copy omitting any function values.
    const serializableCol = { ...col };
    if (
      serializableCol.editor &&
      typeof serializableCol.editor.validation === "function"
    ) {
      // Replace the function with a flag or a key that indicates which validation to use.
      // For example, you might store the name of the validator.
      serializableCol.editor = {
        ...serializableCol.editor,
        // You might want to define a mapping in the worker based on this key.
        validationKey: "defaultValidator",
        // Remove the actual function.
        validation: undefined,
      };
    }
    return serializableCol;
  });
};
