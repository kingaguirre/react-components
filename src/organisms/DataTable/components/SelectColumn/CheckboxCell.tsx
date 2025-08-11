import React from "react";
import { FormControl } from "../../../../atoms/FormControl";

// IndeterminateCheckbox supporting an “indeterminate” state.
export const CheckboxCell = React.forwardRef<
  HTMLInputElement,
  {
    indeterminate?: boolean;
    text?: string;
    disabled?: boolean;
    type?: string;
    rowId?: string;
  } & React.InputHTMLAttributes<HTMLInputElement>
>(({ indeterminate, disabled, type = "checkbox", rowId, ...rest }, ref) => {
  const defaultRef = React.useRef<HTMLInputElement>(null);
  const resolvedRef = ref || defaultRef;

  React.useEffect(() => {
    if (
      resolvedRef &&
      typeof resolvedRef !== "function" &&
      resolvedRef.current
    ) {
      resolvedRef.current.indeterminate = indeterminate ?? false;
    }
  }, [resolvedRef, indeterminate]);

  return (
    <FormControl
      testId={`select-row-${rowId}`}
      simple
      type={type}
      disabled={disabled}
      ref={resolvedRef}
      {...rest}
    />
  );
});
