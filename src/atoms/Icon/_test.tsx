import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Icon } from "./index";

describe("Icon Component", () => {
  test("renders an icon with the correct class", () => {
    render(<Icon icon="home" />);
    expect(screen.getByTestId("icon")).toHaveClass("icon-home");
  });

  test("inherits font size when size prop is not provided", () => {
    render(<Icon icon="user" />);
    expect(screen.getByTestId("icon")).toHaveStyle("font-size: inherit");
  });

  test("applies font size when size prop is provided", () => {
    render(<Icon icon="user" size="32px" />);
    expect(screen.getByTestId("icon")).toHaveStyle("font-size: 32px");
  });

  test("inherits color when color prop is not provided", () => {
    render(<Icon icon="settings" />);
    expect(screen.getByTestId("icon")).toHaveStyle("color: inherit");
  });

  test("applies disabled styles when disabled", () => {
    render(<Icon icon="search" disabled />);
    expect(screen.getByTestId("icon")).toHaveStyle("opacity: 0.5");
    expect(screen.getByTestId("icon")).toHaveStyle("pointer-events: none");
  });
});