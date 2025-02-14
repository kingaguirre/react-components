import { useCallback } from 'react';

interface UseRowActionsProps<T> {
  data: T[];
  setData: React.Dispatch<React.SetStateAction<T[]>>;
  editingCell: { rowId: string; columnId: string } | null;
  setEditingCell: React.Dispatch<React.SetStateAction<{ rowId: string; columnId: string } | null>>;
  currentEditorRef: React.RefObject<HTMLInputElement | HTMLSelectElement>;
  onChange?: (updatedData: T[]) => void;
}

export function useRowActions<T extends object>({
  data,
  setData,
  editingCell,
  setEditingCell,
  currentEditorRef,
  onChange,
}: UseRowActionsProps<T>) {
  const handleSaveRow = useCallback((rowId: string) => {
    if (editingCell && editingCell.rowId === rowId && currentEditorRef.current) {
      currentEditorRef.current.blur();
      setTimeout(() => {
        setData((old) => {
          const rowIndex = old.findIndex((r) => (r as any).__internalId === rowId);
          if (rowIndex === -1) return old;
          const updated = old.map((row, i) => {
            if (i === rowIndex) {
              const newRow = { ...row };
              delete (newRow as any).__isNew;
              return newRow;
            }
            return row;
          });
          if (!((updated[rowIndex] as any).__isNew) && onChange) {
            onChange(updated);
          }
          return updated;
        });
      }, 0);
    } else {
      setData((old) => {
        const rowIndex = old.findIndex((r) => (r as any).__internalId === rowId);
        if (rowIndex === -1) return old;
        const updated = old.map((row, i) => {
          if (i === rowIndex) {
            const newRow = { ...row };
            delete (newRow as any).__isNew;
            return newRow;
          }
          return row;
        });
        if (onChange) onChange(updated);
        return updated;
      });
    }
    setEditingCell(null);
  }, [editingCell, currentEditorRef, onChange, setData, setEditingCell]);

  const handleDelete = useCallback((rowId: string) => {
    setEditingCell(null);
    setData((old) => {
      const updated = old.filter((r) => (r as any).__internalId !== rowId);
      if (onChange) onChange(updated);
      return updated;
    });
  }, [onChange, setData, setEditingCell]);

  const handleCancelRow = useCallback((rowId: string) => {
    if (editingCell && editingCell.rowId === rowId && currentEditorRef.current) {
      currentEditorRef.current.blur();
    }
    setData((old) => old.filter((r) => (r as any).__internalId !== rowId));
    setEditingCell(null);
  }, [editingCell, currentEditorRef, setData, setEditingCell]);

  return { handleSaveRow, handleDelete, handleCancelRow };
}
