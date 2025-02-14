// src/components/Modal/Modal.test.tsx
import {
  render,
  screen,
  fireEvent,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Modal from "./index";
import ReactDOM from "react-dom";

// Override createPortal so that the portal content is rendered inline.
vi.spyOn(ReactDOM, "createPortal").mockImplementation((node) => node as React.ReactPortal);

beforeEach(() => {
  // Use fake timers so we can control the 300ms closing delay.
  vi.useFakeTimers();
  document.body.style.overflow = "";
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

  it("does not render modal when show is false", () => {
    const { container } = render(
      <Modal show={false} onClose={vi.fn()} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    expect(container.firstChild).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("calls onClose when overlay is clicked and modal is closeable", () => {
    const onClose = vi.fn();
    render(
      <Modal show={true} onClose={onClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    const overlay = screen.getByTestId("modal-overlay");
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it("does not call onClose when clicking inside modal container", () => {
    const onClose = vi.fn();
    render(
      <Modal show={true} onClose={onClose} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    const containerEl = screen.getByTestId("modal-container");
    fireEvent.click(containerEl);
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
});
