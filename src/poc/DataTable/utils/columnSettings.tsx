// src/poc/DataTable/utils/columnSettings.tsx
import { ColumnDef } from '@tanstack/react-table'
import { ColumnSetting } from '../interface'

export function createColumnDef<T extends object>(col: ColumnSetting): ColumnDef<T, any> {
  return {
    accessorKey: col.column,
    header: col.title,
    editor: col.editor !== false && (col.editor?.type ?? 'text'),
    size: col.width,
    minSize: col.minWidth,
    maxSize: col.maxWidth,
    enableSorting: col.sort !== false,
    enablePinning: col.pin !== false,
    enableColumnFilter: col.filter !== false,
    filterVariant: col.filter !== false && (col?.filter?.type ?? 'text'),
    meta: {
      initialSort: col.sort === 'asc' || col.sort === 'desc' ? col.sort : undefined,
      pinned: col.pin === 'pin' ? 'left' : false,
      validation: col.editor !== false ? col.editor?.validation : undefined
    } as ColumnDef<T, any>['meta'],
    cell: col.cell
      ? ({ rowValue, index }: any) => col.cell!({ rowValue, index })
      : undefined,
  } as any
}

export function transformColumnSettings<T extends object>(settings: ColumnSetting[]): ColumnDef<T, any>[] {
  const groups: Record<string, ColumnSetting[]> = {}
  const topLevel: ColumnSetting[] = []
  settings.forEach((col) => {
    if (col.groupTitle) {
      groups[col.groupTitle] = groups[col.groupTitle] || []
      groups[col.groupTitle].push(col)
    } else {
      topLevel.push(col)
    }
  })
  const groupColumns: ColumnDef<T, any>[] = Object.entries(groups).map(([groupTitle, cols]) => ({
    header: groupTitle,
    columns: cols.map((c) => createColumnDef<T>(c)),
  }))
  const topColumns = topLevel.map((col) => createColumnDef<T>(col))
  return [...groupColumns, ...topColumns]
}
