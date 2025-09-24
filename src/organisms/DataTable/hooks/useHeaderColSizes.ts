import { useMemo } from "react";
import type { Table, Column } from "@tanstack/react-table";

function clampToDef(n: number, col?: Column<any, unknown>) {
  const min = Number(col?.columnDef?.minSize ?? 1); // no arbitrary 40px floor
  const max = Number(col?.columnDef?.maxSize ?? 10000); // generous ceiling
  const v = Math.round(Number.isFinite(n) ? n : 0);
  return Math.max(min, Math.min(max, v));
}

export function useHeaderColSizes<TData>(
  table: Table<TData>,
  isLoading: boolean,
  defaultSize = 120,
) {
  return useMemo(() => {
    if (!isLoading) return [] as number[];

    const groups = table.getHeaderGroups?.() ?? [];
    const last = groups.length ? groups[groups.length - 1] : undefined;
    const headers: any[] = (last?.headers ?? []) as any[];

    if (headers.length) {
      return headers.map((h) => {
        const col: Column<any, unknown> | undefined = h?.column;
        const sz =
          (typeof h.getSize === "function" && h.getSize()) ||
          (col &&
            typeof (col as any).getSize === "function" &&
            (col as any).getSize()) ||
          col?.columnDef?.size ||
          defaultSize;
        return clampToDef(sz, col); // ✅ honors 30px built-ins
      });
    }

    // Fallback if header groups aren’t ready yet
    const visible = table.getVisibleLeafColumns() as any[];
    return visible.map((col) =>
      clampToDef(
        (typeof col.getSize === "function" && col.getSize()) ||
          col?.columnDef?.size ||
          defaultSize,
        col,
      ),
    );
    // Depend only on header-affecting state while loading
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoading,
    table.getState().columnOrder,
    table.getState().columnVisibility,
    table.getState().columnPinning,
    table.getState().columnSizing,
    table.getState().grouping,
  ]);
}
