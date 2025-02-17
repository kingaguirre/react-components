// src/atoms/Badge/interface.ts
export interface BadgeProps {
  color?: "primary" | "success" | "warning" | "danger" | "info" | "default";
  size?: "sm" | "md" | "lg";
  borderRadius?: string;
  disabled?: boolean;
  width?: string;
  outlined?: boolean; // New prop for outlined style
  children?: React.ReactNode;
}
