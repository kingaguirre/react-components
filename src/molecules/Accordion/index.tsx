import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import {
  AccordionProps,
  AccordionItemProps,
  AccordionItemDetail,
} from "./interface";
import {
  AccordionContainer,
  AccordionItemWrapper,
  AccordionHeader,
  AccordionTitle,
  AccordionRightContent,
  AccordionContentWrapper,
  AccordionContentInner,
  AccordionDetailContainer,
} from "./styled";
import { Icon } from "../../atoms/Icon";
import { Badge } from "../../atoms/Badge";

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  // controlled API
  activeKeys,
  onActiveKeysChange,
  defaultOpenKeys,
  forcedOpenKeys,
}) => {
  const getKey = useCallback(
    (idx: number) => String(items[idx]?.id ?? idx),
    [items],
  );

  // Uncontrolled map
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  // Track parent-driven open prop flips → auto-controlled keys
  const prevPropOpenRef = useRef<Record<string, boolean | undefined>>({});
  const autoControlledKeysRef = useRef<Set<string>>(new Set());

  const defaultOpenSet = useMemo(
    () => new Set(defaultOpenKeys ?? []),
    [defaultOpenKeys],
  );
  const forcedOpenSet = useMemo(
    () => new Set(forcedOpenKeys ?? []),
    [forcedOpenKeys],
  );
  const fullyControlled = Array.isArray(activeKeys);
  const activeKeysSet = useMemo(() => new Set(activeKeys ?? []), [activeKeys]);

  useEffect(() => {
    const nextPrev = { ...prevPropOpenRef.current };
    const nextAuto = new Set(autoControlledKeysRef.current);

    items.forEach((it, idx) => {
      const key = getKey(idx);
      const propOpen =
        typeof it.open === "boolean" ? (it.open as boolean) : undefined;

      const prev = nextPrev[key];
      nextPrev[key] = propOpen;

      if (propOpen !== undefined && prev !== undefined && prev !== propOpen) {
        nextAuto.add(key);
      }
    });

    prevPropOpenRef.current = nextPrev;
    autoControlledKeysRef.current = nextAuto;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, getKey]);

  const isOpenNow = (index: number): boolean => {
    const item = items[index];
    const key = getKey(index);

    if (forcedOpenSet.has(key)) return true;
    if (fullyControlled) return activeKeysSet.has(key);

    const propOpen =
      typeof item.open === "boolean" ? (item.open as boolean) : undefined;
    if (autoControlledKeysRef.current.has(key)) return !!propOpen;

    if (key in openItems) return !!openItems[key];
    if (defaultOpenSet.has(key)) return true;
    return !!propOpen;
  };

  const toggleItem = (index: number, e?: React.MouseEvent) => {
    const item = items[index];
    const key = getKey(index);
    const idForCallback = item.id ?? key;

    const currentlyOpen = isOpenNow(index);
    const willOpen = !currentlyOpen;

    if (!willOpen && forcedOpenSet.has(key)) {
      item.onClick?.(e, idForCallback);
      return;
    }

    item.onClick?.(e, idForCallback);
    if (willOpen) item.onOpen?.(e, idForCallback);
    else item.onClose?.(e, idForCallback);

    if (fullyControlled) {
      if (!onActiveKeysChange) return;

      let next = new Set(activeKeysSet);
      if (allowMultiple) {
        if (willOpen) next.add(key);
        else next.delete(key);
      } else {
        next = willOpen ? new Set([key]) : new Set();
      }

      forcedOpenSet.forEach((fk) => next.add(fk));
      onActiveKeysChange(Array.from(next));
      return;
    }

    if (autoControlledKeysRef.current.has(key)) return;

    setOpenItems((prev) => {
      const prevMap = prev ?? {};
      const next: Record<string, boolean> = allowMultiple
        ? { ...prevMap }
        : Object.fromEntries(Object.keys(prevMap).map((k) => [k, false]));
      next[key] = willOpen;
      return next;
    });
  };

  return (
    <AccordionContainer>
      {items.map((item, idx) => {
        const key = getKey(idx);
        const open = isOpenNow(idx);
        return (
          <AccordionItem
            key={key}
            {...item}
            open={open}
            toggle={(e) => toggleItem(idx, e)}
          />
        );
      })}
    </AccordionContainer>
  );
};

interface AccordionItemInternalProps extends AccordionItemProps {
  open: boolean;
  toggle: (e?: React.MouseEvent) => void;
}

/**
 * Built-in lazy policy (no props):
 * - When opening: mount wrapper immediately, defer children with an idle tick (ric | setTimeout 1ms).
 * - When closing: keep mounted during max-height transition, unmount children on transitionend.
 * - If children are React.lazy, we wrap in <Suspense fallback={null}>.
 */
