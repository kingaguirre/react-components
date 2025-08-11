import { useEffect } from "react";
import { SelectedCellType } from "../interface";
import { getScrollParent } from "../../../utils";

export const useAutoScroll = (selectedCell: SelectedCellType) => {
  useEffect(() => {
    if (!selectedCell) return;

    const cellEl = document.querySelector(
      `[data-row-id='${selectedCell.rowId}'][data-col-id='${selectedCell.columnId}']`,
    ) as HTMLElement | null;

    if (cellEl) {
      const scrollParent = getScrollParent(cellEl);
      // Set your sticky offsets.
      const stickyHeaderHeight = 84; // adjust to your sticky header's height
      const stickyFooterHeight = 12; // adjust to your sticky footer's height
      const stickyLeftWidth = 125; // adjust to your sticky left element's width
      const stickyRightWidth = 12; // adjust to your sticky right element's width

      // Get cell's bounding rectangle.
      const cellRect = cellEl.getBoundingClientRect();

      if (scrollParent === window) {
        // For window scrolling, use window dimensions and scroll positions.
        let newScrollY = window.scrollY;
        let newScrollX = window.scrollX;

        // Vertical logic:
        if (cellRect.top < stickyHeaderHeight) {
          // If the top of the cell is hidden behind the sticky header.
          newScrollY = window.scrollY + (cellRect.top - stickyHeaderHeight);
        } else if (cellRect.bottom > window.innerHeight - stickyFooterHeight) {
          // If the bottom of the cell is hidden behind the sticky footer.
          newScrollY =
            window.scrollY +
            (cellRect.bottom - (window.innerHeight - stickyFooterHeight));
        }

        // Horizontal logic:
        if (cellRect.left < stickyLeftWidth) {
          // If the left side of the cell is hidden behind the sticky element.
          newScrollX = window.scrollX + (cellRect.left - stickyLeftWidth);
        } else if (cellRect.right > window.innerWidth - stickyRightWidth) {
          // If the right side of the cell is hidden behind the sticky element.
          newScrollX =
            window.scrollX +
            (cellRect.right - (window.innerWidth - stickyRightWidth));
        }

        window.scrollTo({
          top: newScrollY,
          left: newScrollX,
          behavior: "smooth",
        });
      } else {
        // For a scrollable container element.
        const containerRect = (
          scrollParent as HTMLElement
        ).getBoundingClientRect();
        const currentScrollTop = (scrollParent as HTMLElement).scrollTop;
        const currentScrollLeft = (scrollParent as HTMLElement).scrollLeft;

        let offsetY = 0;
        let offsetX = 0;

        // Vertical adjustment.
        if (cellRect.top < containerRect.top + stickyHeaderHeight) {
          // Cell's top is above the visible area.
          offsetY = cellRect.top - containerRect.top - stickyHeaderHeight;
        } else if (
          cellRect.bottom >
          containerRect.bottom - stickyFooterHeight
        ) {
          // Cell's bottom is below the visible area.
          offsetY =
            cellRect.bottom - (containerRect.bottom - stickyFooterHeight);
        }

        // Horizontal adjustment.
        if (cellRect.left < containerRect.left + stickyLeftWidth) {
          // Cell's left is hidden.
          offsetX = cellRect.left - containerRect.left - stickyLeftWidth;
        } else if (cellRect.right > containerRect.right - stickyRightWidth) {
          // Cell's right is offscreen.
          offsetX = cellRect.right - (containerRect.right - stickyRightWidth);
        }

        (scrollParent as HTMLElement).scrollTo({
          top: currentScrollTop + offsetY,
          left: currentScrollLeft + offsetX,
          behavior: "smooth",
        });
      }
    }
  }, [selectedCell]);
};
