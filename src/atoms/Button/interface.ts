// src/atoms/Button/interface.ts
import { ColorType, SizeType } from '@common/interfaces';

export interface ButtonProps {
  /** Button label or children */
  children: React.ReactNode;
  /** Button color theme */
  color?: ColorType;
  /** Variant style */
  variant?: "default" | "outlined" | "link";
  /** Button size */
  size?: SizeType;
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
  /** Any additional attributes */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  [key: string]: any;
}
