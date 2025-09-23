// components/VirtualizedItem.tsx
import React, { useRef, useState, useLayoutEffect, useEffect } from "react";

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
  const heightRef = useRef(0);

  // Measure ONLY when content is mounted/visible, and only if it actually changed.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !visible) return;
    const next = Math.ceil(el.getBoundingClientRect().height);
    if (next !== heightRef.current) {
      heightRef.current = next;
      setMeasuredHeight(next);
    }
  }, [children, visible]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const getScrollParent = (n: HTMLElement | null): HTMLElement | Window => {
      let p = n?.parentElement;
      while (p && p !== document.body) {
        const { overflowY } = getComputedStyle(p);
        if (/(auto|scroll)/.test(overflowY) && p.scrollHeight > p.clientHeight)
          return p;
        p = p.parentElement;
      }
      return window;
    };
    const scrollContainer = getScrollParent(node);

    const checkVisibility = () => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const containerRect =
        scrollContainer instanceof HTMLElement
          ? scrollContainer.getBoundingClientRect()
          : { top: 0, bottom: window.innerHeight };

      const topBoundary = containerRect.top;
      const bottomBoundary = containerRect.bottom;

      const inView =
        rect.bottom > topBoundary - offsetTop &&
        rect.top < bottomBoundary + offsetBottom;

      setVisible((prev) => (prev !== inView ? inView : prev));
    };

    // Initial check
    checkVisibility();

    const onScrollOrResize = () => requestAnimationFrame(checkVisibility);

    scrollContainer.addEventListener("scroll", onScrollOrResize, {
      passive: true,
    });
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("orientationchange", onScrollOrResize);

    // ResizeObserver ONLY on our node (avoid observing the scroll container)
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        // If it's visible, keep our cached height up to date.
        if (!ref.current || !visible) return;
        const next = Math.ceil(ref.current.getBoundingClientRect().height);
        if (next !== heightRef.current) {
          heightRef.current = next;
          setMeasuredHeight(next);
        }
        requestAnimationFrame(checkVisibility);
      });
      ro.observe(node);
    }

    // IMPORTANT: Remove the MutationObserver on the scroll container subtree.
    // It was causing event storms and feedback loops.

    return () => {
      scrollContainer.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("orientationchange", onScrollOrResize);
      ro?.disconnect();
    };
  }, [offsetTop, offsetBottom, fieldKey]);

  return (
    <div
      ref={ref}
      data-field-key={fieldKey}
      style={{
        // reserve space when hidden (fallback to 1px to avoid collapse if height is 0)
        minHeight: !visible ? `${measuredHeight || 1}px` : undefined,
        overflow: !visible ? "hidden" : undefined,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease-in-out",
      }}
    >
      {visible ? children : null}
    </div>
  );
};

export default VirtualizedItem;
