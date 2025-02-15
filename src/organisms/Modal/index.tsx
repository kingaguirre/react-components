// src/components/Modal/index.tsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { ModalOverlay, ModalContainer } from "./styled";
import { ModalProps } from "./interface";
import Panel from "@molecules/Panel";

export const Modal: React.FC<ModalProps> = ({
  show,
  closeable = true,
  showCloseIcon = true,
  children,
  onClose,
  modalWidth = "md",
  zIndex = 1000,
  color = "primary",
  title,
  leftIcon,
  rightIcons,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
      setIsVisible(true);
      setIsClosing(false);
    } else if (isVisible) {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 300);
      document.body.style.overflow = "";
    }
  }, [show]);

  const handleOverlayClick = () => {
    if (closeable) {
      onClose?.();
    }
  };

  if (!isVisible) return null;

  return ReactDOM.createPortal(
    <ModalOverlay
      className="modal-overlay"
      data-testid="modal-overlay"
      $zIndex={zIndex}
      $show={!isClosing}
      onClick={handleOverlayClick}
      $closeable={closeable}
    >
      <ModalContainer
        className="modal-container"
        data-testid="modal-container"
        $modalWidth={modalWidth}
        $show={!isClosing}
        onClick={(e) => e.stopPropagation()}
      >
        <Panel
          title={title}
          color={color}
          leftIcon={leftIcon}
          rightIcons={
            showCloseIcon
              ? [
                  ...(rightIcons || []),
                  { icon: "clear", onClick: onClose },
                ]
              : rightIcons
          }
          disabled={disabled}
        >
          <div className="modal-content">{children}</div>
        </Panel>
      </ModalContainer>
    </ModalOverlay>,
    document.body
  );
};

export default Modal;
