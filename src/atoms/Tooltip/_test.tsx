// src/atoms/Tooltip/Tooltip.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Tooltip from "./index";
import { theme } from "../../styles/theme";
import { Button } from "@atoms/Button";

describe("Tooltip Component", () => {
  test("renders child element correctly", () => {
    render(
      <Tooltip content="Test Tooltip">
        <Button>Hover me</Button>
      </Tooltip>
    );

    expect(screen.getByRole("button", { name: "Hover me" })).toBeInTheDocument();
  });

  test("shows tooltip on hover", async () => {
    render(
      <Tooltip content="Test Tooltip">
        <Button>Hover me</Button>
      </Tooltip>
    );

    const button = screen.getByRole("button", { name: "Hover me" });

    // Tooltip should not be in the document initially
    expect(screen.queryByText("Test Tooltip")).not.toBeInTheDocument();

    // Hover over the button
    fireEvent.mouseEnter(button);

    // Tooltip should appear
    expect(await screen.findByText("Test Tooltip")).toBeVisible();
  });

  test("hides tooltip on mouse leave", async () => {
    render(
      <Tooltip content="Test Tooltip">
        <Button>Hover me</Button>
      </Tooltip>
    );

    const button = screen.getByRole("button", { name: "Hover me" });

    // Hover over the button
    fireEvent.mouseEnter(button);
    const tooltip = await screen.findByText("Test Tooltip");
    expect(tooltip).toBeVisible();

    // Move the mouse away
    fireEvent.mouseLeave(button);

    // Wait for Tippy to hide the tooltip
    await waitFor(() => {
      expect(tooltip).not.toBeVisible();
    }, { timeout: 500 });
  });

  test("renders tooltip with correct color", async () => {
    render(
      <Tooltip content="Colored Tooltip" color="danger">
        <Button>Hover me</Button>
      </Tooltip>
    );
  
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Hover me" }));
  
    const tooltip = await screen.findByText("Colored Tooltip");
    expect(tooltip).toBeVisible();
  
    // Ensure tooltip background is set (onMount styling)
    const tooltipBox = tooltip.closest(".tippy-box");
    expect(tooltipBox).toHaveStyle(
      `background-color: ${theme.colors.danger.base}`
    );
  });

  test("tooltip appears on click when trigger is 'click'", async () => {
    render(
      <Tooltip content="Click Tooltip" trigger="click">
        <Button>Click me</Button>
      </Tooltip>
    );

    const button = screen.getByRole("button", { name: "Click me" });

    // Tooltip should not be present initially
    expect(screen.queryByText("Click Tooltip")).not.toBeInTheDocument();

    // Click on button
    fireEvent.click(button);

    // Tooltip should now be visible
    expect(await screen.findByText("Click Tooltip")).toBeVisible();
  });
});
