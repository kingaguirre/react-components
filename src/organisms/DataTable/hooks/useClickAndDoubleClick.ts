import { useRef, useEffect, MouseEvent } from 'react'

interface ClickHandlers {
  onClick: (e: MouseEvent<HTMLElement>) => void
  onDoubleClick?: (e: MouseEvent<HTMLElement>) => void
}

interface UseClickAndDoubleClickOptions {
  onClick?: (e: MouseEvent<HTMLElement>) => void
  onDoubleClick?: (e: MouseEvent<HTMLElement>) => void
  delay?: number // delay in ms to differentiate single vs double click
}

export const useClickAndDoubleClick =({
  onClick,
  onDoubleClick,
  delay = 150,
}: UseClickAndDoubleClickOptions): ClickHandlers => {
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    // cleanup in case the component unmounts before timer fires
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if (onDoubleClick) {
      // if double-click handler exists, delay click action
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        onClick && onClick(e)
        timerRef.current = null
      }, delay)
    } else {
      // if no double-click handler, execute click immediately
      onClick && onClick(e)
    }
  }

  const handleDoubleClick = (e: MouseEvent<HTMLElement>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    onDoubleClick && onDoubleClick(e)
  }

  // if a double-click handler is provided, return both handlers.
  // Otherwise, just return the click handler.
  return onDoubleClick
    ? { onClick: handleClick, onDoubleClick: handleDoubleClick }
    : { onClick: onClick! }
}
