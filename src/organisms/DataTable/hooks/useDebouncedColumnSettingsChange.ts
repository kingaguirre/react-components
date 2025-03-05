import { useEffect, useRef } from 'react'

export function useDebouncedColumnSettingsChange({
  columnSettings,
  table,
  onColumnSettingsChange,
  columnSizing,
  columnPinning,
  sorting,
  columnOrder,       // now provided as a state
  columnVisibility,  // now provided as a state
  delay = 300,
}) {
  const columnSettingsStr = JSON.stringify(columnSettings)
  const columnOrderStr = JSON.stringify(columnOrder)
  const columnVisibilityStr = JSON.stringify(columnVisibility)

  const didMountRef = useRef(false)
  const lastSentSettingsRef: any = useRef(null)

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    const handler = setTimeout(() => {
      if (onColumnSettingsChange) {
        const updatedSettings = columnSettings.map((colSetting) => {
          const tableCol = table.getAllLeafColumns().find(
            (col) =>
              col.id === colSetting.column ||
              (col.columnDef && col.columnDef.accessorKey === colSetting.column)
          )
          if (tableCol) {
            const newPin = tableCol.getIsPinned() === 'left' ? 'pin' : 'unpin'
            const newWidth = tableCol.getSize()
            const sortingEntry = sorting.find((s) => s.id === colSetting.column)
            const newSort = sortingEntry ? (sortingEntry.desc ? 'desc' : 'asc') : undefined
            const order = columnOrder.indexOf(colSetting.column)
            const hidden = columnVisibility[colSetting.column] !== false
            return { 
              ...colSetting, 
              pin: newPin, 
              width: newWidth, 
              sort: newSort,
              order,
              hidden
            }
          }
          return colSetting
        })
        const updatedSettingsStr = JSON.stringify(updatedSettings)
        if (lastSentSettingsRef.current !== updatedSettingsStr) {
          onColumnSettingsChange(updatedSettings)
          lastSentSettingsRef.current = updatedSettingsStr
        }
      }
    }, delay)

    return () => clearTimeout(handler)
  }, [
    columnSizing,
    columnPinning,
    sorting,
    columnSettingsStr,
    columnOrderStr,
    columnVisibilityStr,
    onColumnSettingsChange,
    table,
    delay,
    columnSettings
  ])
}
