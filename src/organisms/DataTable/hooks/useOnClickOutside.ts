import React, { useEffect, useMemo } from 'react'

interface UseOnClickOutsideOptions {
  ignoreClassNames?: string | string[]
  delay?: number
}

export const useOnClickOutside = <T extends HTMLElement>(
  ref: React.RefObject<T>,
  handler: (event: MouseEvent) => void,
  options?: UseOnClickOutsideOptions
) => {
  const { delay = 0 } = options || {}

  // Memoize the ignored classes array to prevent unnecessary recalculations.
  const ignoredClasses = useMemo(() => {
    const classes = options?.ignoreClassNames
    if (!classes) return []
    return typeof classes === 'string' ? [classes] : classes
  }, [options?.ignoreClassNames])

  useEffect(() => {
    let timeoutId: number | null = null

    const listener = (event: MouseEvent) => {
      // Do nothing if clicking inside the ref element.
      if (ref.current && ref.current.contains(event.target as Node)) {
        return
      }

      // Traverse up the DOM tree to check if any element in the path has an ignored class.
      let el = event.target as HTMLElement | null
      while (el) {
        if (ignoredClasses.some(cls => el?.classList.contains(cls))) {
          return
        }
        el = el.parentElement
      }

      // Only use a timeout if a positive delay is provided.
      if (delay > 0) {
        timeoutId = window.setTimeout(() => {
          handler(event)
        }, delay)
      } else {
        handler(event)
      }
    }

    document.addEventListener('mousedown', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
    }
  }, [ref, handler, ignoredClasses, delay])
}
