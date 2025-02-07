// src/atoms/Icon/index.tsx
import React from "react";
import { IconContainer } from "./styled";
import { IconProps } from "./interface";
import "../../styles/font.css";

export const Icon = ({
  icon,
  size,
  color,
  disabled = false,
  className = "",
}: IconProps) => {
  return (
    <IconContainer
      className={`icon-${icon} ${className} ${disabled ? "icon-disabled" : ""}`.trim()}
      $size={size}
      $color={color}
      $disabled={disabled}
      aria-disabled={disabled}
    />
  );
};

Icon.displayName = "Icon";

export default Icon;
