// src/components/OverflowTooltip.tsx
import React, { useRef, useState, useLayoutEffect, useCallback } from "react";
import { Tooltip } from "src/atoms/Tooltip";

interface OverflowTooltipProps {
  children: string;
}

const OverflowTooltip: React.FC<OverflowTooltipProps> = ({ children }) => {
  const [overflowed, setOverflowed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const checkOverflow = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setOverflowed(el.scrollWidth > el.clientWidth);
  }, []);

  useLayoutEffect(() => {
    checkOverflow();
    const ro = new ResizeObserver(checkOverflow);
    if (containerRef.current) {
      ro.observe(containerRef.current);
      if (containerRef.current.parentElement) {
        ro.observe(containerRef.current.parentElement);
      }
    }
    window.addEventListener("resize", checkOverflow);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
  }, [checkOverflow, children]);

  return (
    <div ref={containerRef} onMouseEnter={checkOverflow}>
      {overflowed ? (
        <Tooltip content={children} placement="top">
          <span className="menu-text">{children}</span>
        </Tooltip>
      ) : (
        <span className="menu-text">{children}</span>
      )}
    </div>
  );
};

export default OverflowTooltip;