const AccordionItem: React.FC<AccordionItemInternalProps> = ({
  title,
  children,
  color = "primary",
  rightContent,
  rightDetails,
  open,
  toggle,
  disabled = false,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const [maxHeight, setMaxHeight] = useState(0);
  // Wrapper presence for animation (open or closing)
  const [shouldRender, setShouldRender] = useState<boolean>(open);
  // Children actually mounted (lazy)
  const [showChildren, setShowChildren] = useState<boolean>(false);

  // version token to cancel stale schedules
  const ticketRef = useRef(0);

  // idle scheduler (pairs with cancel)
  const cancelIdleRef = useRef<() => void>();
  const scheduleIdle = useCallback((cb: () => void) => {
    const w = window as any;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(cb, { timeout: 120 });
      cancelIdleRef.current = () => w.cancelIdleCallback?.(id);
    } else {
      const id = window.setTimeout(cb, 1);
      cancelIdleRef.current = () => window.clearTimeout(id);
    }
  }, []);
  useEffect(() => () => cancelIdleRef.current?.(), []);

  const updateHeight = useCallback(() => {
    if (contentRef.current) setMaxHeight(contentRef.current.scrollHeight);
  }, []);

  // On open → show wrapper; children mount after an idle tick
  useEffect(() => {
    if (open) {
      setShouldRender(true);
      ticketRef.current += 1;
      const myTicket = ticketRef.current;

      // start empty so header paints first
      setShowChildren(false);
      cancelIdleRef.current?.();
      scheduleIdle(() => {
        if (ticketRef.current === myTicket) setShowChildren(true);
      });
    } else {
      // Closing: cancel any queued child-mount to avoid mounting after close
      cancelIdleRef.current?.();
      // unmount children on transitionend
    }
  }, [open, scheduleIdle]);

  // Measure when wrapper is present and children mount/resize
  useEffect(() => {
    if (!shouldRender) return;
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    if (contentRef.current) ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [shouldRender, showChildren, updateHeight]);

  useEffect(() => {
    if (shouldRender) updateHeight();
  }, [open, shouldRender, showChildren, updateHeight]);

  const handleHeaderClick = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    toggle(e);
  };

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      // Some environments (jsdom) deliver empty propertyName for synthetic transitionend.
      // We only filter when a name is provided; otherwise accept and proceed.
      const name = (e as any).propertyName as string | undefined;

      // If a name is present, accept both kebab- and camel-case; otherwise allow.
      const nameProvided = !!name && name.length > 0;
      const isMaxHeight =
        !nameProvided || name === "max-height" || name === "maxHeight";

      if (!isMaxHeight) return;

      // Only unmount when closing
      if (!open) {
        setShowChildren(false);
        setShouldRender(false);
      }
    },
    [open],
  );

  return (
    <AccordionItemWrapper
      tabIndex={disabled ? undefined : 0}
      $color={color}
      $disabled={disabled}
    >
      <AccordionHeader
        className="accordion-header"
        $open={open}
        $color={color}
        $disabled={disabled}
        onClick={handleHeaderClick}
      >
        <Icon icon={open ? "remove" : "add"} />
        <AccordionTitle className="accordion-title" $disabled={disabled}>
          {title}
        </AccordionTitle>

        {rightContent && (
          <AccordionRightContent
            className="accordion-right-content"
            $disabled={disabled}
          >
            {rightContent}
          </AccordionRightContent>
        )}

        {rightDetails?.map((detail: AccordionItemDetail, i: number) => {
          if (!detail.icon && !detail.text && detail.value == null) return null;
          return (
            <AccordionDetailContainer
              className="accordion-detail"
              $disabled={disabled}
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                detail.onClick?.();
              }}
            >
              {detail.value != null && (
                <Badge color={detail.valueColor ?? detail.color ?? color}>
                  {detail.value}
                </Badge>
              )}
              {detail.icon && (
                <Icon
                  icon={detail.icon}
                  color={detail.iconColor ?? detail.color ?? color}
                />
              )}
              {detail.text && (
                <span
                  style={{ color: detail.textColor ?? detail.color ?? color }}
                >
                  {detail.text}
                </span>
              )}
            </AccordionDetailContainer>
          );
        })}
      </AccordionHeader>

      <AccordionContentWrapper
        className="accordion-body"
        $color={color}
        $expanded={open}
        $maxHeight={maxHeight}
        onTransitionEndCapture={handleTransitionEnd}
        aria-busy={open && shouldRender && !showChildren ? true : undefined}
      >
        {shouldRender && (
          <AccordionContentInner ref={contentRef}>
            {showChildren ? <Suspense fallback={null}>{children}</Suspense> : null}
          </AccordionContentInner>
        )}
      </AccordionContentWrapper>
    </AccordionItemWrapper>
  );
};
