// src/components/Panel/interface.ts
export interface IconObject {
  icon: string;
  color?: string;
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
  color?: "primary" | "success" | "info" | "warning" | "danger" | "default";
  /** Disable panel interaction */
  disabled?: boolean;
}
