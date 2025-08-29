// src/components/Modal/index.tsx
import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { ModalOverlay, ModalContainer } from "./styled";
import { ModalProps } from "./interface";
import { Panel } from "../../molecules/Panel";

const ANIMATION_DURATION = 300;

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
  unmountOnHide = true,
  onOpening,
  onClosing,
  onOpened,
  onClosed,
}) => {
  const [isMounted, setIsMounted] = useState(show);
  const [isVisible, setIsVisible] = useState(show);
  const prevShow = useRef(show);

  useEffect(() => {
    // Opening transition
    if (show && !prevShow.current) {
      if (!isMounted) setIsMounted(true); // ensure DOM is mounted
      requestAnimationFrame(() => setIsVisible(true));
      onOpening?.();

      const timer = setTimeout(() => {
        onOpened?.();
      }, ANIMATION_DURATION);

      prevShow.current = show;
      return () => clearTimeout(timer);
    }

    // Closing transition
    if (!show && prevShow.current) {
      setIsVisible(false);
      onClosing?.();

      const timer = setTimeout(() => {
        if (unmountOnHide) setIsMounted(false);
        onClosed?.();
      }, ANIMATION_DURATION);

      prevShow.current = show;
      return () => clearTimeout(timer);
    }
  }, [show]);

  // Escape key support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeable) {
        onClose?.();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeable, onClose]);

  const handleOverlayClick = () => {
    if (closeable) onClose?.();
  };

  if (!isMounted) return null;

  return ReactDOM.createPortal(
    <ModalOverlay
      data-testid="modal-overlay"
      $zIndex={zIndex}
      $show={isVisible}
      onClick={handleOverlayClick}
      $closeable={closeable}
    >
      <ModalContainer
        data-testid="modal-container"
        $modalWidth={modalWidth}
        $show={isVisible}
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
                  ...(onClose ? [{ icon: "clear", onClick: onClose }] : []),
                ]
              : rightIcons
          }
          disabled={disabled}
        >
          <div className="modal-content">{children}</div>
        </Panel>
      </ModalContainer>
    </ModalOverlay>,
    document.body,
  );
};
