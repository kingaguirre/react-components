// src/atoms/Button/interface.ts
export interface ButtonProps {
  /** Button label or children */
  children: React.ReactNode;
  /** Button color theme */
  color?: "primary" | "success" | "warning" | "danger" | "info" | "default";
  /** Variant style */
  variant?: "default" | "outlined" | "link";
  /** Button size */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Whether the button has rounded edges */
  rounded?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is active state */
  active?: boolean;
  /** Whether the button is full width */
  fullWidth?: boolean;
  /** Additional class names */
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}
