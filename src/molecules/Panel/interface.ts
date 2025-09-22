// src/components/Panel/interface.ts
import { ColorType } from "../../common/interface";
import { TooltipProps } from "../../atoms/Tooltip/interface";

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
  /** Left icon object */
  leftIcon?: IconObject;
  /** Array of right icons */
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
}
