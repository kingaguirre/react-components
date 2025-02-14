import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AccordionProps, AccordionItemProps, AccordionItemDetail } from './interface';
import {
  AccordionContainer,
  AccordionItemWrapper,
  AccordionHeader,
  AccordionTitle,
  AccordionRightContent,
  AccordionContentWrapper,
  AccordionContentInner,
  AccordionDetailContainer,
} from './styled';
import Icon from '@atoms/Icon';
import Badge from '@atoms/Badge';

export const Accordion: React.FC<AccordionProps> = ({ items, allowMultiple = false }) => {
  // openItems maps each item index to its open state.
  const [openItems, setOpenItems] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    items.forEach((item, idx) => {
      // Use the new `open` prop instead of `defaultOpen`. Default to false.
      init[idx] = item.open ?? false;
    });
    return init;
  });

  const toggleItem = (index: number) => {
    setOpenItems((prev) => {
      const newState = { ...prev };
      if (allowMultiple) {
        newState[index] = !prev[index];
      } else {
        Object.keys(newState).forEach((key) => {
          newState[Number(key)] = false;
        });
        newState[index] = !prev[index];
      }
      return newState;
    });
  };

  return (
    <AccordionContainer>
      {items.map((item, idx) => (
        <AccordionItem
          key={`${item.id}-${idx}`}
          {...item} // Spread item props first
          open={!!openItems[idx]} // Then override open and toggle
          toggle={() => toggleItem(idx)}
        />
      ))}
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
  color = 'primary',
  rightContent,
  rightDetails,
  open,
  toggle,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(0);

  const updateHeight = useCallback(() => {
    if (contentRef.current) {
      setMaxHeight(contentRef.current.scrollHeight);
    }
  }, []);

  useEffect(() => {
    updateHeight();
    const ro = new ResizeObserver(() => {
      updateHeight();
    });
    if (contentRef.current) {
      ro.observe(contentRef.current);
    }
    return () => {
      ro.disconnect();
    };
  }, [updateHeight]);

  return (
    <AccordionItemWrapper className="accordion-item-wrapper">
      <AccordionHeader className="accordion-header" $open={open} $color={color} onClick={toggle}>
        <Icon icon={open ? 'remove' : 'add'} />
        <AccordionTitle className="accordion-title" $color={color}>{title}</AccordionTitle>
        {rightContent && <AccordionRightContent className="accordion-right-content">{rightContent}</AccordionRightContent>}
        {rightDetails?.map((detail: AccordionItemDetail, idx: number) => {
            // Only render if at least one property is defined.
            if (!detail.icon && !detail.value && !detail.text) return null;

            return (
              <AccordionDetailContainer
                key={`${detail?.icon}-${idx}`}
                className="accordion-detail-container"
                onClick={(e) => {
                  e.stopPropagation();
                  detail.onClick?.();
                }}
              >
                {detail.value && (
                  <Badge color={detail.valueColor ?? detail.color ?? color}>
                    {detail.value}
                  </Badge>
                )}
                {detail.icon && (
                  <Icon icon={detail.icon} color={detail.iconColor ?? detail.color ?? color} />
                )}
                {detail.text && (
                  <span style={{ color: detail.textColor ?? detail.color ?? color }}>
                    {detail.text}
                  </span>
                )}
              </AccordionDetailContainer>
            );
          })}
      </AccordionHeader>
      <AccordionContentWrapper className="accordion-content-wrapper" $expanded={open} $maxHeight={maxHeight}>
        <AccordionContentInner className="accordion-content-inner" ref={contentRef}>{children}</AccordionContentInner>
      </AccordionContentWrapper>
    </AccordionItemWrapper>
  );
};

export default Accordion;
