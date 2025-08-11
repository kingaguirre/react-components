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
}
