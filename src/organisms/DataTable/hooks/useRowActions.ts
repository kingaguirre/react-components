import { useCallback } from 'react'
import { DataRow } from '../interface'
import { sanitizeData } from '../utils'

interface UseRowActionsProps {
  setData: React.Dispatch<React.SetStateAction<DataRow[]>>
  editingCell: { rowId: string; columnId: string } | null
  setEditingCell: React.Dispatch<React.SetStateAction<{ rowId: string; columnId: string } | null>>
  onChange?: (data: Omit<DataRow, '__internalId'>[]) => void
  /** When provided, instead of deleting a row, update that row with this key set to true */
  partialRowDeletionID?: string
  /** Current row selection state */
  rowSelection?: Record<string, boolean>
  /** Setter for row selection state */
  setRowSelection?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}

export function useRowActions({
  setData,
  editingCell,
  setEditingCell,
  onChange,
  partialRowDeletionID,
  rowSelection,
  setRowSelection,
}: UseRowActionsProps) {
  const handleSaveRow = useCallback(
    (rowId: string) => {
      if (editingCell && editingCell.rowId === rowId) {
        setTimeout(() => {
          setData((old) => {
            const rowIndex = old.findIndex((r) => r.__internalId === rowId)
            if (rowIndex === -1) return old
            const updated = old.map((row, i) => {
              if (i === rowIndex) {
                const newRow = { ...row }
                delete newRow.__isNew
                return newRow
              }
              return row
            })
            if (!updated[rowIndex].__isNew && onChange) {
              onChange(sanitizeData(updated))
            }
            return updated
          })
        }, 0)
      } else {
        setData((old) => {
          const rowIndex = old.findIndex((r) => r.__internalId === rowId)
          if (rowIndex === -1) return old
          const updated = old.map((row, i) => {
            if (i === rowIndex) {
              const newRow = { ...row }
              delete newRow.__isNew
              return newRow
            }
            return row
          })
          if (onChange) onChange(sanitizeData(updated))
          return updated
        })
      }
      setEditingCell(null)
    },
    [editingCell, onChange, setData, setEditingCell]
  )

  const handleDelete = useCallback(
    (rowId: string) => {
      setEditingCell(null)
      setData((old) => {
        const deletedIndex = old.findIndex((r) => r.__internalId === rowId)
        if (deletedIndex === -1) return old
        if (partialRowDeletionID) {
          const updated = old.map((row) => {
            if (row.__internalId === rowId) {
              return { ...row, [partialRowDeletionID]: true }
            }
            return row
          })
          if (onChange) onChange(sanitizeData(updated))
          return updated
        } else {
          const updated = old.filter((r) => r.__internalId !== rowId)
          if (onChange) onChange(sanitizeData(updated))
          if (rowSelection && setRowSelection) {
            setRowSelection((prevSelection) => {
              // Remove the deleted row from selection.
              const newSelection = { ...prevSelection }
              const wasSelected = newSelection[rowId]
              delete newSelection[rowId]
              // If the deleted row was selected, and if a row now exists at the same index, select it.
              if (wasSelected && updated[deletedIndex]) {
                newSelection[updated[deletedIndex].__internalId] = true
              }
              return newSelection
            })
          }
          return updated
        }
      })
    },
    [partialRowDeletionID, onChange, setData, setEditingCell, rowSelection, setRowSelection]
  )

  const handleCancelRow = useCallback(
    (rowId: string) => {
      setData((old) => old.filter((r) => r.__internalId !== rowId))
      setEditingCell(null)
    },
    [setData, setEditingCell]
  )

  return { handleSaveRow, handleDelete, handleCancelRow }
}
