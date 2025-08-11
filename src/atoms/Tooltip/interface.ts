import React from "react";
import { ColorType } from "../../common/interface";

export interface TooltipProps {
  /**
   * The color theme to use.
   * Accepts keys from your theme.colors.
   */
  color?: ColorType;
  /**
   * The content displayed inside the tooltip.
   */
  content: React.ReactNode;
  /**
   * The child element that triggers the tooltip.
   */
  children: React.ReactNode;
  /**
   * Where to position the tooltip relative to the child.
   * Options: "top", "right", "bottom", "left"
   */
  placement?: "top" | "right" | "bottom" | "left";
  /**
   * The trigger event for the tooltip.
   * Options: "hover", "click",
   * Defaults to "hover".
   */
  trigger?: "hover" | "click";
  /** Sets max width for tooltip */
  maxWidth?: number;
  minWidth?: number;
  type?: "tooltip" | "title";
  testId?: string;
}
