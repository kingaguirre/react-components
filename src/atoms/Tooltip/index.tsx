// src/atoms/Tooltip/index.tsx
import React from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; // Import Tippy default styles
import type { TooltipProps } from "./interface";
import { theme } from "../../styles/theme";

export const Tooltip: React.FC<TooltipProps> = ({
  color = "default",
  content,
  children,
  trigger = "mouseenter",
  arrow = true,
  ...rest
}) => {
  return (
    <Tippy
      {...rest}
      content={content}
      trigger={trigger}
      arrow={arrow}
      appendTo={document.body}
      onMount={(instance) => {
        const popper = instance.popper;
        const box: HTMLElement | null = popper.querySelector(".tippy-box");
        if (box) {
          // Override default background, border, and font styles.
          box.style.backgroundColor = theme.colors[color].base;
          box.style.borderColor = theme.colors[color].dark;
          box.style.fontFamily = theme.fontFamily;
        }
        // Update arrow's color to match the background.
        const arrowEl: HTMLElement | null = popper.querySelector(".tippy-arrow");
        if (arrowEl) {
          arrowEl.style.color = theme.colors[color].base;
        }
      }}
    >
      {children}
    </Tippy>
  );
};

export default Tooltip;
