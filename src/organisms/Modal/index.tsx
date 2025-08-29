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
  const overlayRef = useRef<HTMLDivElement | null>(null); // NEW

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
    return () => { document.body.style.overflow = prev; };
  }, [visible]);

  // OPEN/CLOSE transitions
  useLayoutEffect(() => {
    clearAsync();

    if (show) {
      if (!mounted) setMounted(true);
      onOpening?.();

      // Double RAF + forced reflow + scroll reset:
      //  - ensure DOM is mounted
      //  - reset overlay scrollTop to 0 (fix rare "stuck at bottom")
      //  - force style calc so fade+slide always animates
      rafs.current.push(
        window.requestAnimationFrame(() => {
          // Ensure node is there
          const overlay = overlayRef.current;
          const container = containerRef.current;

          // Reset scroll position to top on every open (fix)
          if (overlay) {
            // JSDOM-safe fallback if scrollTo is not implemented
            if (typeof overlay.scrollTo === "function") overlay.scrollTo(0, 0);
            else overlay.scrollTop = 0;
          }

          // Force reflow so the browser commits initial hidden styles
          void container?.getBoundingClientRect();

          rafs.current.push(
            window.requestAnimationFrame(() => {
              setPhase("entering");
              timers.current.push(
                window.setTimeout(() => {
                  setPhase("entered");
                  onOpened?.();
                }, ANIMATION_DURATION + 16)
              );
            })
          );
        })
      );
    } else {
      if (mounted) {
        setPhase("exiting");
        onClosing?.();
        installClickShield();
        timers.current.push(
          window.setTimeout(() => {
            setPhase("exited");
            onClosed?.();
            if (unmountOnHide) setMounted(false);
          }, ANIMATION_DURATION + 16)
        );
      }
    }

    return clearAsync;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // TransitionEnd (robust if CSS duration changes)
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
      onClose?.();
    }
    downOnOverlayRef.current = false;
  };

  useEffect(() => clearAsync, []);

  if (!mounted) return null;

  const requestClose = () => {
    installClickShield();
    onClose?.();
  };

  return ReactDOM.createPortal(
    <ModalOverlay
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      data-testid="modal-overlay"
      $zIndex={zIndex}
      $show={visible}
      $closeable={closeable}
      $keepMounted={!unmountOnHide}
      aria-hidden={!visible}
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
        onClick={(e) => e.stopPropagation()}
        data-state={phase}
        tabIndex={-1}
      >
        <Panel
          title={title}
          color={color}
          leftIcon={leftIcon}
          rightIcons={
            showCloseIcon
              ? [
                  ...(rightIcons || []),
                  ...(onClose ? [{ icon: "clear", onClick: requestClose }] : []),
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
