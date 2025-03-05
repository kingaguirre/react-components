// src/atoms/Tooltip/_test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Tooltip } from "./index";
import { theme } from "../../styles/theme";
import { Button } from "../Button";

describe("Tooltip Component", () => {
  test("renders child element correctly", () => {
    const { container } = render(
      <Tooltip content="Test Tooltip">
        <Button>Hover me</Button>
      </Tooltip>
    );
    const button = container.querySelector(".button");
    expect(button).toBeInTheDocument();
  });

  test("shows tooltip on hover", async () => {
    const { container } = render(
      <Tooltip content="Test Tooltip">
        <Button>Hover me</Button>
      </Tooltip>
    );

    const button = container.querySelector(".button");
    // Tooltip should not be in the document initially
    expect(screen.queryByText("Test Tooltip")).not.toBeInTheDocument();

    // Hover over the button using the class selector
    fireEvent.mouseEnter(button!);

    // Wait for the tooltip to become visible, allowing for the delay (e.g., 300ms)
    await waitFor(() => {
      expect(screen.getByText("Test Tooltip")).toBeVisible();
    },{ timeout: 1000 });
  });

  test("hides tooltip on mouse leave", async () => {
    const { container } = render(
      <Tooltip content="Test Tooltip">
        <Button>Hover me</Button>
      </Tooltip>
    );

    const button = container.querySelector(".button");
    // Hover over the button
    fireEvent.mouseEnter(button!);
    await waitFor(() => {
      expect(screen.getByText("Test Tooltip")).toBeVisible();
    },{ timeout: 1000 });

    const tooltip = await screen.findByText("Test Tooltip");

    // Move the mouse away
    fireEvent.mouseLeave(button!);

    // Wait for the tooltip to hide (may need a timeout if there's a hide delay)
    await waitFor(
      () => {
        expect(tooltip).not.toBeVisible();
      },
      { timeout: 1000 }
    );
  });

  test("renders tooltip with correct color", async () => {
    const { container } = render(
      <Tooltip content="Colored Tooltip" color="danger">
        <Button>Hover me</Button>
      </Tooltip>
    );
  
    const button = container.querySelector(".button");
    fireEvent.mouseEnter(button!);
  
    await waitFor(() => {
      expect(screen.getByText("Colored Tooltip")).toBeVisible();
    },{ timeout: 1000 });
  
    const tooltipText = screen.getByText("Colored Tooltip");
    // Instead of searching for a Tippy-specific class,
    // we verify the inline style on the tooltip container.
    const tooltipContainer = tooltipText;
    expect(tooltipContainer).toHaveStyle(
      `background-color: ${theme.colors.danger.base}`
    );
  });

  test("tooltip appears on click when trigger is 'click'", async () => {
    const { container } = render(
      <Tooltip content="Click Tooltip" trigger="click">
        <Button>Click me</Button>
      </Tooltip>
    );
  
    const button = container.querySelector(".button");
  
    // Tooltip should not be present initially
    expect(screen.queryByText("Click Tooltip")).not.toBeInTheDocument();
  
    // Click the button using the class selector
    fireEvent.click(button!);
  
    // Wait for the tooltip to become visible
    await waitFor(
      () => {
        expect(screen.getByText("Click Tooltip")).toBeVisible();
      },
      { timeout: 1000 }
    );
  });
});
