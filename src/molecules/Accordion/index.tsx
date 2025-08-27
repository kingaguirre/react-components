import React, { useState, useRef, useEffect, useCallback } from "react";
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
}) => {
  // stable key per item (id if provided, else index string)
  const getKey = useCallback(
    (idx: number) => String(items[idx]?.id ?? idx),
    [items],
  );

  // --- STATE MAPS ------------------------------------------------------------
  // open state we actually render
  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    items.forEach((it, idx) => {
      init[getKey(idx)] = !!it.open; // treat as initial
    });
    return init;
  });

  // which items are "controlled" (we discovered parent changes open over time)
  const [controlledKeys, setControlledKeys] = useState<Record<string, boolean>>(
    () => ({}),
  );

  // track previous prop "open" to detect parent-driven changes
  const prevPropOpen = useRef<Record<string, boolean | undefined>>({});

  // SYNC: detect if parent is controlling an item by changing its `open` prop.
  // - If we detect a change from previous `open`, mark as controlled and mirror it.
  // - If new items appear, initialize from their `open` as initial state (uncontrolled).
  useEffect(() => {
    setOpenItems((prev) => {
      const next = { ...prev };
      const nextControlled = { ...controlledKeys };
      const nextPrevPropOpen = { ...prevPropOpen.current };

      items.forEach((it, idx) => {
        const k = getKey(idx);
        const propOpen =
          typeof it.open === "boolean" ? (it.open as boolean) : undefined;

        if (!(k in next)) {
          // new item: initialize from prop once
          next[k] = !!propOpen;
        }

        // if parent provides an explicit boolean, check if it changed
        if (typeof propOpen === "boolean") {
          const prevVal = nextPrevPropOpen[k];
          // record the latest prop value for future diffs
          nextPrevPropOpen[k] = propOpen;

          // If parent changes it across renders, it's controlled; mirror it.
          if (prevVal !== undefined && prevVal !== propOpen) {
            nextControlled[k] = true;
            next[k] = propOpen;
          } else if (nextControlled[k]) {
            // already controlled — always mirror props
            next[k] = propOpen;
          }
        }
      });

      prevPropOpen.current = nextPrevPropOpen;
      setControlledKeys(nextControlled);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, getKey]);

  // toggle with event (works for both controlled/uncontrolled)
  const toggleItem = (index: number, e?: React.MouseEvent) => {
    const item = items[index];
    const key = getKey(index);
    const idForCallback = item.id ?? key;

    const isControlled = !!controlledKeys[key];

    if (isControlled) {
      // Controlled: do not mutate; just fire callbacks. Parent must flip `open`.
      item.onClick?.(e, idForCallback);
      if (!openItems[key]) item.onOpen?.(e, idForCallback);
      else item.onClose?.(e, idForCallback);
      return;
    }

    // Uncontrolled: manage internal state + callbacks
    setOpenItems((prev) => {
      const willOpen = !prev[key];
      const next = allowMultiple
        ? { ...prev }
        : Object.fromEntries(Object.keys(prev).map((k) => [k, false]));
      next[key] = willOpen;

      // Fire callbacks based on previous state
      item.onClick?.(e, idForCallback);
      if (willOpen) item.onOpen?.(e, idForCallback);
      else item.onClose?.(e, idForCallback);

      return next as Record<string, boolean>;
    });
  };

  return (
    <AccordionContainer>
      {items.map((item, idx) => {
        const key = getKey(idx);
        const isOpen = !!openItems[key];
        return (
          <AccordionItem
            key={key}
            {...item}
            open={isOpen}
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
  id,
  title,
  children,
  color = "primary",
  rightContent,
  rightDetails,
  open,
  toggle,
  disabled = false,
  onClick,
  onOpen,
  onClose,
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

  // callbacks order preserved:
  // 1) toggle (which decides controlled/uncontrolled path)
  // 2) onClick/onOpen/onClose are invoked inside toggle with correct previous state
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
