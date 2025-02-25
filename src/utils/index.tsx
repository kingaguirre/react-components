import React from 'react'

export const ifElse = <T,>(condition: boolean, trueValue: T, falseValue: T): T => {
  if (condition) {
    return trueValue
  }
  return falseValue
}

export const formatNumber = (input: string | number, decimals = 2) => {
  // Convert the input to a number (if it's a string)
  const num = typeof input === 'string' ? parseFloat(input) : input

  if (isNaN(num)) {
    throw new Error('Invalid number input')
  }

  // If it's an integer, simply return the localized string without decimals.
  if (num % 1 === 0) {
    return num.toLocaleString()
  }

  // For non-integer numbers, format using the given decimal places.
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export const countDigits = (value: string | number) => {
  // Convert to string.
  const strValue = value.toString()
  
  // Remove any negative sign and decimals (if you only care about the integer part).
  const cleanValue = strValue.replace('-', '').split('.')[0]
  
  return cleanValue.length
}

export function useOnClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T>,
  handler: (event: MouseEvent) => void
) {
  React.useEffect(() => {
    const listener = (event: MouseEvent) => {
      // Do nothing if clicking ref's element or its descendants.
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler(event)
    }
    document.addEventListener('mousedown', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
    }
  }, [ref, handler])
}
