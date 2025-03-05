// src/molecules/Alert/index.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react'
import ReactDOM from 'react-dom'
import {
  AlertWrapper,
  Title,
  Content,
  IconWrapper,
  CloseButton,
  ToastContainer,
  ToastOverlay,
} from './styled'
import { AlertProps } from './interface'
import { Icon } from '../../atoms/Icon'

const ANIMATION_DURATION = 300

export const Alert: React.FC<AlertProps> = ({
  color = 'primary',
  show = true,
  icon,
  title,
  children,
  toast = false,
  closeDelay = 3000,
  closeable = false,
  closeIcon = true, // Controls visibility of the clear icon
  placement = 'top-right',
  animation = 'grow',
  onClose,
  ...rest
}) => {
  // Determine if the alert is controlled (i.e. onClose provided)
  const isControlled = onClose !== undefined
  // internalShow controls whether the alert is rendered.
  const [internalShow, setInternalShow] = useState(show)
  // isExiting triggers the exit animation.
  const [isExiting, setIsExiting] = useState(false)

  // In controlled mode, update internalShow based on parent's `show`.
  // In uncontrolled mode, ignore changes to `show` after initialization.
  useEffect(() => {
    if (isControlled) {
      if (show) {
        setInternalShow(true)
        setIsExiting(false)
      } else if (internalShow && !isExiting) {
        setIsExiting(true)
        const timer = setTimeout(() => {
          setInternalShow(false)
          // No need to reset isExiting here since the alert will unmount
        }, ANIMATION_DURATION)
        return () => clearTimeout(timer)
      }
    }
  }, [show, internalShow, isControlled, isExiting])

  // Auto-close timer for toast mode (only enabled when closeable is false).
  const timerRef = useRef<number | null>(null)
  const timerStartRef = useRef<number>(0)
  const timerRemainingRef = useRef<number>(closeDelay)
  const renderOverlay = toast && !closeable

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const startTimer = useCallback((delay: number) => {
    timerStartRef.current = Date.now()
    clearTimer()
    timerRef.current = window.setTimeout(() => {
      handleClose()
    }, delay)
  }, [])

  useEffect(() => {
    if (toast && show && !closeable && !timerRef.current) {
      timerRemainingRef.current = closeDelay
      startTimer(closeDelay)
    }
    return () => {
      clearTimer()
    }
  }, [toast, show, closeable, startTimer, closeDelay])

  const handleMouseEnter = () => {
    if (toast && !closeable && timerRef.current) {
      const elapsed = Date.now() - timerStartRef.current
      timerRemainingRef.current = Math.max(closeDelay - elapsed, 0)
      clearTimer()
    }
  }

  const handleMouseLeave = () => {
    if (toast && !closeable && timerRemainingRef.current > 0 && !timerRef.current) {
      startTimer(timerRemainingRef.current)
    }
  }

  // When a close action is triggered (via clear icon, overlay click, or auto‑close),
  // force the alert to exit. In controlled mode, call onClose so the parent updates `show`
  // in uncontrolled mode, update our internal state.
  const handleClose = useCallback(() => {
    if (isExiting) return
    setIsExiting(true)
    setTimeout(() => {
      setInternalShow(false)
    }, ANIMATION_DURATION)
    if (onClose) {
      onClose()
    }
  }, [isExiting, onClose])

  // Overlay click triggers close only when auto‑close is active.
  const handleOverlayClick = () => {
    if (!closeable) {
      handleClose()
    }
  }

  if (!internalShow) return null

  const alertContent = (
    <AlertWrapper
      $color={color}
      $animation={toast ? animation : 'fade'}
      className={isExiting ? 'closing' : ''}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {icon && (
        <IconWrapper $color={color}>
          <Icon icon={icon} />
        </IconWrapper>
      )}
      <div style={{ flex: 1 }}>
        {title && <Title $color={color}>{title}</Title>}
        <Content>{children}</Content>
      </div>
      {closeIcon && (
        <CloseButton onClick={handleClose} aria-label='Close Alert'>
          <Icon icon='clear' />
        </CloseButton>
      )}
    </AlertWrapper>
  )

  if (toast) {
    return ReactDOM.createPortal(
      <>
        {renderOverlay && <ToastOverlay onClick={handleOverlayClick} />}
        <ToastContainer $placement={placement}>{alertContent}</ToastContainer>
      </>,
      document.body
    )
  }

  return alertContent
}
