import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
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
  // Make a stable key for each item
  const getKey = useCallback(
    (idx: number) => String(items[idx]?.id ?? idx),
    [items],
  );

  // Uncontrolled internal map (when `activeKeys` is not provided AND item isn't auto-controlled)
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  // Track previous `open` per item to detect parent-driven flips -> “auto-controlled” keys
  const prevPropOpenRef = useRef<Record<string, boolean | undefined>>({});
  const autoControlledKeysRef = useRef<Set<string>>(new Set());

  // Build quick lookup sets for controlled helpers
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

  // Detect items whose `open` prop changed across renders (become auto-controlled)
  useEffect(() => {
    const nextPrev = { ...prevPropOpenRef.current };
    const nextAuto = new Set(autoControlledKeysRef.current);

    items.forEach((it, idx) => {
      const key = getKey(idx);
      const propOpen =
        typeof it.open === "boolean" ? (it.open as boolean) : undefined;

      // record latest prop for compare next time
      const prev = nextPrev[key];
      nextPrev[key] = propOpen;

      if (propOpen !== undefined && prev !== undefined && prev !== propOpen) {
        // flip detected -> this item becomes auto-controlled
        nextAuto.add(key);
      }
    });

    prevPropOpenRef.current = nextPrev;
    autoControlledKeysRef.current = nextAuto;
    // NOTE: we do not mutate openItems here; visual state is derived on read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, getKey]);

  // Helper: compute the *visual* open state for a key right now
  const isOpenNow = (index: number): boolean => {
    const item = items[index];
    const key = getKey(index);

    // 1) forced (always open)
    if (forcedOpenSet.has(key)) return true;

    // 2) fully controlled via `activeKeys`
    if (fullyControlled) return activeKeysSet.has(key);

    // 3) auto-controlled (parent flips `open` prop)
    const propOpen =
      typeof item.open === "boolean" ? (item.open as boolean) : undefined;
    if (autoControlledKeysRef.current.has(key)) {
      return !!propOpen;
    }

    // 4) uncontrolled:
    //    prefer internal state if we have it; otherwise fall back to:
    //    defaultOpenKeys -> item.open -> false
    if (key in openItems) return !!openItems[key];
    if (defaultOpenSet.has(key)) return true;
    return !!propOpen;
  };

  // Toggle intent handler for header clicks
  const toggleItem = (index: number, e?: React.MouseEvent) => {
    const item = items[index];
    const key = getKey(index);
    const idForCallback = item.id ?? key;

    const currentlyOpen = isOpenNow(index);
    const willOpen = !currentlyOpen;

    // Early exit for "forced open" items when trying to close
    if (!willOpen && forcedOpenSet.has(key)) {
      item.onClick?.(e, idForCallback);
      // don't fire onClose for a forced-open panel
      return;
    }

    // Fire item-level click + open/close callbacks
    item.onClick?.(e, idForCallback);
    if (willOpen) item.onOpen?.(e, idForCallback);
    else item.onClose?.(e, idForCallback);

    // 1) Fully controlled via activeKeys -> emit change only
    if (fullyControlled) {
      if (!onActiveKeysChange) return;

      let next = new Set(activeKeysSet);
      if (allowMultiple) {
        if (willOpen) next.add(key);
        else next.delete(key);
      } else {
        if (willOpen) next = new Set([key]);
        else next = new Set(); // closing the only open item
      }

      // ensure forced keys are present
      forcedOpenSet.forEach((fk) => next.add(fk));
      onActiveKeysChange(Array.from(next));
      return;
    }

    // 2) Auto-controlled (parent manipulates `open` prop): don't mutate state
    if (autoControlledKeysRef.current.has(key)) {
      // parent must update `open` prop; we already fired callbacks
      return;
    }

    // 3) Uncontrolled: update internal map
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

  const updateHeight = useCallback(() => {
    if (contentRef.current) setMaxHeight(contentRef.current.scrollHeight);
  }, []);

  useEffect(() => {
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    if (contentRef.current) ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [updateHeight]);

  // Ensure height recalculates when open changes
  useEffect(() => {
    updateHeight();
  }, [open, updateHeight]);

  const handleHeaderClick = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    toggle(e);
  };

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
      >
        <AccordionContentInner ref={contentRef}>
          {children}
        </AccordionContentInner>
      </AccordionContentWrapper>
    </AccordionItemWrapper>
  );
};
