// index.tsx
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
  // use stable key per item (id if provided, else index string)
  const getKey = useCallback((idx: number) => String(items[idx]?.id ?? idx), [items]);

  // open state keyed by item key
  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    items.forEach((it, idx) => {
      init[getKey(idx)] = !!it.open; // initial value from props
    });
    return init;
  });

  // SYNC: if parent passes item.open, mirror it into internal state
  useEffect(() => {
    setOpenItems(prev => {
      const next = { ...prev };
      items.forEach((it, idx) => {
        const k = getKey(idx);
        if (typeof it.open === "boolean") next[k] = it.open;   // controlled
        else if (!(k in next)) next[k] = false;                // ensure key exists
      });
      return next;
    });
  }, [items, getKey]);

   const toggleItem = (index: number) => {
    const item = items[index];
    const key = getKey(index);

    // If this item is controlled (item.open provided), don't mutate internal state.
    // Fire callbacks and let the parent flip item.open.
    if (typeof item.open === "boolean") {
      item.onClick?.();
      if (!openItems[key]) item.onOpen?.();
      else item.onClose?.();
      return;
    }

    // Uncontrolled: manage internal state
    setOpenItems(prev => {
      const next = allowMultiple ? { ...prev } : Object.fromEntries(Object.keys(prev).map(k => [k, false]));
      next[key] = !prev[key];
      return next;
    });
  };

  return (
    <AccordionContainer>
      {items.map((item, idx) => {
        const key = getKey(idx);
        const isOpen = typeof item.open === "boolean" ? item.open : !!openItems[key];
        return (
          <AccordionItem
            key={key}
            {...item}
            open={isOpen}
            toggle={() => toggleItem(idx)}
          />
        );
      })}
    </AccordionContainer>
  );
};

interface AccordionItemInternalProps extends AccordionItemProps {
  open: boolean;
  toggle: () => void;
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

  // Ensure height recalculates when open changes (some CSS setups need this)
  useEffect(() => {
    updateHeight();
  }, [open, updateHeight]);

  // fire all callbacks in the right order
  const handleHeaderClick = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    toggle();
    onClick?.();
    if (!open) onOpen?.();
    else onClose?.();
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
