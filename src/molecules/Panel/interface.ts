// src/components/Panel/interface.ts
import React from "react";
import { ColorType } from "../../common/interface";
import { TooltipProps } from "../../atoms/Tooltip/interface";
import type { AccordionItemDetail } from "../../molecules/Accordion/interface"; // reuse same detail shape

export interface IconObject {
  icon: string;
  color?: string;
  hoverColor?: string;
  text?: string;
  tooltip?: string;
  tooltipColor?: ColorType;
  tooltipType?: TooltipProps["type"];
  tooltipPlacement?: TooltipProps["placement"];
  onClick?: () => void;
}

export interface PanelProps {
  /** Title of the panel */
  title?: string;
  /** Content inside the panel */
  children: React.ReactNode;

  /** Left icon object (back-compat) */
  leftIcon?: IconObject;
  /** Array of right icons (back-compat) */
  rightIcons?: IconObject[];

  /** Panel theme color */
  color?: ColorType;
  /** Disable panel interaction */
  disabled?: boolean;
  /** renders a sub-header style */
  isSubHeader?: boolean; // default: false
  /** toggle drop shadow on the panel container */
  hideShadow?: boolean; // default: false
  /** toggle panel content padding */
  noPadding?: boolean; // default: false
  /** Additional class names */
  className?: string;

  /** Custom header content slots (free-form) */
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;

  onHeaderClick?: () => void;

  /**
   * Badge / icon / text details, same model as Accordion.
   * Useful for counts, status chips, extra actions, etc.
   */
  leftDetails?: AccordionItemDetail[];
  rightDetails?: AccordionItemDetail[];
}
