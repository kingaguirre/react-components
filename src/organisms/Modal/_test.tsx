// src/components/Modal/Modal.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Modal } from "./index";
import ReactDOM from "react-dom";

// Override createPortal so the portal content renders inline.
vi.spyOn(ReactDOM, "createPortal").mockImplementation((node) => node as React.ReactPortal);

beforeEach(() => {
  vi.useFakeTimers(); // control animation timers
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("Modal Component", () => {
  it("renders modal when show is true", () => {
    render(
      <Modal show={true} onClose={vi.fn()} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    expect(screen.getByTestId("modal-overlay")).toBeVisible();
    expect(screen.getByTestId("modal-container")).toBeVisible();
    expect(screen.getByText("Modal Content")).toBeInTheDocument();
  });

  it("does not render modal when show is false and unmountOnHide is true", () => {
    const { container } = render(
      <Modal show={false} onClose={vi.fn()} title="Test Modal" unmountOnHide>
        <div>Modal Content</div>
      </Modal>
    );
    expect(container.firstChild).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("keeps modal in DOM when unmountOnHide is false", () => {
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

    vi.advanceTimersByTime(300);

    // Modal still in DOM because unmountOnHide=false
    expect(screen.getByTestId("modal-overlay")).toBeInTheDocument();
  });


  it("calls onClose when overlay is clicked and modal is closeable", () => {
    const onClose = vi.fn();
    render(
      <Modal show={true} onClose={onClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    fireEvent.click(screen.getByTestId("modal-overlay"));
    expect(onClose).toHaveBeenCalled();
  });

  it("does not call onClose when closeable is false", () => {
    const onClose = vi.fn();
    render(
      <Modal show={true} onClose={onClose} title="Test Modal" closeable={false}>
        <div>Modal Content</div>
      </Modal>
    );
    fireEvent.click(screen.getByTestId("modal-overlay"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not call onClose when clicking inside modal container", () => {
    const onClose = vi.fn();
    render(
      <Modal show={true} onClose={onClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    fireEvent.click(screen.getByTestId("modal-container"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes when Escape key is pressed if closeable", () => {
    const onClose = vi.fn();
    render(
      <Modal show={true} onClose={onClose} title="Test Modal">
        <div>Escape Close</div>
      </Modal>
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("does not close on Escape if closeable is false", () => {
    const onClose = vi.fn();
    render(
      <Modal show={true} onClose={onClose} title="Test Modal" closeable={false}>
        <div>No Escape</div>
      </Modal>
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders children content correctly", () => {
    render(
      <Modal show={true} onClose={vi.fn()} title="Test Modal">
        <div>Custom Modal Content</div>
      </Modal>
    );
    expect(screen.getByText("Custom Modal Content")).toBeInTheDocument();
  });

  it("triggers lifecycle callbacks in correct order when opening and closing", () => {
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

    // Open modal
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
    vi.advanceTimersByTime(300);
    expect(onOpened).toHaveBeenCalledTimes(1);

    // Close modal
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
    vi.advanceTimersByTime(300);
    expect(onClosed).toHaveBeenCalledTimes(1);
  });
});
