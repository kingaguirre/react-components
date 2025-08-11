// Alert/Molecules/interface.ts
import { ReactNode } from "react";
import { ColorType } from "../../common/interface";

export interface AlertProps {
  /** The alert’s color variant (keys should match your theme colors) */
  color?: ColorType;
  /** Whether the alert is visible */
  show?: boolean;
  /** Left-side icon (as a string, e.g. an emoji or icon class) */
  icon?: string;
  /** Whether the close icon is visible */
  closeIcon?: boolean;
  /** Title displayed above the content (as a string) */
  title?: string;
  /** The main message or content */
  children: ReactNode;
  /** If true, render the alert as a toast (in a portal) */
  toast?: boolean;
  /** Delay (in ms) before auto closing a toast; defaults to 5000 */
  closeDelay?: number;
  /**
   * If true then the alert won’t have a close icon and,
   * if it’s a toast, clicking anywhere won’t close it.
   */
  closeable?: boolean;
  /**
   * For toasts only, defines where the alert will be placed.
   * Options: 'top-left', 'top-right', 'bottom-left', 'bottom-right'
   */
  placement?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Callback fired when the alert is closing */
  onClose?: () => void;
  /** The type of animation to use for the alert */
  animation?: "grow" | "slide" | "fade";
}
