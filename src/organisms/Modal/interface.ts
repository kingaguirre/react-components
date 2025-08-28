// src/components/Modal/interface.ts
import { PanelProps } from "../../molecules/Panel/interface";

export interface ModalProps extends Omit<PanelProps, "className"> {
  show: boolean;
  closeable?: boolean;
  showCloseIcon?: boolean;
  modalWidth?: "sm" | "md" | "lg" | "auto";
  zIndex?: number;

  unmountOnHide?: boolean;
  onOpening?: () => void;
  onClosing?: () => void;
  onOpened?: () => void;
  onClosed?: () => void;

  onClose?: () => void;
}
