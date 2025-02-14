// src/atoms/Icon/interface.ts
export interface IconProps {
  /** The icon class name */
  icon: string;
  /** Optional size of the icon (inherits from parent if not defined) */
  size?: string;
  /** Optional color of the icon (inherits from parent if not defined) */
  color?: string;
  /** Whether the icon is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void
}
