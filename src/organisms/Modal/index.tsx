// src/components/Modal/index.tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { ModalOverlay, ModalContainer } from "./styled";
import { ModalProps } from "./interface";
import { Panel } from "../../molecules/Panel";

type Phase = "exited" | "entering" | "entered" | "exiting";
const ANIMATION_DURATION = 300;
const SHIELD_FUDGE_MS = 80;

export const Modal: React.FC<ModalProps> = (props) => {
  const {
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
  } = props;

  const [phase, setPhase] = useState<Phase>(show ? "entered" : "exited");
  const [mounted, setMounted] = useState<boolean>(show || !unmountOnHide);
  const visible = phase === "entering" || phase === "entered";

  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  const timers = useRef<number[]>([]);
  const rafs = useRef<number[]>([]);
  const shieldRemoveRef = useRef<(() => void) | null>(null);

  const clearAsync = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    rafs.current.forEach((r) => window.cancelAnimationFrame(r));
    rafs.current = [];
    if (shieldRemoveRef.current) {
      shieldRemoveRef.current();
      shieldRemoveRef.current = null;
    }
  };

  const installClickShield = (ms = ANIMATION_DURATION + SHIELD_FUDGE_MS) => {
    if (shieldRemoveRef.current) return;
    const handler = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
    };
    document.addEventListener("click", handler, true);
    document.addEventListener("mousedown", handler, true);
    document.addEventListener("mouseup", handler, true);
    const t = window.setTimeout(remove, ms);
    function remove() {
      document.removeEventListener("click", handler, true);
      document.removeEventListener("mousedown", handler, true);
      document.removeEventListener("mouseup", handler, true);
      window.clearTimeout(t);
      shieldRemoveRef.current = null;
    }
    shieldRemoveRef.current = remove;
  };

  useEffect(() => {
    if (!unmountOnHide) setMounted(true);
    else if (!show && phase === "exited") setMounted(false);
  }, [unmountOnHide, show, phase]);

  // Lock body scroll only while visible
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  const restorePrevFocus = () => {
    if (
      prevFocusRef.current &&
      typeof prevFocusRef.current.focus === "function"
    ) {
      prevFocusRef.current.focus();
    } else {
      // last-resort to avoid leaving focus inside a soon-to-be-hidden subtree
      (document.body as any).focus?.();
    }
  };

  // OPEN/CLOSE transitions
  useLayoutEffect(() => {
    clearAsync();

    if (show) {
      if (!mounted) setMounted(true);
      onOpening?.();

      // 1) capture previously focused element BEFORE moving focus
      prevFocusRef.current = document.activeElement as HTMLElement | null;

      rafs.current.push(
        window.requestAnimationFrame(() => {
          const overlay = overlayRef.current;
          const container = containerRef.current;

          if (overlay) {
            if (typeof overlay.scrollTo === "function") overlay.scrollTo(0, 0);
            else overlay.scrollTop = 0;
          }

          // Force layout so transitions start from the hidden state
          void container?.getBoundingClientRect();

          rafs.current.push(
            window.requestAnimationFrame(() => {
              setPhase("entering");

              // 2) Focus ONCE: prefer caller's target, else the container
              const target =
                props.initialFocusRef?.current ?? containerRef.current;
              target?.focus();

              timers.current.push(
                window.setTimeout(() => {
                  setPhase("entered");
                  onOpened?.();
                }, ANIMATION_DURATION + 16),
              );
            }),
          );
        }),
      );
    } else {
      if (mounted) {
        // Move focus OUT before hiding
        restorePrevFocus();
        setPhase("exiting");
        onClosing?.();
        installClickShield();
        timers.current.push(
          window.setTimeout(() => {
            setPhase("exited");
            onClosed?.();
            if (unmountOnHide) setMounted(false);
          }, ANIMATION_DURATION + 16),
        );
      }
    }

    return clearAsync;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // TransitionEnd fallback
  useEffect(() => {
    if (!mounted) return;
    const node = containerRef.current;
    if (!node) return;

    const onEnd = (e: TransitionEvent) => {
      if (e.target !== node) return;
      if (phase === "entering") {
        setPhase("entered");
        onOpened?.();
      } else if (phase === "exiting") {
        setPhase("exited");
        onClosed?.();
        if (unmountOnHide) setMounted(false);
      }
    };

    node.addEventListener("transitionend", onEnd);
    return () => node.removeEventListener("transitionend", onEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, phase, unmountOnHide]);

  // Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeable) {
        installClickShield();
        // move focus out BEFORE requesting close
        restorePrevFocus();
        onClose?.();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeable, onClose]);

  // Overlay press guard
  const downOnOverlayRef = useRef(false);
  const onOverlayMouseDown = (e: React.MouseEvent) => {
    downOnOverlayRef.current = e.target === e.currentTarget;
  };
  const onOverlayMouseUp = (e: React.MouseEvent) => {
    if (!closeable) return;
    if (downOnOverlayRef.current && e.target === e.currentTarget) {
      installClickShield();
      restorePrevFocus(); // move focus out BEFORE request close
      onClose?.();
    }
    downOnOverlayRef.current = false;
  };

  useEffect(() => clearAsync, []);

  if (!mounted) return null;

  const requestClose = () => {
    installClickShield();
    restorePrevFocus(); // move focus out BEFORE request close
    onClose?.();
  };

  return ReactDOM.createPortal(
    <ModalOverlay
      ref={overlayRef}
      role="presentation"
      data-testid="modal-overlay"
      $zIndex={zIndex}
      $show={visible}
      $closeable={closeable}
      $keepMounted={!unmountOnHide}
      style={{ pointerEvents: visible ? "auto" : "none" }}
      onMouseDown={onOverlayMouseDown}
      onMouseUp={onOverlayMouseUp}
      data-state={phase}
    >
      <ModalContainer
        ref={containerRef}
        data-testid="modal-container"
        $modalWidth={modalWidth}
        $show={visible}
        $keepMounted={!unmountOnHide}
        $color={color}
        onClick={(e) => e.stopPropagation()}
        data-state={phase}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <Panel
          isSubHeader={props.isSubHeader}
          title={title}
          color={color}
          leftIcon={leftIcon}
          rightIcons={
            showCloseIcon
              ? [
                  ...(rightIcons || []),
                  ...(onClose
                    ? [{ icon: "clear", onClick: requestClose }]
                    : []),
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
