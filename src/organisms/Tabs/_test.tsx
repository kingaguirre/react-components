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
});
