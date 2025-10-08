import React from "react";
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { GradientText } from "../GradientText";

/**
 * Grab the CSS that styled-components injects for a given className.
 * We search all <style> tags (styled-components adds data-styled attr)
 * and pull the rule blocks that mention the class.
 */
function cssForClass(className: string): string {
  const styles = Array.from(document.head.querySelectorAll("style"))
    .map((s) => s.textContent || "")
    .join("\n");

  // escape the class for regex
  const escaped = className.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  // match `.className { ... }` and also possible variants / media-nested forms
  const re = new RegExp(`\\.${escaped}[^}{]*\\{[^}]*\\}`, "g");
  const matches = styles.match(re) || [];
  return matches.join("\n");
}

function cssForElement(el: Element): string {
  return Array.from(el.classList)
    .map((c) => cssForClass(c))
    .join("\n");
}

describe("<GradientText />", () => {
  beforeEach(() => {
    // nothing special — Testing Library usually auto-cleans
  });

  afterEach(() => {
    // ensure DOM is clean between tests
    document.body.innerHTML = "";
  });

  it("renders children", () => {
    render(<GradientText>hello world</GradientText>);
    const el = screen.getByText("hello world");
    expect(el).toBeTruthy();
    expect(el.textContent).toBe("hello world");
  });

  it("applies gradient background & text clipping styles", async () => {
    render(<GradientText>gradient</GradientText>);
    const el = screen.getByText("gradient");

    await waitFor(() => {
      const css = cssForElement(el);
      expect(css).toMatch(/linear-gradient\s*\(135deg/i);
      expect(css).toMatch(/background-clip:\s*text/i);
      // webkit specifics are critical for real rendering
      expect(css).toMatch(/-webkit-background-clip:\s*text/i);
      expect(css).toMatch(/-webkit-text-fill-color:\s*transparent/i);
      // we also explicitly set color: transparent as fallback
      expect(css).toMatch(/color:\s*transparent/i);
      // display inline-block avoids paint-area cropping
      expect(css).toMatch(/display:\s*inline-block/i);
    });
  });

  it("is NOT bold by default", async () => {
    render(<GradientText>not bold</GradientText>);
    const el = screen.getByText("not bold");

    await waitFor(() => {
      const css = cssForElement(el);
      // The base rule should not include font-weight unless bold=true
      expect(css).not.toMatch(/font-weight\s*:\s*bold/i);
      expect(css).not.toMatch(/font-weight\s*:\s*700/i);
    });
  });

  it("applies bold when bold={true}", async () => {
    render(<GradientText bold>is bold</GradientText>);
    const el = screen.getByText("is bold");

    await waitFor(() => {
      const css = cssForElement(el);
      // Conditional block should exist when bold=true
      expect(css).toMatch(/font-weight\s*:\s*bold/i);
    });
  });
});
