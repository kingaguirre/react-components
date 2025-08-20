// src/molecules/Alert/index.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import {
  AlertWrapper,
  Title,
  Content,
  IconWrapper,
  CloseButton,
  ToastContainer,
} from "./styled";
import { AlertProps } from "./interface";
import { Icon } from "../../atoms/Icon";

const ANIMATION_DURATION = 300;

export const Alert: React.FC<AlertProps> = ({
  color = "primary",
  show = true,
  icon,
  title,
  children,
  toast = false,
  closeDelay = 3000,
  closeable = false,
  closeIcon = true, // Controls visibility of the clear icon
  placement = "top-right",
  animation = "grow",
  onClose,
  onKeyDownCapture
}) => {
  const exitTimerRef = useRef<number | null>(null);

  // Controlled vs uncontrolled
  const isControlled = onClose !== undefined;

  // Render/animation state
  const [internalShow, setInternalShow] = useState(show);
  const [isExiting, setIsExiting] = useState(false);

  // Sync with parent in controlled mode
  useEffect(() => {
    if (!isControlled) return;

    if (show) {
      setInternalShow(true);
      setIsExiting(false);
    } else if (internalShow && !isExiting) {
      setIsExiting(true);
      exitTimerRef.current = window.setTimeout(() => {
        setInternalShow(false);
        exitTimerRef.current = null;
      }, ANIMATION_DURATION);
    }
  }, [show, internalShow, isControlled, isExiting]);

  // Cleanup exit timer
  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  // Auto-close timer for toast mode (when not closeable)
  const timerRef = useRef<number | null>(null);
  const timerStartRef = useRef<number>(0);
  const timerRemainingRef = useRef<number>(closeDelay);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = useCallback((delay: number) => {
    timerStartRef.current = Date.now();
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      handleClose();
    }, delay);
  }, []);

  useEffect(() => {
    if (toast && show && !closeable && !timerRef.current) {
      timerRemainingRef.current = closeDelay;
      startTimer(closeDelay);
    }
    return () => {
      clearTimer();
    };
  }, [toast, show, closeable, startTimer, closeDelay]);

  const handleMouseEnter = () => {
    if (toast && !closeable && timerRef.current) {
      const elapsed = Date.now() - timerStartRef.current;
      timerRemainingRef.current = Math.max(closeDelay - elapsed, 0);
      clearTimer();
    }
  };

  const handleMouseLeave = () => {
    if (
      toast &&
      !closeable &&
      timerRemainingRef.current > 0 &&
      !timerRef.current
    ) {
      startTimer(timerRemainingRef.current);
    }
  };

  const handleClose = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      setInternalShow(false);
    }, ANIMATION_DURATION);
    if (onClose) onClose();
  }, [isExiting, onClose]);

  // === NEW: Close when clicking anywhere outside the ToastContainer (replaces ToastOverlay) ===
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Only enable outside-click close in the same scenario the overlay used to appear:
    // toast && !closeable && internalShow
    if (!(toast && !closeable && internalShow)) return;

    const onDocPointerDown = (e: Event) => {
      const el = containerRef.current;
      const target = e.target as Node | null;
      if (!el || !target) return;

      // If the click is inside the toast container, ignore it.
      if (el === target || el.contains(target)) return;

      handleClose();
    };

    // Capture phase so we get the event even if something stops propagation later
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onDocPointerDown, true);
    };
  }, [toast, closeable, internalShow, handleClose]);

  if (!internalShow) return null;

  const alertContent = (
    <AlertWrapper
      $color={color}
      $animation={toast ? animation : "fade"}
      className={isExiting ? "closing" : ""}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDownCapture={onKeyDownCapture}
    >
      {icon && (
        <IconWrapper $color={color}>
          <Icon icon={icon} />
        </IconWrapper>
      )}
      <div style={{ flex: 1 }}>
        {title && <Title $color={color}>{title}</Title>}
        <Content>{children}</Content>
      </div>
      {closeIcon && (
        <CloseButton
          data-testid="alert-close-icon"
          onClick={handleClose}
          aria-label="Close Alert"
        >
          <Icon icon="clear" />
        </CloseButton>
      )}
    </AlertWrapper>
  );

  if (toast) {
    return ReactDOM.createPortal(
      // No overlay; we attach the ref to the container to detect outside clicks.
      <ToastContainer ref={containerRef} $placement={placement}>
        {alertContent}
      </ToastContainer>,
      document.body,
    );
  }

  return alertContent;
};
