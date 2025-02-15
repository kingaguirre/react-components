import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import Panel from "./index";

describe("Panel Component", () => {
  test("renders panel with title and children", () => {
    render(<Panel title="Test Panel">This is panel content</Panel>);

    expect(screen.getByText("Test Panel")).toBeInTheDocument();
    expect(screen.getByText("This is panel content")).toBeInTheDocument();
  });

  test("renders left icon when provided", () => {
    render(<Panel title="Panel with Left Icon" leftIcon={{ icon: "menu" }} >Panel with Left Icon</Panel>);

    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  test("renders multiple right icons when provided", () => {
    render(
      <Panel
        title="Panel with Right Icons"
        rightIcons={[{ icon: "settings" }, { icon: "close" }]}
      >Panel with Right Icons</Panel>
    );

    const icons = screen.getAllByTestId("icon");
    expect(icons).toHaveLength(2);
  });

  test("calls left icon click handler when clicked", () => {
    const handleClick = vi.fn();
    render(
      <Panel
        title="Panel with Clickable Left Icon"
        leftIcon={{ icon: "menu", onClick: handleClick }}
      >Panel with Clickable Left Icon</Panel>
    );

    const leftIcon = screen.getByTestId("icon");
    fireEvent.click(leftIcon);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("calls right icon click handlers when clicked", () => {
    const handleSettingsClick = vi.fn();
    const handleCloseClick = vi.fn();

    render(
      <Panel
        title="Panel with Clickable Right Icons"
        rightIcons={[
          { icon: "settings", onClick: handleSettingsClick },
          { icon: "close", onClick: handleCloseClick },
        ]}
      >Panel with Clickable Right Icons</Panel>
    );

    const icons = screen.getAllByTestId("icon");
    fireEvent.click(icons[0]); // Click settings icon
    fireEvent.click(icons[1]); // Click close icon

    expect(handleSettingsClick).toHaveBeenCalledTimes(1);
    expect(handleCloseClick).toHaveBeenCalledTimes(1);
  });

  test("applies correct styles when disabled", () => {
    render(<Panel title="Disabled Panel" disabled>Disabled panel</Panel>);

    const panelElement = screen.getByText("Disabled Panel").closest(".panel");
    expect(panelElement).toHaveClass("panel-disabled");
  });

  test("renders without a header when no title or icons are provided", () => {
    render(<Panel>This is a headless panel</Panel>);

    // Ensure the title is NOT in the document
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByText("This is a headless panel")).toBeInTheDocument();
  });
});
