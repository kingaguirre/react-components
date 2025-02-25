// src/atoms/Badge/_test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Badge } from "./index";

describe("Badge Component", () => {
  test("renders badge with text", () => {
    render(<Badge>Test</Badge>);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  test("applies correct color class", () => {
    render(<Badge color="success">Success</Badge>);
    expect(screen.getByText("Success")).toHaveClass("badge");
  });

  test("applies correct size styles", () => {
    render(<Badge size="lg">Large</Badge>);
    expect(screen.getByText("Large")).toHaveStyle("min-width: 24px");
  });

  test("applies border-radius correctly", () => {
    render(<Badge borderRadius="8px">Rounded</Badge>);
    expect(screen.getByText("Rounded")).toHaveStyle("border-radius: 8px");
  });

  test("disables badge when disabled prop is true", () => {
    render(<Badge disabled>Disabled</Badge>);
    expect(screen.getByText("Disabled")).toHaveStyle("opacity: 0.5");
  });

  test("applies custom width correctly", () => {
    render(<Badge width="100px">Wide Badge</Badge>);
    expect(screen.getByText("Wide Badge")).toHaveStyle("width: 100px");
  });
});
