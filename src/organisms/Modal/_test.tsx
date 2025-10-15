// src/organisms/Modal/_test.tsx
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react-dom/test-utils";
import ReactDOM from "react-dom";
import { Modal } from "./index";

/**
 * IMPORTANT:
 *  - We DO NOT mock createPortal to "inline" children.
 *    Instead, we force it back to the REAL implementation in case some other test mocked it.
 *  - We DO NOT manually clear document.body.innerHTML — RTL's cleanup() handles unmounting portals.
 */

// Keep a handle to the real createPortal.
const realCreatePortal = ReactDOM.createPortal;

// rAF <-> timers shim (Modal uses double-RAF for open animation)
let originalRAF: typeof window.requestAnimationFrame;
let originalCAF: typeof window.cancelAnimationFrame;

const flushOpenCloseAnimations = (ms = 350) => {
  // drive the two nested RAFs
  act(() => {
    vi.advanceTimersByTime(0);
    vi.advanceTimersByTime(0);
  });
  // drive the 300ms animation timeout (+ buffer)
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

beforeEach(() => {
  // Make sure no stale spies/mocks leak in from other specs.
  vi.restoreAllMocks();

  vi.useFakeTimers();

  // Force ReactDOM.createPortal back to the real implementation.
  vi.spyOn(ReactDOM, "createPortal").mockImplementation(
    ((...args: Parameters<typeof realCreatePortal>) =>
      realCreatePortal(...args)) as any
  );

  // rAF -> setTimeout(0) so fake timers can advance it deterministically.
  originalRAF = window.requestAnimationFrame;
  originalCAF = window.cancelAnimationFrame;
  (window as any).requestAnimationFrame = (cb: FrameRequestCallback) =>
    window.setTimeout(() => cb(Date.now()), 0) as unknown as number;
  (window as any).cancelAnimationFrame = (id: number) =>
    window.clearTimeout(id as unknown as number);

  // reset body styles that your Modal toggles
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
});

afterEach(() => {
  // Unmount everything (this cleanly removes the portal from document.body)
  cleanup();

  // Run any remaining timers (e.g., click-shield removal), then restore.
  act(() => {
    vi.runOnlyPendingTimers();
  });
  vi.useRealTimers();

  // Restore rAF
  window.requestAnimationFrame = originalRAF;
  window.cancelAnimationFrame = originalCAF;
});

describe("Modal Component", () => {
  it("renders modal when show is true", () => {
    render(
      <Modal show={true} onClose={vi.fn()} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );

    const overlay = screen.getByTestId("modal-overlay");
    const container = screen.getByTestId("modal-container");

    expect(overlay).toBeInTheDocument();
    expect(container).toBeInTheDocument();
    expect(screen.getByText("Modal Content")).toBeInTheDocument();

    // Initial phase is 'entered' when show=true at mount
    expect(overlay).toHaveAttribute("data-state", "entered");
    expect(container).toHaveAttribute("data-state", "entered");
  });

  it("does not render when show=false and unmountOnHide=true", () => {
    const { container } = render(
      <Modal show={false} onClose={vi.fn()} title="Test Modal" unmountOnHide>
        <div>Modal Content</div>
      </Modal>
    );
    expect(container.firstChild).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("keeps modal in DOM when unmountOnHide=false", () => {
    const { rerender } = render(
      <Modal show={true} onClose={vi.fn()} title="Test Modal" unmountOnHide={false}>
        <div>Keep in DOM</div>
      </Modal>
    );

    expect(screen.getByTestId("modal-overlay")).toBeInTheDocument();

    // Close it
    rerender(
      <Modal show={false} onClose={vi.fn()} title="Test Modal" unmountOnHide={false}>
        <div>Keep in DOM</div>
      </Modal>
    );

    // Finish exit animation (exiting -> exited)
    flushOpenCloseAnimations();

    // Still present (just hidden) because unmountOnHide=false
    expect(screen.getByTestId("modal-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("modal-overlay")).toHaveAttribute("data-state", "exited");
  });

  it("calls onClose when overlay is pressed and modal is closeable", () => {
    const onClose = vi.fn();
    render(
      <Modal show={true} onClose={onClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );

    const overlay = screen.getByTestId("modal-overlay");
    // Your component requires both down+up on the overlay itself
    fireEvent.mouseDown(overlay, { bubbles: true });
    fireEvent.mouseUp(overlay, { bubbles: true });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when closeable=false", () => {
    const onClose = vi.fn();
    render(
      <Modal show={true} onClose={onClose} title="Test Modal" closeable={false}>
        <div>Modal Content</div>
      </Modal>
    );

    const overlay = screen.getByTestId("modal-overlay");
    fireEvent.mouseDown(overlay, { bubbles: true });
    fireEvent.mouseUp(overlay, { bubbles: true });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not call onClose when clicking inside the container", () => {
    const onClose = vi.fn();
    render(
      <Modal show={true} onClose={onClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );

    const container = screen.getByTestId("modal-container");
    fireEvent.mouseDown(container, { bubbles: true });
    fireEvent.mouseUp(container, { bubbles: true });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on Escape if closeable", () => {
    const onClose = vi.fn();
    render(
      <Modal show={true} onClose={onClose} title="Test Modal">
        <div>Escape Close</div>
      </Modal>
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close on Escape if closeable=false", () => {
    const onClose = vi.fn();
    render(
      <Modal show={true} onClose={onClose} title="Test Modal" closeable={false}>
        <div>No Escape</div>
      </Modal>
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders children", () => {
    render(
      <Modal show={true} onClose={vi.fn()} title="Test Modal">
        <div>Custom Modal Content</div>
      </Modal>
    );
    expect(screen.getByText("Custom Modal Content")).toBeInTheDocument();
  });

  it("fires lifecycle callbacks in order", () => {
    const onOpening = vi.fn();
    const onOpened = vi.fn();
    const onClosing = vi.fn();
    const onClosed = vi.fn();

    const { rerender } = render(
      <Modal
        show={false}
        onClose={vi.fn()}
        title="Lifecycle Modal"
        onOpening={onOpening}
        onOpened={onOpened}
        onClosing={onClosing}
        onClosed={onClosed}
      >
        <div>Lifecycle Test</div>
      </Modal>
    );

    // Open (double RAF -> entering -> entered)
    rerender(
      <Modal
        show={true}
        onClose={vi.fn()}
        title="Lifecycle Modal"
        onOpening={onOpening}
        onOpened={onOpened}
        onClosing={onClosing}
        onClosed={onClosed}
      >
        <div>Lifecycle Test</div>
      </Modal>
    );

    expect(onOpening).toHaveBeenCalledTimes(1);
    flushOpenCloseAnimations();
    expect(onOpened).toHaveBeenCalledTimes(1);

    // Close (exiting -> exited)
    rerender(
      <Modal
        show={false}
        onClose={vi.fn()}
        title="Lifecycle Modal"
        onOpening={onOpening}
        onOpened={onOpened}
        onClosing={onClosing}
        onClosed={onClosed}
      >
        <div>Lifecycle Test</div>
      </Modal>
    );

    expect(onClosing).toHaveBeenCalledTimes(1);
    flushOpenCloseAnimations();
    expect(onClosed).toHaveBeenCalledTimes(1);
  });

  it("enables vertical scrolling on the overlay when content is long", () => {
    render(
      <Modal show={true} onClose={vi.fn()} title="Long Content">
        {/* Force very tall content inside the ModalContainer */}
        <div style={{ height: "2000px" }} data-testid="tall-content">
          Tall Content
        </div>
      </Modal>
    );

    const overlay = screen.getByTestId("modal-overlay") as HTMLDivElement;

    // Assert CSS from styled-components is applied:
    const styles = window.getComputedStyle(overlay);
    // Base overflow is hidden; vertical is explicitly scroll
    expect(styles.overflowY).toBe("scroll");

    // Light sanity check that the node can track scrollTop (JSDOM behavior)
    // and that the property mutates — indicative of scrollability.
    // (JSDOM doesn't do real layout; we stub dimensions to mimic overflow)
    try {
      Object.defineProperty(overlay, "clientHeight", {
        configurable: true,
        value: 500,
      });
      Object.defineProperty(overlay, "scrollHeight", {
        configurable: true,
        value: 2000,
      });
    } catch {
      // If the environment doesn't allow redefining, it's fine;
      // the CSS assertions above are the critical check.
    }
    overlay.scrollTop = 123;
    expect(overlay.scrollTop).toBe(123);
  });

    it("focuses the element passed via initialFocusRef on open (not the container)", () => {
    const onClose = vi.fn();
    const confirmRef = React.createRef<HTMLButtonElement>();

    // Ensure something outside had focus before open
    const trigger = document.createElement("button");
    trigger.textContent = "Trigger";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    render(
      <Modal show={true} onClose={onClose} title="Initial Focus" initialFocusRef={confirmRef}>
        <button ref={confirmRef} data-testid="confirm-btn">Confirm</button>
      </Modal>
    );

    // Drive double-RAF + timers so open path runs
    flushOpenCloseAnimations();

    const container = screen.getByTestId("modal-container");
    const confirmBtn = screen.getByTestId("confirm-btn");

    // The provided initialFocusRef should receive focus (not the container)
    expect(document.activeElement).toBe(confirmBtn);
    expect(document.activeElement).not.toBe(container);

    // Clean up trigger
    document.body.removeChild(trigger);
  });

  it("restores focus to the previously focused trigger on overlay-close", () => {
    const onClose = vi.fn();

    // Set up an external trigger and focus it before opening
    const trigger = document.createElement("button");
    trigger.textContent = "Open Modal Trigger";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    render(
      <Modal show={true} onClose={onClose} title="Restore Focus">
        <div>Content</div>
      </Modal>
    );

    // Let the open RAFs run (and any focus inside modal)
    flushOpenCloseAnimations();

    const overlay = screen.getByTestId("modal-overlay");
    fireEvent.mouseDown(overlay, { bubbles: true });
    fireEvent.mouseUp(overlay, { bubbles: true });

    // onClose called and focus restored immediately by Modal
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(trigger);

    document.body.removeChild(trigger);
  });

  it("restores focus to the trigger on Escape BEFORE closing", () => {
    const onClose = vi.fn();

    const trigger = document.createElement("button");
    trigger.textContent = "Esc Trigger";
    document.body.appendChild(trigger);
    trigger.focus();

    render(
      <Modal show={true} onClose={onClose} title="Esc Close">
        <div>Esc Content</div>
      </Modal>
    );

    // No need to finish animations; Escape handler restores focus synchronously
    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(trigger);

    document.body.removeChild(trigger);
  });

  it("applies correct semantics and does not set aria-hidden on the overlay", () => {
    render(
      <Modal show={true} onClose={vi.fn()} title="Semantics">
        <div>Semantic Content</div>
      </Modal>
    );

    const overlay = screen.getByTestId("modal-overlay");
    const container = screen.getByTestId("modal-container");

    // Overlay is a backdrop, not the dialog
    expect(overlay).toHaveAttribute("role", "presentation");
    // No aria-hidden on the overlay anymore
    expect(overlay).not.toHaveAttribute("aria-hidden");

    // Dialog semantics must be on the focusable container
    expect(container).toHaveAttribute("role", "dialog");
    expect(container).toHaveAttribute("aria-modal", "true");
  });

});
