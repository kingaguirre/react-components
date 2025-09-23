import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { Panel } from "./index";

describe("Panel Component (extended)", () => {
  test("renders sub header with tighter spacing and left border", () => {
    render(
      <Panel title="Sub Header" color="primary" isSubHeader>
        Content
      </Panel>
    );

    const headerEl = screen.getByText("Sub Header").closest(".panel")!.querySelector(".panel-header") as HTMLElement;
    expect(headerEl).toBeInTheDocument();

    const cs = getComputedStyle(headerEl);
    // spacing
    expect(cs.paddingTop).toBe("8px");
    expect(cs.paddingBottom).toBe("8px");
    expect(cs.paddingLeft).toBe("12px");
    expect(cs.paddingRight).toBe("12px");
    // height
    expect(cs.height).toBe("28px");
    // border-left (we only check width to avoid color coupling)
    expect(cs.borderLeftWidth).toBe("2px");
    expect(cs.borderLeftStyle).toBe("solid");
  });

  test("icons in header inherit the exact header text color", () => {
    render(
      <Panel
        title="Icons Color Inherit"
        color="info"
        leftIcon={{ icon: "menu" }}
        rightIcons={[{ icon: "settings" }]}
      >
        Content
      </Panel>
    );

    const panel = screen.getByText("Icons Color Inherit").closest(".panel")!;
    const headerEl = panel.querySelector(".panel-header") as HTMLElement;

    const parseVar = (val: string) => {
      // matches var(--token, fallback)
      const m = val.match(/^var\(\s*(--[A-Za-z0-9\-_]+)\s*(?:,\s*([^)]+)\s*)?\)$/);
      if (!m) return null;
      return { name: m[1], fallback: m[2]?.trim() ?? "" };
    };

    const resolveCssVar = (el: HTMLElement | null, name: string): string => {
      let node: HTMLElement | null = el;
      while (node) {
        const v = getComputedStyle(node).getPropertyValue(name).trim();
        if (v) return v;
        node = node.parentElement;
      }
      return "";
    };

    const normalizeColor = (val: string): string => {
      // Convert named/hex/etc to computed rgb() using a temp element
      const tmp = document.createElement("div");
      tmp.style.color = val;
      document.body.appendChild(tmp);
      const out = getComputedStyle(tmp).color;
      tmp.remove();
      return out;
    };

    const resolveEffectiveColor = (startEl: HTMLElement | null): string => {
      let el: HTMLElement | null = startEl;
      while (el) {
        let c = getComputedStyle(el).color?.trim();

        if (!c || c === "" || c === "inherit") {
          el = el.parentElement;
          continue;
        }

        const varRef = parseVar(c);
        if (varRef) {
          const varVal = resolveCssVar(el, varRef.name) || varRef.fallback || "inherit";
          if (varVal === "inherit" || varVal === "") {
            el = el.parentElement;
            continue;
          }
          return normalizeColor(varVal);
        }

        return normalizeColor(c);
      }
      return ""; // not expected
    };

    const headerColor = resolveEffectiveColor(headerEl);
    expect(headerColor).toMatch(/^rgb\(/); // sanity

    const icons = screen.getAllByTestId("icon") as HTMLElement[];
    expect(icons.length).toBeGreaterThan(0);

    icons.forEach((iconEl) => {
      const iconColor = resolveEffectiveColor(iconEl);
      expect(iconColor).toBe(headerColor);
    });
  });


  test("hideShadow=true removes box shadow", () => {
    render(
      <Panel title="No Shadow" color="info" hideShadow>
        Content
      </Panel>
    );

    const panelRoot = screen.getByText("No Shadow").closest(".panel") as HTMLElement;
    expect(panelRoot).toBeInTheDocument();

    const cs = getComputedStyle(panelRoot);
    // JSDOM reports 'none' when no box-shadow; if the environment returns empty string, allow that too.
    expect([cs.boxShadow, cs.boxShadow.trim()]).toContain("none");
  });

  test("hideShadow=false (default) applies a box shadow", () => {
    render(
      <Panel title="With Shadow" color="info">
        Content
      </Panel>
    );

    const panelRoot = screen.getByText("With Shadow").closest(".panel") as HTMLElement;
    const cs = getComputedStyle(panelRoot);

    // Should NOT be 'none'
    expect(cs.boxShadow && cs.boxShadow.trim()).not.toBe("none");
  });

  test("disabled panel prevents left icon click handler from firing", () => {
    const onClick = vi.fn();
    render(
      <Panel
        title="Disabled with Left Icon"
        disabled
        leftIcon={{ icon: "menu", onClick }}
      >
        Content
      </Panel>
    );

    const leftIcon = screen.getByTestId("icon");
    fireEvent.click(leftIcon);
    expect(onClick).not.toHaveBeenCalled();
  });

  test("renders sub header across all colors without throwing", () => {
    const colors = ["primary", "success", "warning", "danger", "info", "default"] as const;

    colors.forEach((c) => {
      render(
        <Panel title={`Sub ${c}`} color={c} isSubHeader>
          Content
        </Panel>
      );
      expect(screen.getByText(`Sub ${c}`)).toBeInTheDocument();
    });
  });

    test("renders leftDetails and rightDetails, and detail onClick fires", () => {
    const onLeftDetailClick = vi.fn();
    const onRightDetailClick = vi.fn();

    render(
      <Panel
        title="Details Panel"
        color="warning"
        leftDetails={[
          { text: "Left Text", color: "info" },
          { text: "Left Clickable", color: "success", onClick: onLeftDetailClick },
        ]}
        rightDetails={[
          { value: "12", valueColor: "danger" }, // badge-like value
          { text: "Right Clickable", color: "primary", onClick: onRightDetailClick },
        ]}
      >
        Content
      </Panel>
    );

    // Renders both left & right detail content
    expect(screen.getByText("Left Text")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Right Clickable")).toBeInTheDocument();
    expect(screen.getByText("Left Clickable")).toBeInTheDocument();

    // Clicking details should invoke their onClick (container handles it)
    fireEvent.click(screen.getByText("Left Clickable"));
    fireEvent.click(screen.getByText("Right Clickable"));

    expect(onLeftDetailClick).toHaveBeenCalledTimes(1);
    expect(onRightDetailClick).toHaveBeenCalledTimes(1);
  });

  test("leftContent and rightContent custom nodes render in header", () => {
    render(
      <Panel
        title="Custom Header Content"
        color="primary"
        leftContent={<span data-testid="left-custom">Filters active</span>}
        rightContent={<button data-testid="right-custom">Run</button>}
      >
        Content
      </Panel>
    );

    const header = screen.getByText("Custom Header Content").closest(".panel")!.querySelector(".panel-header")!;
    expect(header).toBeInTheDocument();

    // custom content present
    expect(screen.getByTestId("left-custom")).toHaveTextContent("Filters active");
    expect(screen.getByTestId("right-custom")).toHaveTextContent("Run");
  });

  test("disabled panel prevents rightDetails click handlers", () => {
    const onClick = vi.fn();
    render(
      <Panel
        title="Disabled with Details"
        disabled
        rightDetails={[{ text: "Should Not Fire", onClick }]}
      >
        Content
      </Panel>
    );

    fireEvent.click(screen.getByText("Should Not Fire"));
    expect(onClick).not.toHaveBeenCalled();
  });

  test("supports badge-like numeric values in details", () => {
    render(
      <Panel
        title="Badge Details"
        rightDetails={[{ value: "5", valueColor: "danger" }]}
      >
        Content
      </Panel>
    );

    // The numeric value should be visible (Badge text)
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  test("details can show icons (inherit header color via Icon component)", () => {
    render(
      <Panel
        title="Icon Details"
        leftDetails={[{ icon: "warning", color: "warning" }]}
        rightDetails={[{ icon: "info", color: "info" }]}
      >
        Content
      </Panel>
    );

    // There should be at least two icons rendered (one left, one right)
    const icons = screen.getAllByTestId("icon");
    expect(icons.length).toBeGreaterThanOrEqual(2);
  });

});
