// src/organisms/Tabs/_test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Tabs } from "./index";
import { TabItemProps } from "./interface";

// Original tabsData where Tab 3 is disabled
const tabsData: TabItemProps[] = [
  {
    title: "Tab 1",
    content: <div>Content 1</div>,
    disabled: false,
    color: "primary",
  },
  {
    title: "Tab 2",
    content: <div>Content 2</div>,
    disabled: false,
    color: "primary",
  },
  {
    title: "Tab 3",
    content: <div>Content 3</div>,
    disabled: true,
    color: "danger",
  },
];

// New test data with all tabs enabled for nav control testing
const enabledTabsData: TabItemProps[] = [
  {
    title: "Tab 1",
    content: <div>Content 1</div>,
    disabled: false,
    color: "primary",
  },
  {
    title: "Tab 2",
    content: <div>Content 2</div>,
    disabled: false,
    color: "primary",
  },
  {
    title: "Tab 3",
    content: <div>Content 3</div>,
    disabled: false, // Now enabled
    color: "danger",
  },
];

describe("Tabs Component", () => {
  it("renders default active tab content", () => {
    render(<Tabs tabs={tabsData} />);
    // The default active tab should be the first non-disabled tab ("Tab 1")
    expect(screen.getByText("Content 1")).toBeInTheDocument();
  });

  it("calls onTabChange and updates content when a non-disabled tab is clicked", () => {
    const onTabChange = vi.fn();
    render(<Tabs tabs={tabsData} onTabChange={onTabChange} />);
    
    // Click on "Tab 2"
    const tab2 = screen.getByText("Tab 2");
    fireEvent.click(tab2);
    
    // Verify the callback is called with index 1 and content changes
    expect(onTabChange).toHaveBeenCalledWith(1);
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  it("does not change active tab when a disabled tab is clicked", () => {
    const onTabChange = vi.fn();
    render(<Tabs tabs={tabsData} onTabChange={onTabChange} />);
    
    // Attempt to click on the disabled "Tab 3"
    const tab3 = screen.getByText("Tab 3");
    fireEvent.click(tab3);
    
    // onTabChange should not be called and active tab remains "Tab 1"
    expect(onTabChange).not.toHaveBeenCalled();
    expect(screen.getByText("Content 1")).toBeInTheDocument();
  });

  it("handles arrow key navigation and Enter key selection", () => {
    const onTabChange = vi.fn();
    const { container } = render(<Tabs tabs={tabsData} onTabChange={onTabChange} />);
    
    // The outer wrapper is focusable.
    const wrapper = container.firstChild as HTMLElement;
    wrapper.focus();
    
    // Press the right arrow to move focus to "Tab 2"
    fireEvent.keyDown(wrapper, { key: "ArrowRight" });
    // Press Enter to select the focused tab
    fireEvent.keyDown(wrapper, { key: "Enter" });
    
    expect(onTabChange).toHaveBeenCalledWith(1);
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  it("renders first and last navigation controls when firstLastNavControl is true", () => {
    const { container } = render(<Tabs tabs={tabsData} firstLastNavControl />);
    
    // Query nav buttons by their class names
    const firstNav = container.querySelector(".nav-button-first");
    const lastNav = container.querySelector(".nav-button-last");
    expect(firstNav).toBeInTheDocument();
    expect(lastNav).toBeInTheDocument();
  });

  it("clicking first and last navigation controls changes active tab", () => {
    const onTabChange = vi.fn();
    // Use enabledTabsData so that all tabs are clickable
    const { container } = render(
      <Tabs tabs={enabledTabsData} firstLastNavControl onTabChange={onTabChange} activeTab={1} />
    );
    
    const firstNav = container.querySelector(".nav-button-first") as HTMLElement;
    const lastNav = container.querySelector(".nav-button-last") as HTMLElement;
    
    // Clicking the first nav button should select the first tab (index 0)
    fireEvent.click(firstNav);
    expect(onTabChange).toHaveBeenCalledWith(0);
    
    // Clicking the last nav button should select the last tab (index = enabledTabsData.length - 1)
    fireEvent.click(lastNav);
    expect(onTabChange).toHaveBeenCalledWith(enabledTabsData.length - 1);
  });

  // ───────────────────── NEW TESTS (extra coverage) ─────────────────────

  it("keyboard navigation skips disabled tabs", () => {
    const onTabChange = vi.fn();
    const { container } = render(<Tabs tabs={tabsData} onTabChange={onTabChange} />);
    const wrapper = container.firstChild as HTMLElement;
    wrapper.focus();

    // Move focus from Tab 1 -> Tab 2
    fireEvent.keyDown(wrapper, { key: "ArrowRight" });
    // Next right would attempt Tab 3 but it's disabled, so focus should NOT move.
    fireEvent.keyDown(wrapper, { key: "ArrowRight" });

    // Enter should still select Tab 2 (index 1)
    fireEvent.keyDown(wrapper, { key: "Enter" });
    expect(onTabChange).toHaveBeenCalledWith(1);
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  it("respects activeTab prop changes from parent (controlled sync)", () => {
    const { rerender } = render(<Tabs tabs={tabsData} activeTab={0} />);
    // Starts on Tab 1
    expect(screen.getByText("Content 1")).toBeInTheDocument();

    // Parent flips to activeTab=1
    rerender(<Tabs tabs={tabsData} activeTab={1} />);
    expect(screen.getByText("Content 2")).toBeInTheDocument();

    // Parent flips to disabled tab (index 2) — still rendered, but header is disabled.
    rerender(<Tabs tabs={tabsData} activeTab={2} />);
    expect(screen.getByText("Content 3")).toBeInTheDocument();
  });

  it("clicking headers still switches tabs even when activeTab prop is provided (local state updates until parent overrides)", () => {
    const onTabChange = vi.fn();
    render(<Tabs tabs={tabsData} onTabChange={onTabChange} activeTab={1} />);

    // Currently on Tab 2; click Tab 1
    fireEvent.click(screen.getByText("Tab 1"));

    // Callback fires and content should show Tab 1 now
    expect(onTabChange).toHaveBeenCalledWith(0);
    expect(screen.getByText("Content 1")).toBeInTheDocument();
  });

  it("sets correct ARIA attributes for tabs and the active panel", () => {
    const { container } = render(<Tabs tabs={tabsData} />);
    const tabs = container.querySelectorAll('[role="tab"]');
    const tabpanel = container.querySelector('[role="tabpanel"]') as HTMLElement;

    // There should be 3 tab elements
    expect(tabs.length).toBe(3);

    // First tab is selected by default
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    expect(tabs[2]).toHaveAttribute("aria-selected", "false");

    // Panel should be labelled by the selected tab
    const labelledBy = tabpanel.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    const selectedTab = Array.from(tabs).find(t => t.getAttribute("aria-selected") === "true")!;
    expect(selectedTab.id).toBe(labelledBy);
  });

  it("keyboard: left/right + Enter still works when activeTab is provided", () => {
    const onTabChange = vi.fn();
    const { container } = render(<Tabs tabs={tabsData} onTabChange={onTabChange} activeTab={0} />);
    const wrapper = container.firstChild as HTMLElement;
    wrapper.focus();

    // Move focus right -> Tab 2, Enter to select
    fireEvent.keyDown(wrapper, { key: "ArrowRight" });
    fireEvent.keyDown(wrapper, { key: "Enter" });
    expect(onTabChange).toHaveBeenCalledWith(1);
    expect(screen.getByText("Content 2")).toBeInTheDocument();

    // Move focus right -> attempt Tab 3 (disabled) → focus does not advance; Enter keeps Tab 2
    fireEvent.keyDown(wrapper, { key: "ArrowRight" });
    fireEvent.keyDown(wrapper, { key: "Enter" });
    // Still last called with 1, and content 2 visible
    expect(onTabChange).toHaveBeenLastCalledWith(1);
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });
});
