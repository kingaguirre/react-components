// useAutoScroll.ts
import { useEffect } from "react";
import { SelectedCellType } from "../interface";
import { getScrollParent } from "../../../utils";

export const useAutoScroll = (
  selectedCell: SelectedCellType | null,
  containerRef: React.RefObject<HTMLElement>,
) => {
  useEffect(() => {
    if (!selectedCell) return;
    const container = containerRef.current;
    if (!container) return;

    // wait a frame to ensure the target cell is in the DOM after state updates/virtualization
    let rafId = requestAnimationFrame(() => {
      // 🔑 Scope to *this* table only
      const cellEl = container.querySelector(
        `[data-row-id='${selectedCell.rowId}'][data-col-id='${selectedCell.columnId}']`,
      ) as HTMLElement | null;

      if (!cellEl) return;

      const scrollParent = getScrollParent(cellEl);

      // Sticky offsets (tune to your layout)
      const stickyHeaderHeight = 84;
      const stickyFooterHeight = 12;
      const stickyLeftWidth = 125;
      const stickyRightWidth = 12;

      const cellRect = cellEl.getBoundingClientRect();

      if (scrollParent === window) {
        let newScrollY = window.scrollY;
        let newScrollX = window.scrollX;

        // Vertical
        if (cellRect.top < stickyHeaderHeight) {
          newScrollY += cellRect.top - stickyHeaderHeight;
        } else if (cellRect.bottom > window.innerHeight - stickyFooterHeight) {
          newScrollY +=
            cellRect.bottom - (window.innerHeight - stickyFooterHeight);
        }

        // Horizontal
        if (cellRect.left < stickyLeftWidth) {
          newScrollX += cellRect.left - stickyLeftWidth;
        } else if (cellRect.right > window.innerWidth - stickyRightWidth) {
          newScrollX += cellRect.right - (window.innerWidth - stickyRightWidth);
        }

        window.scrollTo({
          top: newScrollY,
          left: newScrollX,
          behavior: "smooth",
        });
      } else {
        const sp = scrollParent as HTMLElement;
        const containerRect = sp.getBoundingClientRect();
        const currentScrollTop = sp.scrollTop;
        const currentScrollLeft = sp.scrollLeft;

        let offsetY = 0;
        let offsetX = 0;

        // Vertical
        if (cellRect.top < containerRect.top + stickyHeaderHeight) {
          offsetY = cellRect.top - containerRect.top - stickyHeaderHeight;
        } else if (
          cellRect.bottom >
          containerRect.bottom - stickyFooterHeight
        ) {
          offsetY =
            cellRect.bottom - (containerRect.bottom - stickyFooterHeight);
        }

        // Horizontal
        if (cellRect.left < containerRect.left + stickyLeftWidth) {
          offsetX = cellRect.left - containerRect.left - stickyLeftWidth;
        } else if (cellRect.right > containerRect.right - stickyRightWidth) {
          offsetX = cellRect.right - (containerRect.right - stickyRightWidth);
        }

        sp.scrollTo({
          top: currentScrollTop + offsetY,
          left: currentScrollLeft + offsetX,
          behavior: "smooth",
        });
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [selectedCell, containerRef]);
};
