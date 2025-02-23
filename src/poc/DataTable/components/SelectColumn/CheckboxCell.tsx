import React from 'react'
import { FormControl } from '@atoms/FormControl'

// IndeterminateCheckbox supporting an “indeterminate” state.
export const CheckboxCell = React.forwardRef<
  HTMLInputElement, 
  { indeterminate?: boolean, text?: string } & React.InputHTMLAttributes<HTMLInputElement>
>(({ indeterminate, ...rest }, ref) => {
  const defaultRef = React.useRef<HTMLInputElement>(null)
  const resolvedRef = ref || defaultRef

  React.useEffect(() => {
    if (
      resolvedRef &&
      typeof resolvedRef !== 'function' &&
      resolvedRef.current
    ) {
      resolvedRef.current.indeterminate = indeterminate ?? false
    }
  }, [resolvedRef, indeterminate])

  return <FormControl simple type="checkbox" ref={resolvedRef} {...rest} />
});
