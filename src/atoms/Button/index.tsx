import React, { forwardRef } from "react";
import { ButtonContainer } from "./styled";
import { ButtonProps } from "./interface";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      color = "primary",
      variant = "default",
      size = "md",
      rounded = false,
      fullWidth = false,
      disabled = false,
      className = "",
      ...rest
    },
    ref
  ) => {
    return (
      <ButtonContainer
        $color={color}
        $variant={variant}
        $size={size}
        $rounded={rounded}
        $fullWidth={fullWidth}
        disabled={disabled}
        className={`button ${className} ${disabled ? "button-disabled" : ""}`.trim()}
        ref={ref}
        {...rest}
      >
        <span>{children}</span>
      </ButtonContainer>
    );
  }
);

Button.displayName = "Button";

export default Button;