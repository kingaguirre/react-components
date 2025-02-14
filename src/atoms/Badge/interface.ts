// src/atoms/Badge/interface.ts
import { ColorType } from '@common/interfaces';

export interface BadgeProps {
  color?: ColorType;
  size?: "sm" | "md" | "lg";
  borderRadius?: string;
  disabled?: boolean;
  width?: string;
  outlined?: boolean; // New prop for outlined style
  children?: React.ReactNode;
}
