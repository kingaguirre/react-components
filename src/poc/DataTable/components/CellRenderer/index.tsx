import React from 'react'
import { EditableCell } from './EditableCell'

export interface CellRendererProps {
  row: any
  getValue: () => any
  column?: any // mark as optional just in case
  editingCell: { rowId: string; columnId: string } | null
  currentEditorRef: React.RefObject<HTMLInputElement | HTMLSelectElement>
  setEditingCell: React.Dispatch<React.SetStateAction<{ rowId: string; columnId: string } | null>>
  handleCellCommit: (rowId: string, columnId: string, value: any) => void
  editor?: any
  customCell?: any
}

const CellRendererComponent: React.FC<CellRendererProps> = ({
  row,
  getValue,
  column,
  editingCell,
  currentEditorRef,
  setEditingCell,
  handleCellCommit,
  editor,
  customCell,
}) => {
  // If the cell is in editing mode and an editor is allowed.
  if (
    editingCell &&
    editingCell.rowId === row.original.__internalId &&
    editingCell.columnId === column.id &&
    editor !== false
  ) {
    const rawValue = getValue()
    let cellValue: any
    if (editor === 'date-range' || editor === 'number-range') {
      cellValue = Array.isArray(rawValue) ? rawValue : ['', '']
    } else if (
      editor === 'checkbox-group' ||
      editor === 'switch-group' ||
      editor === 'radio-group'
    ) {
      cellValue = editor === 'radio-group' ? rawValue : Array.isArray(rawValue) ? rawValue : []
    } else if (editor === 'checkbox') {
      cellValue = Boolean(rawValue)
    } else {
      cellValue = rawValue != null ? rawValue : ''
    }
    return (
      <EditableCell
        ref={currentEditorRef}
        editorType={editor || 'text'}
        value={cellValue}
        validation={column.columnDef.meta?.validation}
        onChange={(val) =>
          handleCellCommit(row.original.__internalId, column.id, val)
        }
        autoFocus
        onCancel={() => setEditingCell(null)}
      />
    )
  }

  // If a custom cell renderer is provided, use it.
  if (customCell) {
    return customCell({ rowValue: row.original, index: row.index })
  }

  // Default cell rendering logic.
  const rawValue = getValue()

  let cellValue: any = ''
  if (editor === 'date-range' || editor === 'number-range') {
    if (Array.isArray(rawValue) && rawValue[0] === '' && rawValue[1] === '') {
      cellValue = ''
    } else if (Array.isArray(rawValue)) {
      cellValue = rawValue.join(' - ')
    } else {
      cellValue = rawValue
    }
  } else if (
    editor === 'checkbox-group' ||
    editor === 'switch-group' ||
    editor === 'radio-group'
  ) {
    cellValue = editor === 'radio-group' ? rawValue : Array.isArray(rawValue) ? rawValue : []
  } else if (editor === 'checkbox' || editor === 'radio') {
    cellValue = Boolean(rawValue)
  } else {
    cellValue = rawValue != null ? rawValue : ''
  }
  return <>{cellValue?.toString()}</>
}

export const CellRenderer = React.memo(CellRendererComponent)
