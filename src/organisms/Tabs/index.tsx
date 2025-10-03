import React, { useState, useRef, useEffect, Suspense } from "react";
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
  variant = "default",
}) => {
  // Resolve initial selected tab (first non-disabled)
  const initial =
    activeTab !== undefined
      ? activeTab
      : (tabs?.findIndex((t) => !t.disabled) ?? 0);

  const [selectedTab, setSelectedTab] = useState<number>(initial);
  const [focusedTab, setFocusedTab] = useState<number>(initial);
  const [isScrollable, setIsScrollable] = useState(false);

  const tabListRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ------- Built-in deferred mount for active panel (idle tick) -------
  const [showContent, setShowContent] = useState(false);
  const cancelIdleRef = useRef<() => void>();

  const scheduleIdle = (cb: () => void) => {
    const w = window as any;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(cb, { timeout: 120 });
      cancelIdleRef.current = () => w.cancelIdleCallback?.(id);
    } else {
      const id = window.setTimeout(cb, 1);
      cancelIdleRef.current = () => window.clearTimeout(id);
    }
  };

  // ------- No-jump height choreography -------
  const panelOuterRef = useRef<HTMLDivElement>(null); // TabContentWrapper
  const panelInnerRef = useRef<HTMLDivElement>(null); // TabContent

  // If not null, we set inline style height: px (content-box)
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);
  // Special handling for the very first reveal
  const firstRevealRef = useRef(true);
  const heightUnlockTimerRef = useRef<number | null>(null);

  const getWrapperPaddingY = (el: HTMLElement) => {
    const cs = getComputedStyle(el);
    return parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  };

  // Measure the current content-box height (not including wrapper padding)
  const getContentBoxHeight = (
    outer: HTMLElement | null,
    inner: HTMLElement | null,
  ) => {
    if (inner) return inner.offsetHeight; // content-box height
    if (outer)
      return Math.max(0, outer.clientHeight - getWrapperPaddingY(outer));
    return 0;
  };

  const unlockHeightSoon = (ms = 240) => {
    if (heightUnlockTimerRef.current) {
      window.clearTimeout(heightUnlockTimerRef.current);
    }
    heightUnlockTimerRef.current = window.setTimeout(() => {
      setLockedHeight(null); // release to auto
      heightUnlockTimerRef.current = null;
    }, ms);
  };

  useEffect(() => {
    return () => {
      cancelIdleRef.current?.();
      if (heightUnlockTimerRef.current) {
        window.clearTimeout(heightUnlockTimerRef.current);
      }
    };
  }, []);

  // ---------------- controlled sync ----------------
  useEffect(() => {
    if (activeTab !== undefined) {
      setSelectedTab(activeTab);
      setFocusedTab(activeTab);
    }
  }, [activeTab]);

  // ---------------- scrollability ----------------
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

  const getTabId = (i: number) => `tab-${i}`;
  const getPanelId = (i: number) => `tabpanel-${i}`;

  const ensureTabVisible = (index: number) => {
    const el = tabListRef.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  // ---------------- selection change ----------------
  const handleTabChange = (index: number) => {
    if (!tabs[index].disabled && selectedTab !== index) {
      // 1) Lock to the current content-box height to prevent collapse
      const prevH = getContentBoxHeight(
        panelOuterRef.current,
        panelInnerRef.current,
      );
      setLockedHeight(prevH);

      // 2) Switch selection
      setSelectedTab(index);
      setFocusedTab(index);
      onTabChange?.(index);
      ensureTabVisible(index);

      // 3) Defer mounting of the new content to next idle
      cancelIdleRef.current?.();
      setShowContent(false);
      scheduleIdle(() => setShowContent(true));
    }
  };

  // Also run for initial mount and any controlled change where selectedTab changes
  useEffect(() => {
    cancelIdleRef.current?.();
    setShowContent(false);
    scheduleIdle(() => setShowContent(true));
    return () => cancelIdleRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  // When new content is mounted, animate height smoothly
  useEffect(() => {
    if (!showContent) return;

    let r1 = 0,
      r2 = 0,
      r3 = 0;

    r1 = requestAnimationFrame(() => {
      const nextH = getContentBoxHeight(
        panelOuterRef.current,
        panelInnerRef.current,
      );

      if (firstRevealRef.current) {
        // First-ever reveal:
        // Start from 0 → animate to measured height → release
        setLockedHeight(0);
        r2 = requestAnimationFrame(() => {
          setLockedHeight(nextH);
          r3 = requestAnimationFrame(() => {
            unlockHeightSoon(); // release to auto after the animation
            firstRevealRef.current = false;
          });
        });
      } else {
        // Subsequent tab switches: animate from previous locked → next
        setLockedHeight(nextH);
        // Release handled by transitionend (with fallback timer)
      }
    });

    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
      cancelAnimationFrame(r3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showContent, selectedTab]);

  // ---------------- keyboard nav ----------------
  const moveFocus = (dir: "left" | "right") => {
    let i = focusedTab;
    if (dir === "left") {
      do i--;
      while (i >= 0 && tabs[i].disabled);
    } else {
      do i++;
      while (i < tabs.length && tabs[i].disabled);
    }
    if (i >= 0 && i < tabs.length) {
      setFocusedTab(i);
      ensureTabVisible(i);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(tag)) return;
    if (e.key === "ArrowLeft") moveFocus("left");
    else if (e.key === "ArrowRight") moveFocus("right");
    else if (e.key === "Enter") {
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
        role="tablist"
        aria-orientation="horizontal"
        className="tab-wrapper"
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
            $variant={variant}
          >
            <Icon icon="keyboard_arrow_left" />
          </ScrollButton>
        )}

        <TabsContainer
          ref={tabListRef}
          className="tabs-container"
          $fullHeader={fullHeader}
          $variant={variant}
        >
          {tabs.map((tab, index) => {
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
                $variant={variant}
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
            $variant={variant}
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

      {/* Panel with height lock + smooth transition + Suspense */}
      <TabContentWrapper
        ref={panelOuterRef}
        $color={tabs?.[selectedTab]?.color ?? "primary"}
        $variant={variant}
        style={{ height: lockedHeight != null ? lockedHeight : undefined }}
        onTransitionEnd={(e) => {
          if (e.propertyName === "height") {
            setLockedHeight(null); // release to auto after animation
          }
        }}
      >
        <TabContent
          ref={panelInnerRef}
          key={selectedTab}
          className="fade-in"
          role="tabpanel"
          id={getPanelId(selectedTab)}
          aria-labelledby={getTabId(selectedTab)}
          aria-busy={!showContent || undefined}
        >
          {showContent ? (
            // If consumer passes React.lazy, this truly code-splits; otherwise it just renders.
            <Suspense fallback={null}>
              {tabs?.[selectedTab]?.content ?? null}
            </Suspense>
          ) : null}
        </TabContent>
      </TabContentWrapper>
    </div>
  );
};

export * from "./interface";
