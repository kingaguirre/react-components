// src/components/Panel/_test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Panel from "./index";

describe("Panel Component", () => {
  test("renders panel title and content", () => {
    render(<Panel title="Test Panel" color="primary">Panel Content</Panel>);
    expect(screen.getByText("Test Panel")).toBeInTheDocument();
    expect(screen.getByText("Panel Content")).toBeInTheDocument();
  });

  test("renders left icon and right icons", () => {
    render(
      <Panel
        title="Icons Test"
        leftIcon={{ icon: "home" }}
        rightIcons={[{ icon: "settings" }, { icon: "bell" }]}
      >
        Content
      </Panel>
    );
    expect(screen.getAllByRole("img")).toHaveLength(3); // 1 left + 2 right icons
  });

  test("calls onClick for left icon", () => {
    const handleClick = jest.fn();
    render(<Panel title="Left Icon" leftIcon={{ icon: "home", onClick: handleClick }}>Content</Panel>);
    fireEvent.click(screen.getByText("Test Panel").parentElement!.querySelector(".icon-home")!);
    expect(handleClick).toHaveBeenCalled();
  });

  test("disables interactions when disabled", () => {
    const handleClick = jest.fn();
    render(
      <Panel
        title="Disabled Test"
        disabled
        leftIcon={{ icon: "home", onClick: handleClick }}
        rightIcons={[{ icon: "settings", onClick: handleClick }]}
      >
        Content
      </Panel>
    );
    fireEvent.click(screen.queryByRole("img")!);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
