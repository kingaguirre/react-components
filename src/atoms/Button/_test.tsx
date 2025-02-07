// src/atoms/Button/_test.tsx
import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button } from "./index";

describe("Button Component", () => {
  test("renders button with correct text", () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click Me");
  });

  test("applies color and variant correctly", () => {
    render(<Button color="success" variant="outlined">Success Outlined</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Success Outlined");
    expect(button).toHaveStyle("border: 1px solid");
  });

  test("handles click event", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalled();
  });

  test("disables button correctly", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  test("applies isExpanded correctly", () => {
    render(<Button isExpanded>Full Width</Button>);
    expect(screen.getByRole("button")).toHaveStyle("width: 100%");
  });

  test("applies isRounded correctly", () => {
    render(<Button isRounded>Rounded</Button>);
    expect(screen.getByRole("button")).toHaveStyle("border-radius: 50px");
  });
});
