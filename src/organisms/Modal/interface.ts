// src/components/Modal/interface.ts
import { PanelProps } from "@molecules/Panel/interface";

export interface ModalProps extends Omit<PanelProps, "className"> {
  show: boolean;
  closeable?: boolean;
  showCloseIcon?: boolean;
  onClose?: () => void;
  modalWidth?: "sm" | "md" | "lg" | "auto";
  zIndex?: number;
}
