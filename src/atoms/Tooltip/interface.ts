// src/atoms/Tooltip/interface.ts
import type { TippyProps } from "@tippyjs/react";
import React from "react";
import { ColorType } from "@common/interfaces";

export interface TooltipProps extends Omit<TippyProps, "children"> {
  /**
   * The color theme to use.
   * Accepts keys from your theme.colors.
   */
  color?: ColorType;
  children: React.ReactElement;
  content: React.ReactNode;
  placement?: "top" | "right" | "bottom" | "left";
  /**
   * The trigger type for the tooltip.
   * Options: 'mouseenter', 'click', 'focus', 'manual'
   * Defaults to 'mouseenter' (hover).
   */
  trigger?: "mouseenter" | "click" | "focus" | "manual";
  /**
   * Whether to display an arrow on the tooltip.
   * Defaults to true.
   */
  arrow?: boolean;
}
