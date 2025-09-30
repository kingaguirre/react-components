// src/organisms/Tabs/_test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll } from "vitest";
import { Tabs } from "./index";
import { TabItemProps } from "./interface";

beforeAll(() => {
  // jsdom doesn’t implement this; keep ensureTabVisible from exploding
  if (!HTMLElement.prototype.scrollIntoView) {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      value: () => {},
      writable: true,
    });
  }
});

// Original tabsData where Tab 3 is disabled
const tabsData: TabItemProps[] = [
  { title: "Tab 1", content: <div>Content 1</div>, disabled: false, color: "primary" },
  { title: "Tab 2", content: <div>Content 2</div>, disabled: false, color: "primary" },
  { title: "Tab 3", content: <div>Content 3</div>, disabled: true,  color: "danger"  },
];

// All enabled (for first/last nav controls)
const enabledTabsData: TabItemProps[] = [
  { title: "Tab 1", content: <div>Content 1</div>, disabled: false, color: "primary" },
  { title: "Tab 2", content: <div>Content 2</div>, disabled: false, color: "primary" },
  { title: "Tab 3", content: <div>Content 3</div>, disabled: false, color: "danger"  },
];

describe("Tabs Component", () => {
  it("renders default active tab content", async () => {
    render(<Tabs tabs={tabsData} />);
    expect(await screen.findByText("Content 1")).toBeInTheDocument();
  });

  it("calls onTabChange and updates content when a non-disabled tab is clicked", async () => {
    const onTabChange = vi.fn();
    render(<Tabs tabs={tabsData} onTabChange={onTabChange} />);

    fireEvent.click(screen.getByText("Tab 2"));
    expect(onTabChange).toHaveBeenCalledWith(1);
    expect(await screen.findByText("Content 2")).toBeInTheDocument();
  });

  it("does not change active tab when a disabled tab is clicked", async () => {
    const onTabChange = vi.fn();
    render(<Tabs tabs={tabsData} onTabChange={onTabChange} />);

    expect(await screen.findByText("Content 1")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Tab 3"));
    expect(onTabChange).not.toHaveBeenCalled();
    expect(screen.getByText("Content 1")).toBeInTheDocument();
  });

  it("handles arrow key navigation and Enter key selection", async () => {
    const onTabChange = vi.fn();
    const { container } = render(<Tabs tabs={tabsData} onTabChange={onTabChange} />);

    const wrapper = container.firstChild as HTMLElement;
    wrapper.focus();
    fireEvent.keyDown(wrapper, { key: "ArrowRight" });
    fireEvent.keyDown(wrapper, { key: "Enter" });

    expect(onTabChange).toHaveBeenCalledWith(1);
    expect(await screen.findByText("Content 2")).toBeInTheDocument();
  });

  it("renders first and last navigation controls when firstLastNavControl is true", () => {
    const { container } = render(<Tabs tabs={tabsData} firstLastNavControl />);
    expect(container.querySelector(".nav-button-first")).toBeInTheDocument();
    expect(container.querySelector(".nav-button-last")).toBeInTheDocument();
  });

  it("clicking first and last navigation controls changes active tab", () => {
    const onTabChange = vi.fn();
    const { container } = render(
      <Tabs tabs={enabledTabsData} firstLastNavControl onTabChange={onTabChange} activeTab={1} />
    );

    fireEvent.click(container.querySelector(".nav-button-first") as HTMLElement);
    expect(onTabChange).toHaveBeenCalledWith(0);

    fireEvent.click(container.querySelector(".nav-button-last") as HTMLElement);
    expect(onTabChange).toHaveBeenCalledWith(enabledTabsData.length - 1);
  });

  // ───────────────────── React.lazy coverage (no fake timers) ─────────────────────

  it("supports React.lazy content on initial mount", async () => {
    const LazyA = React.lazy(async () => {
      await new Promise(r => setTimeout(r, 20));
      return { default: () => <div>Lazy A</div> };
    });

    render(
      <Tabs
        tabs={[
          { title: "Lazy",  content: <LazyA /> },
          { title: "Eager", content: <div>Eager</div> },
        ]}
        activeTab={0}
      />
    );

    expect(screen.queryByText("Lazy A")).not.toBeInTheDocument();
    // Wait for idle + lazy module resolve
    expect(await screen.findByText("Lazy A")).toBeInTheDocument();
  });

  it("loads React.lazy content when switching into a lazy tab", async () => {
    const LazyB = React.lazy(async () => {
      await new Promise(r => setTimeout(r, 15));
      return { default: () => <div>Lazy B</div> };
    });

    render(
      <Tabs
        tabs={[
          { title: "A", content: <div>Content A</div> },
          { title: "B", content: <LazyB /> },
        ]}
        activeTab={0}
      />
    );

    // initial (A) mounts on idle
    expect(await screen.findByText("Content A")).toBeInTheDocument();

    fireEvent.click(screen.getByText("B"));
    expect(screen.queryByText("Lazy B")).not.toBeInTheDocument();

    // Wait for idle + lazy module resolve
    expect(await screen.findByText("Lazy B")).toBeInTheDocument();
  });

  // ───────────────────── Misc/ARIA & controlled ─────────────────────

  it("keyboard navigation skips disabled tabs", async () => {
    const onTabChange = vi.fn();
    const { container } = render(<Tabs tabs={tabsData} onTabChange={onTabChange} />);
    const wrapper = container.firstChild as HTMLElement;

    wrapper.focus();
    fireEvent.keyDown(wrapper, { key: "ArrowRight" }); // -> Tab 2 focus
    fireEvent.keyDown(wrapper, { key: "ArrowRight" }); // Tab 3 disabled → stay on Tab 2
    fireEvent.keyDown(wrapper, { key: "Enter" });

    expect(onTabChange).toHaveBeenCalledWith(1);
    expect(await screen.findByText("Content 2")).toBeInTheDocument();
  });

  it("respects activeTab prop changes from parent (controlled sync)", async () => {
    const { rerender } = render(<Tabs tabs={tabsData} activeTab={0} />);
    expect(await screen.findByText("Content 1")).toBeInTheDocument();

    rerender(<Tabs tabs={tabsData} activeTab={1} />);
    expect(await screen.findByText("Content 2")).toBeInTheDocument();

    rerender(<Tabs tabs={tabsData} activeTab={2} />);
    expect(await screen.findByText("Content 3")).toBeInTheDocument();
  });

  it("clicking headers still switches tabs even when activeTab prop is provided", async () => {
    const onTabChange = vi.fn();
    render(<Tabs tabs={tabsData} onTabChange={onTabChange} activeTab={1} />);

    fireEvent.click(screen.getByText("Tab 1"));
    expect(onTabChange).toHaveBeenCalledWith(0);
    expect(await screen.findByText("Content 1")).toBeInTheDocument();
  });

  it("sets correct ARIA attributes for tabs and the active panel", () => {
    const { container } = render(<Tabs tabs={tabsData} />);
    const tabs = container.querySelectorAll('[role="tab"]');
    const tabpanel = container.querySelector('[role="tabpanel"]') as HTMLElement;

    expect(tabs.length).toBe(3);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    expect(tabs[2]).toHaveAttribute("aria-selected", "false");

    const labelledBy = tabpanel.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();

    const selectedTab = Array.from(tabs).find(t => t.getAttribute("aria-selected") === "true")!;
    expect(selectedTab.id).toBe(labelledBy);
  });

  it("keyboard: left/right + Enter still works when activeTab is provided", async () => {
    const onTabChange = vi.fn();
    const { container } = render(<Tabs tabs={tabsData} onTabChange={onTabChange} activeTab={0} />);
    const wrapper = container.firstChild as HTMLElement;

    wrapper.focus();
    fireEvent.keyDown(wrapper, { key: "ArrowRight" });
    fireEvent.keyDown(wrapper, { key: "Enter" });
    expect(onTabChange).toHaveBeenCalledWith(1);
    expect(await screen.findByText("Content 2")).toBeInTheDocument();

    // Attempt to move to disabled Tab 3 → stays on Tab 2
    fireEvent.keyDown(wrapper, { key: "ArrowRight" });
    fireEvent.keyDown(wrapper, { key: "Enter" });
    expect(onTabChange).toHaveBeenLastCalledWith(1);
    expect(await screen.findByText("Content 2")).toBeInTheDocument();
  });
});
