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

  // Function to open the modal
  const openModal = () => {
    // Calculate scrollbar width if the body is scrollable.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";
    setIsVisible(true);
    setIsClosing(false);
  };

  // Function to close the modal
  const closeModal = () => {
    setIsClosing(true);
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 300);
  };

  useEffect(() => {
    if (show) {
      openModal();
    }

    if (isVisible) {
      closeModal();
    }
  }, [show]);

  // Add escape key listener for closing the modal if closeable is true
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeable) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeable, onClose]);

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
