// components/VirtualizedItem.tsx
import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';

interface VirtualizedItemProps {
  children: React.ReactNode;
  offsetTop?: number;
  offsetBottom?: number;
  fieldKey?: string;
}

const VirtualizedItem: React.FC<VirtualizedItemProps> = ({
  children,
  offsetTop = 0,
  offsetBottom = 0,
  fieldKey,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  // 1) Measure the “true” height of our content any time it changes
  useLayoutEffect(() => {
    if (ref.current) {
      setMeasuredHeight(ref.current.getBoundingClientRect().height);
    }
  }, [children]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // 2) Figure out whether we should watch window or an inner scrollable container
    const getScrollParent = (n: HTMLElement | null): HTMLElement | Window => {
      let p = n?.parentElement;
      while (p && p !== document.body) {
        const { overflowY } = getComputedStyle(p);
        if (/(auto|scroll)/.test(overflowY) && p.scrollHeight > p.clientHeight) {
          return p;
        }
        p = p.parentElement;
      }
      // no inner scrollable, so fall back to window
      return window;
    };
    const scrollContainer = getScrollParent(node);

    // 3) Throttled check to see if our element is within the visible bounds
    const checkVisibility = () => {
      if (!node) return;

      const rect = node.getBoundingClientRect();
      let topBoundary = 0;
      let bottomBoundary =
        scrollContainer instanceof HTMLElement
          ? scrollContainer.getBoundingClientRect().bottom
          : window.innerHeight;

      if (scrollContainer instanceof HTMLElement) {
        topBoundary = scrollContainer.getBoundingClientRect().top;
      }

      const isVisible =
        rect.bottom > topBoundary - offsetTop &&
        rect.top < bottomBoundary + offsetBottom;

      setVisible(isVisible);
    };

    // 4) Fire once on mount (in case it’s already in view)
    checkVisibility();

    // 5) Listen for scroll & resize/orientation events
    const handler = () => requestAnimationFrame(checkVisibility);
    scrollContainer.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);

    // 6) (Optional) watch for size changes if you want truly dynamic layouts
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(handler);
      ro.observe(node);
      if (scrollContainer instanceof HTMLElement) {
        ro.observe(scrollContainer);
      }
    }

    // 7) NEW: watch for child‑list changes so hiding the table triggers a visibility check
    const mutationObserver = new MutationObserver(handler);
    // observe the same container you’re scrolling:
    const parentToWatch = scrollContainer instanceof HTMLElement
      ? scrollContainer
      : document.body;
    mutationObserver.observe(parentToWatch, {
      childList: true,
      subtree: true,
    });

    return () => {
      scrollContainer.removeEventListener('scroll', handler);
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
      if (ro) ro.disconnect();
      mutationObserver.disconnect();
    };
  }, [offsetTop, offsetBottom, measuredHeight, fieldKey]);

  return (
    <div
      ref={ref}
      data-field-key={fieldKey}
      style={{
        // reserve vertical space when hidden
        minHeight: !visible ? `${measuredHeight}px` : undefined,
        overflow: !visible ? 'hidden' : undefined,
        // fade in/out for smoother UX
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      {visible && children}
    </div>
  );
};

export default VirtualizedItem;
