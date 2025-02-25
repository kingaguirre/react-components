import { useEffect } from 'react'
import { SelectedCellType } from '../interface'
import { getScrollParent } from '../../../utils'

export const useAutoScroll = (selectedCell: SelectedCellType) => {
  useEffect(() => {
    if (!selectedCell) return

    const cellEl = document.querySelector(
      `[data-row-id='${selectedCell.rowId}'][data-col-id='${selectedCell.columnId}']`
    ) as HTMLElement | null

    if (cellEl) {
      // Find the nearest scrollable container.
      const scrollParent = getScrollParent(cellEl)

      // Determine the visible bounds of the scroll container.
      const containerRect =
        scrollParent === window
          ? {
              top: 0,
              left: 0,
              bottom: window.innerHeight,
              right: window.innerWidth,
            }
          : (scrollParent as HTMLElement).getBoundingClientRect()

      // Get the cell's bounding rectangle.
      const rect = cellEl.getBoundingClientRect()

      // Check if the entire cell is visible inside the container.
      const isFullyVisible =
        rect.top >= containerRect.top &&
        rect.bottom <= containerRect.bottom &&
        rect.left >= containerRect.left &&
        rect.right <= containerRect.right

      if (!isFullyVisible) {
        // Scroll just enough so that the entire element is in view.
        cellEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }
    }
  }, [selectedCell])
}
