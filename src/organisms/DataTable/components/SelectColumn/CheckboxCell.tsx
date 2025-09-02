import React, { useEffect, useRef, forwardRef, memo } from "react";
import { FormControl } from "../../../../atoms/FormControl";

// IndeterminateCheckbox supporting an “indeterminate” state.
export const CheckboxCell = memo(
  forwardRef<
    HTMLInputElement,
    {
      indeterminate?: boolean;
      text?: string;
      disabled?: boolean;
      type?: string;
      rowId?: string;
    } & React.InputHTMLAttributes<HTMLInputElement>
  >(({ indeterminate, disabled, type = "checkbox", rowId, ...rest }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null);

    // allow external refs
    useEffect(() => {
      if (!ref) return;
      if (typeof ref === "function") {
        ref(innerRef.current);
      } else {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current =
          innerRef.current;
      }
    }, [ref]);

    useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = Boolean(indeterminate);
      }
    }, [indeterminate]);

    return (
      <FormControl
        testId={`select-row-${rowId}`}
        simple
        type={type}
        disabled={disabled}
        ref={innerRef}
        {...rest}
      />
    );
  }),
);
