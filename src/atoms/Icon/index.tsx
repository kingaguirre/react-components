import React from "react";
import { IconContainer, FallbackBox } from "./styled";
import { IconProps } from "./interface";
import "../../styles/font.css";
import { ICONS } from "./data"; // Import list of available icons

// ✅ Convert array to a Set for optimized lookup
const ICON_SET = new Set(ICONS);

export const Icon = ({
  icon,
  size,
  color,
  disabled = false,
  className = "",
  ...rest
}: IconProps) => {
  const iconExists = ICON_SET.has(icon); // ✅ O(1) lookup time

  return iconExists ? (
    <IconContainer
      data-testid="icon"
      className={`icon icon-${icon} ${className} ${disabled ? "icon-disabled" : ""}`.trim()}
      $size={size}
      $color={color}
      $disabled={disabled}
      aria-disabled={disabled}
      {...rest}
    />
  ) : (
    <FallbackBox data-testid="icon" $size={size}>?</FallbackBox> // ✅ Show fallback if the icon is missing
  );
};

Icon.displayName = "Icon";

export default Icon;
