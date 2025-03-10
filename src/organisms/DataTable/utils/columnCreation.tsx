// src/organisms/DataTable/utils/columnCreation.tsx
import { ColumnDef } from '@tanstack/react-table'
import { ColumnSetting } from '../interface'

export function createColumnDef<T extends object>(col: ColumnSetting, index?: number, cellTextAlignment?: string): ColumnDef<T, any> {
  return {
    accessorKey: col.column,
    header: col.title,
    minSize: col.minWidth ?? 60,
    maxSize: col.maxWidth,
    enableSorting: col.sort !== false,
    enablePinning: col.pin !== false,
    enableColumnFilter: col.filter !== false,
    ...(col.filter !== false && !!col.filter?.filterBy ? {filterFn: col.filter?.filterBy} : {}),
    meta: {
      initialSort: col.sort === 'asc' || col.sort === 'desc' ? col.sort : undefined,
      pinned: col.pin === 'pin' ? 'left' : false,
      validation: col.editor !== false ? col.editor?.validation : undefined,
      filter: col.filter,
      editor: col.editor,
      columnId: index !== undefined ? `${col.column}-${index}` : col.column,
      hidden: col.hidden,
      align: col.align ?? cellTextAlignment,
      headerAlign: col.headerAlign ?? col.align ?? cellTextAlignment,
      draggable: col.draggable,
      order: col.order,
      disabled: col.disabled
    } as ColumnDef<T, any>['meta'],
    ...(col.cell ? {
      cell: ({ rowValue, index }: any) => col.cell!({ rowValue, index })
    } : {})
  } as any
}

export function transformColumnSettings<T extends object>(settings: ColumnSetting[], cellTextAlignment?: string): ColumnDef<T, any>[] {
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
    id: `group-${groupTitle}`, 
    header: groupTitle,
    columns: cols.map((c, idx) => createColumnDef<T>(c, idx, cellTextAlignment)),
  }))
  const topColumns = topLevel.map((col, idx) => createColumnDef<T>(col, idx, cellTextAlignment))
  return [...groupColumns, ...topColumns]
}
