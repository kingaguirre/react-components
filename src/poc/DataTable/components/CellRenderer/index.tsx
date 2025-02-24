import React from 'react'
import { EditableCell } from './EditableCell'

export interface CellRendererProps {
  row: any
  getValue: () => any
  column?: any // mark as optional just in case
  editingCell: { rowId: string; columnId: string } | null
  setEditingCell: React.Dispatch<React.SetStateAction<{ rowId: string; columnId: string } | null>>
  handleCellCommit: (rowId: string, columnId: string, value: any) => void
  cell?: any
}

const CellRendererComponent: React.FC<CellRendererProps> = ({
  row,
  getValue,
  column,
  editingCell,
  setEditingCell,
  handleCellCommit,
  cell,
}) => {
  const colMeta = column.columnDef.meta ?? {}
  const { validation, editor, columnId } = colMeta
  const { type: editorType, options = [] } = editor ?? {}

  // If the cell is in editing mode and an editor is allowed.
  if (
    editingCell &&
    editingCell.rowId === row.original.__internalId &&
    editingCell.columnId === columnId &&
    editorType !== false
  ) {
    const rawValue = getValue()
    let cellValue: any
    if (editorType === 'date-range') {
      cellValue = Array.isArray(rawValue) ? rawValue.join(',') : rawValue
    } else if (
      editorType === 'checkbox-group' ||
      editorType === 'switch-group' ||
      editorType === 'radio-group'
    ) {
      cellValue = editorType === 'radio-group' ? rawValue : Array.isArray(rawValue) ? rawValue : rawValue
    } else if (editorType === 'checkbox' || editorType === 'radio') {
      cellValue = Boolean(rawValue)
    } else {
      cellValue = rawValue != null ? rawValue : ''
    }

    return (
      <EditableCell
        editorType={editorType || 'text'}
        options={options}
        value={cellValue}
        validation={validation}
        onChange={(val) => handleCellCommit(row.original.__internalId, column.id, val)}
        autoFocus
        onCancel={() => setEditingCell(null)}
        name={`${row.original.__internalId}-${columnId}`}
      />
    )
  }

  // If a custom cell renderer is provided, use it.
  if (cell) {
    return cell({ rowValue: row.original, index: row.index })
  }

  // Default cell rendering logic.
  const rawValue = getValue()

  let cellValue: any = ''
  if (editorType === 'date-range' || editorType === 'number-range') {
    if (Array.isArray(rawValue) && rawValue[0] === '' && rawValue[1] === '') {
      cellValue = ''
    } else if (Array.isArray(rawValue)) {
      cellValue = rawValue.join(',')
    } else {
      cellValue = rawValue
    }
  } else if (
    editorType === 'checkbox-group' ||
    editorType === 'switch-group' ||
    editorType === 'radio-group'
  ) {
    cellValue = Array.isArray(rawValue) ? rawValue.join(',') : rawValue
  } else if (editorType === 'checkbox' || editorType === 'radio') {
    cellValue = Boolean(rawValue)
  } else {
    cellValue = rawValue != null ? rawValue : ''
  }
  return cellValue?.toString()
}

export const CellRenderer = React.memo(CellRendererComponent)
