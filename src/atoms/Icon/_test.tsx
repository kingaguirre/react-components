// src/atoms/Icon/_test.tsx
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Icon } from "./index";

describe("Icon Component", () => {
  test("renders an icon with the correct class", () => {
    render(<Icon icon="home" />);
    expect(screen.getByRole("img")).toHaveClass("icon-home");
  });

  test("inherits font size when size prop is not provided", () => {
    render(<Icon icon="user" />);
    expect(screen.getByRole("img")).toHaveStyle("font-size: inherit");
  });

  test("applies font size when size prop is provided", () => {
    render(<Icon icon="user" size="32px" />);
    expect(screen.getByRole("img")).toHaveStyle("font-size: 32px");
  });

  test("inherits color when color prop is not provided", () => {
    render(<Icon icon="settings" />);
    expect(screen.getByRole("img")).toHaveStyle("color: inherit");
  });

  test("applies color when color prop is provided", () => {
    render(<Icon icon="search" color="blue" />);
    expect(screen.getByRole("img")).toHaveStyle("color: blue");
  });

  test("applies disabled styles when disabled", () => {
    render(<Icon icon="search" disabled />);
    expect(screen.getByRole("img")).toHaveStyle("opacity: 0.5");
    expect(screen.getByRole("img")).toHaveStyle("pointer-events: none");
  });
});
