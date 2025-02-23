// ColumnSettings.tsx
import { ValidatorHelper } from './validationutils'
import { ColumnDef } from '@tanstack/react-table';
import { ZodSchema } from 'zod';
import { EditorType } from './EditableCell'

export interface ColumnSetting {
  title: string;             // Header title for the column
  column: string;            // Field name (accessor)
  groupTitle?: string;       // Optional group header; columns sharing this value will be nested
  sort?: 'asc' | 'desc' | undefined | false; // Initial sort order; false disables sort for this column
  pin?: 'pin' | 'unpin' | false; // 'pin' pins left (default unpinned); false disables pinning
  // editor?: 'text' | 'date' | 'date-range' | 'select' | 'number' | 'number-range' | 'checkbox' | 'radio' | 'switch' | 'checkbox-group' | 'radio-group' | 'switch-group' | false;
  width?: number;            // Default width
  minWidth?: number;         // Minimum width
  maxWidth?: number;         // Maximum width
  cell?: ({ rowValue, index }: { rowValue: any; index: number }) => JSX.Element; // Optional custom cell renderer
  // validation?: (v: ValidatorHelper) => ZodSchema<any>;
  editor?: {
    type?: EditorType;
    validation?: (v: ValidatorHelper) => ZodSchema<any>;
  } | false
  filter?: { type?: string, options?: any[] } | undefined | false
}

export function createColumnDef<T extends object>(col: ColumnSetting): ColumnDef<T, any> {
  return {
    accessorKey: col.column,
    header: col.title,
    // Pass the editor type as a custom property for use in cell rendering.
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
    },
    cell: col.cell
      ? ({ rowValue, index }) => col.cell!({ rowValue, index })
      : undefined,
  };
}

export function transformColumnSettings<T extends object>(settings: ColumnSetting[]): ColumnDef<T, any>[] {
  const groups: Record<string, ColumnSetting[]> = {};
  const topLevel: ColumnSetting[] = [];
  settings.forEach((col) => {
    if (col.groupTitle) {
      groups[col.groupTitle] = groups[col.groupTitle] || [];
      groups[col.groupTitle].push(col);
    } else {
      topLevel.push(col);
    }
  });
  const groupColumns: ColumnDef<T, any>[] = Object.entries(groups).map(([groupTitle, cols]) => ({
    header: groupTitle,
    columns: cols.map((c) => createColumnDef<T>(c)),
  }));
  const topColumns = topLevel.map((col) => createColumnDef<T>(col));
  return [...groupColumns, ...topColumns];
}
