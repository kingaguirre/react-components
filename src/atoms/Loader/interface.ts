// src/components/Loader/interface.ts
import { ColorType, SizeType } from "../../common/interface";

export type LoaderType = "default" | "line";

export interface LoaderProps {
  /** 'default' = circular spinner; 'line' = top‑attached progress bar */
  type?: LoaderType;
  /** CSS selector for portal target (only for line loader) */
  appendTo?: string;
  /** Determinate progress (0–100); omit for indeterminate */
  value?: number;
  /** Buffer progress (0–100) for secondary indicator */
  valueBuffer?: number;
  /** Size token (xs|sm|md|lg|xl) or custom dimension in px for circular loader; defaults to 'sm' */
  size?: SizeType | number;
  /** Stroke width of circular loader in px; defaults to match size token */
  thickness?: number;
  /** Theme color token; defaults to 'primary' */
  color?: ColorType;
  /** Extra className */
  className?: string;
  /** Optional label */
  label?: string;
}
