import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import Button from "./index";
import { ButtonProps } from "./interface";

describe("Button Component", () => {
  const setup = (props?: Partial<ButtonProps>) => {
    render(<Button {...props}>Click Me</Button>);
  };

  test("renders button with children", () => {
    setup();
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });

  test("applies color prop correctly", () => {
    setup({ color: "primary" });
    expect(screen.getByRole("button")).toHaveAttribute("data-color", "primary");
  });

  test("applies variant prop correctly", () => {
    setup({ variant: "outlined" });
    expect(screen.getByRole("button")).toHaveAttribute("data-variant", "outlined");
  });

  test("applies size prop correctly", () => {
    setup({ size: "lg" });
    expect(screen.getByRole("button")).toHaveAttribute("data-size", "lg");
  });

  test("applies rounded prop correctly", () => {
    setup({ rounded: true });
    expect(screen.getByRole("button")).toHaveAttribute("data-rounded", "true");
  });

  test("applies fullWidth prop correctly", () => {
    setup({ fullWidth: true });
    expect(screen.getByRole("button")).toHaveAttribute("data-fullwidth", "true");
  });

  test("applies disabled prop correctly", () => {
    setup({ disabled: true });
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveClass("disabled");
  });

  test("applies active class when active prop is true", () => {
    setup({ active: true });
    expect(screen.getByRole("button")).toHaveClass("active");
  });

  test("triggers onClick event when clicked", () => {
    const handleClick = vi.fn();
    setup({ onClick: handleClick });
    fireEvent.click(screen.getByText("Click Me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
