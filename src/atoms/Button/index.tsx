import React from "react";
import { ButtonContainer } from "./styled";
import { ButtonProps } from "./interface";

export const Button: React.FC<ButtonProps> = ({
  children,
  color = "primary",
  variant = "default",
  size = "md",
  rounded = false,
  fullWidth = false,
  disabled = false,
  className = "",
  active = undefined,
  ...rest
}) => (
  <ButtonContainer
    {...rest}
    data-color={color}
    data-variant={variant}
    data-size={size}
    data-rounded={rounded}
    data-fullwidth={fullWidth}
    $color={color}
    $variant={variant}
    $size={size}
    $rounded={rounded}
    $fullWidth={fullWidth}
    disabled={disabled}
    role="button"
    className={`button ${className} ${disabled ? "disabled" : ""} ${active ? "active" : ""}`.trim()}
  >
    <span>{children}</span>
  </ButtonContainer>
);
