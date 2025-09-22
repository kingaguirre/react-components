// src/organisms/DataTable/utils/columnCreation.tsx
import { ColumnDef } from "@tanstack/react-table";
import { ColumnSetting } from "../interface";

export function createColumnDef<T extends object>(
  col: ColumnSetting,
  cellTextAlignment?: string,
): ColumnDef<T, any> {
  return {
    accessorKey: col.column,
    header: col.title,
    minSize: col.minWidth ?? 60,
    maxSize: col.maxWidth,
    enableSorting: col.sort !== false,
    enablePinning: col.pin !== false,
    enableColumnFilter: col.filter !== false,
    ...(col.filter !== false && !!col.filter?.filterBy
      ? { filterFn: col.filter?.filterBy }
      : {}),
    meta: {
      initialSort:
        col.sort === "asc" || col.sort === "desc" ? col.sort : undefined,
      pinned: col.pin === "pin" ? "left" : false,
      validation: col.editor !== false ? col.editor?.validation : undefined,
      filter: col.filter,
      editor: col.editor,
      columnId: col.column,
      hidden: col.hidden,
      align: col.align ?? cellTextAlignment,
      headerAlign: col.headerAlign ?? col.align ?? cellTextAlignment,
      draggable: col.draggable,
      order: col.order,
      disabled: col.disabled,
    } as ColumnDef<T, any>["meta"],
    ...(col.cell
      ? {
          cell: ({ rowValue, index }: any) => col.cell!({ rowValue, index }),
        }
      : {}),
  } as any;
}

export function transformColumnSettings<T extends object>(
  settings: ColumnSetting[],
  cellTextAlignment?: string,
): ColumnDef<T, any>[] {
  const result: ColumnDef<T, any>[] = [];
  let activeGroupTitle: string | null = null;
  let activeGroupCols: ColumnDef<T, any>[] = [];
  const groupCounts = new Map<string, number>(); // to ensure unique ids per repeated group title

  const flushGroup = () => {
    if (!activeGroupTitle || activeGroupCols.length === 0) return;
    const nextIndex = (groupCounts.get(activeGroupTitle) ?? 0) + 1;
    groupCounts.set(activeGroupTitle, nextIndex);

    result.push({
      id: `group-${activeGroupTitle}-${nextIndex}`,
      header: activeGroupTitle,
      columns: activeGroupCols,
    } as ColumnDef<T, any>);

    activeGroupTitle = null;
    activeGroupCols = [];
  };

  for (const col of settings) {
    const thisGroup = col.groupTitle ?? null;

    // If current column is grouped
    if (thisGroup) {
      // Continue the same contiguous group
      if (activeGroupTitle === thisGroup) {
        activeGroupCols.push(createColumnDef<T>(col, cellTextAlignment));
      } else {
        // Close any previous group and start a new one at this position
        if (activeGroupTitle) flushGroup();
        activeGroupTitle = thisGroup;
        activeGroupCols = [createColumnDef<T>(col, cellTextAlignment)];
      }
      continue;
    }

    // Current column is NOT grouped
    if (activeGroupTitle) flushGroup();
    result.push(createColumnDef<T>(col, cellTextAlignment));
  }

  // Close trailing group if any
  if (activeGroupTitle) flushGroup();

  return result;
}

