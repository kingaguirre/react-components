// src/atoms/Badge/index.tsx
import React from "react";
import { BadgeContainer } from "./styled";
import { BadgeProps } from "./interface";

export const Badge: React.FC<BadgeProps> = ({
  color = "primary",
  size = "md",
  borderRadius,
  disabled = false,
  width,
  outlined = false,
  children,
}) => {
  return (
    <BadgeContainer
      className="badge"
      $color={color}
      $size={size}
      $borderRadius={borderRadius}
      $disabled={disabled}
      $width={width}
      $outlined={outlined}
    >
      {children}
    </BadgeContainer>
  );
};

export default Badge;
