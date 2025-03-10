import React from 'react'
import { IconContainer, FallbackBox } from './styled'
import { IconProps } from './interface'
import './font.css'
import { injectFontCSS } from './font'
import { EXTRA_ICONS, SCB_ICONS } from './data' // Import list of available icons

// ✅ Convert array to a Set for optimized lookup
const ICON_SET = new Set([...EXTRA_ICONS, ...SCB_ICONS])

export const Icon: React.FC<IconProps> = ({
  icon,
  size,
  color,
  disabled = false,
  className = '',
  onClick
}) => {
  const iconExists = ICON_SET.has(icon) // ✅ O(1) lookup time

  React.useEffect(() => {
    injectFontCSS();
  }, []);

  return iconExists ? (
    <IconContainer
      data-testid='icon'
      className={`icon icon-${icon} ${className} ${disabled ? 'icon-disabled' : ''}`.trim()}
      $size={size}
      $color={color}
      $disabled={disabled}
      aria-disabled={disabled}
      onClick={onClick}
    />
  ) : (
    <FallbackBox data-testid='icon' $size={size}>?</FallbackBox> // ✅ Show fallback if the icon is missing
  )
}
