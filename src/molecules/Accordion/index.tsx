// index.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { AccordionProps, AccordionItemProps, AccordionItemDetail } from './interface'
import {
  AccordionContainer,
  AccordionItemWrapper,
  AccordionHeader,
  AccordionTitle,
  AccordionRightContent,
  AccordionContentWrapper,
  AccordionContentInner,
  AccordionDetailContainer,
} from './styled'
import { Icon } from '../../atoms/Icon'
import { Badge } from '../../atoms/Badge'

export const Accordion: React.FC<AccordionProps> = ({ items, allowMultiple = false }) => {
  const [openItems, setOpenItems] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {}
    items.forEach((item, idx) => {
      init[idx] = item.open ?? false
    })
    return init
  })

  const toggleItem = (index: number) => {
    setOpenItems(prev => {
      const next = { ...prev }
      if (allowMultiple) {
        next[index] = !prev[index]
      } else {
        Object.keys(next).forEach(k => (next[+k] = false))
        next[index] = !prev[index]
      }
      return next
    })
  }

  return (
    <AccordionContainer>
      {items.map((item, idx) => (
        <AccordionItem
          key={`${item.id ?? idx}-${idx}`}
          {...item}
          open={!!openItems[idx]}
          toggle={() => toggleItem(idx)}
        />
      ))}
    </AccordionContainer>
  )
}

interface AccordionItemInternalProps extends AccordionItemProps {
  open: boolean
  toggle: () => void
}

const AccordionItem: React.FC<AccordionItemInternalProps> = ({
  title,
  children,
  color = 'primary',
  rightContent,
  rightDetails,
  open,
  toggle,
  disabled = false,
  onClick,
  onOpen,
  onClose,
}) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const [maxHeight, setMaxHeight] = useState(0)

  const updateHeight = useCallback(() => {
    if (contentRef.current) {
      setMaxHeight(contentRef.current.scrollHeight)
    }
  }, [])

  useEffect(() => {
    updateHeight()
    const ro = new ResizeObserver(updateHeight)
    if (contentRef.current) ro.observe(contentRef.current)
    return () => ro.disconnect()
  }, [updateHeight])

  // fire all callbacks in the right order
  const handleHeaderClick = (e: React.MouseEvent) => {
    if (disabled) return
    e.stopPropagation()
    toggle()
    onClick?.()
    if (!open) {
      onOpen?.()
    } else {
      onClose?.()
    }
  }

  return (
    <AccordionItemWrapper tabIndex={disabled ? undefined : 0} $color={color} $disabled={disabled}>
      <AccordionHeader className='accordion-header' $open={open} $color={color} $disabled={disabled} onClick={handleHeaderClick}>
        <Icon icon={open ? 'remove' : 'add'} />
        <AccordionTitle className='accordion-title' $disabled={disabled}>{title}</AccordionTitle>

        {rightContent && (
          <AccordionRightContent className='accordion-right-content' $disabled={disabled}>{rightContent}</AccordionRightContent>
        )}

        {rightDetails?.map((detail: AccordionItemDetail, i: number) => {
          if (!detail.icon && !detail.text && detail.value == null) return null
          return (
            <AccordionDetailContainer
              className='accordion-detail'
              $disabled={disabled}
              key={i}
              onClick={e => {
                e.stopPropagation()
                detail.onClick?.()
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
                <span style={{ color: detail.textColor ?? detail.color ?? color }}>
                  {detail.text}
                </span>
              )}
            </AccordionDetailContainer>
          )
        })}
      </AccordionHeader>

      <AccordionContentWrapper className='accordion-body' $color={color} $expanded={open} $maxHeight={maxHeight}>
        <AccordionContentInner ref={contentRef}>{children}</AccordionContentInner>
      </AccordionContentWrapper>
    </AccordionItemWrapper>
  )
}
