import React, { useState, useRef, useEffect } from "react";
import {
  TabsContainer,
  TabItem,
  NavButton,
  TabWrapper,
  ScrollButton,
  TabContentWrapper,
  TabContent,
} from "./styled";
import { TabsProps } from "./interface";
import { Icon } from "../../atoms/Icon";
import { Badge } from "../../atoms/Badge";

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  onTabChange,
  activeTab,
  firstLastNavControl = false,
  fullHeader = false,
}) => {
  const [selectedTab, setSelectedTab] = useState<number>(
    activeTab !== undefined
      ? activeTab
      : tabs?.findIndex((tab) => !tab.disabled),
  );
  const [focusedTab, setFocusedTab] = useState<number>(selectedTab);
  const [isScrollable, setIsScrollable] = useState(false);
  const tabListRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // --- helpers for ARIA wiring ---
  const getTabId = (i: number) => `tab-${i}`;
  const getPanelId = (i: number) => `tabpanel-${i}`;

  useEffect(() => {
    if (activeTab !== undefined) {
      setSelectedTab(activeTab);
      setFocusedTab(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const checkScrollable = () => {
      if (tabListRef.current) {
        setIsScrollable(
          tabListRef.current.scrollWidth > tabListRef.current.clientWidth,
        );
      }
    };

    checkScrollable();
    window.addEventListener("resize", checkScrollable);
    return () => window.removeEventListener("resize", checkScrollable);
  }, [tabs]);

  if (!tabs || tabs.length === 0) return null;

  const handleTabChange = (index: number) => {
    if (!tabs[index].disabled && selectedTab !== index) {
      setSelectedTab(index);
      setFocusedTab(index);
      onTabChange?.(index);
      ensureTabVisible(index);
    }
  };

  const ensureTabVisible = (index: number) => {
    if (tabListRef.current) {
      const tabElement = tabListRef.current.children[index] as HTMLElement;
      if (tabElement && typeof tabElement.scrollIntoView === "function") {
        tabElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  };

  const moveFocus = (direction: "left" | "right") => {
    let newFocus = focusedTab;
    if (direction === "left") {
      do {
        newFocus--;
      } while (newFocus >= 0 && tabs[newFocus].disabled);
    } else {
      do {
        newFocus++;
      } while (newFocus < tabs.length && tabs[newFocus].disabled);
    }

    if (newFocus >= 0 && newFocus < tabs.length) {
      setFocusedTab(newFocus);
      ensureTabVisible(newFocus);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isInputField = ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(
      (e.target as HTMLElement).tagName,
    );

    if (isInputField) return;

    if (e.key === "ArrowLeft") {
      moveFocus("left");
    } else if (e.key === "ArrowRight") {
      moveFocus("right");
    } else if (e.key === "Enter") {
      handleTabChange(focusedTab);
      wrapperRef.current?.focus();
    }
  };

  return (
    <div
      ref={wrapperRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ outline: "none" }}
      role="button"
      aria-pressed="false"
    >
      <TabWrapper
        className="tab-wrapper"
        role="tablist"
        aria-orientation="horizontal"
      >
        {firstLastNavControl && (
          <NavButton
            className="nav-button-first"
            onClick={() => {
              handleTabChange(0);
              wrapperRef.current?.focus();
            }}
          >
            <Icon icon="first_page" />
          </NavButton>
        )}
        {isScrollable && (
          <ScrollButton
            className="scroll-button-left"
            onClick={() => {
              moveFocus("left");
              wrapperRef.current?.focus();
            }}
            $position={firstLastNavControl ? "left-adjusted" : "left"}
          >
            <Icon icon="keyboard_arrow_left" />
          </ScrollButton>
        )}
        <TabsContainer
          ref={tabListRef}
          className="tabs-container"
          $fullHeader={fullHeader}
        >
          {tabs?.map((tab, index) => {
            const active = selectedTab === index;
            const disabled = !!tab.disabled;
            return (
              <TabItem
                key={`key-${tab.title}-${tab.color}`}
                className="tab-item"
                $active={active}
                $focused={focusedTab === index}
                $disabled={disabled}
                $color={tab.color ?? "primary"}
                $fullHeader={fullHeader}
                role="tab"
                id={getTabId(index)}
                aria-selected={active}
                aria-controls={getPanelId(index)}
                aria-disabled={disabled}
                tabIndex={active ? 0 : -1}
                aria-label={tab.title}
                onFocus={() => !disabled && setFocusedTab(index)}
                onClick={() => {
                  handleTabChange(index);
                  setFocusedTab(index);
                  wrapperRef.current?.focus();
                }}
              >
                {tab.icon && <Icon icon={tab.icon} color={tab.iconColor} />}
                <span className="title">{tab.title}</span>
                {tab.badgeValue !== undefined && (
                  <Badge color={tab.badgeColor ?? "danger"}>
                    {tab.badgeValue}
                  </Badge>
                )}
              </TabItem>
            );
          })}
        </TabsContainer>
        {isScrollable && (
          <ScrollButton
            className="scroll-button-right"
            onClick={() => {
              moveFocus("right");
              wrapperRef.current?.focus();
            }}
            $position={firstLastNavControl ? "right-adjusted" : "right"}
          >
            <Icon icon="keyboard_arrow_right" />
          </ScrollButton>
        )}
        {firstLastNavControl && (
          <NavButton
            className="nav-button-last"
            onClick={() => {
              handleTabChange(tabs.length - 1);
              wrapperRef.current?.focus();
            }}
          >
            <Icon icon="last_page" />
          </NavButton>
        )}
      </TabWrapper>

      {/* --- Single visible panel; ARIA linked to the selected tab --- */}
      <TabContentWrapper $color={tabs?.[selectedTab]?.color ?? "primary"}>
        <TabContent
          key={selectedTab}
          className="fade-in"
          role="tabpanel"
          id={getPanelId(selectedTab)}
          aria-labelledby={getTabId(selectedTab)}
        >
          {tabs?.[selectedTab]?.content}
        </TabContent>
      </TabContentWrapper>
    </div>
  );
};

export * from "./interface";
