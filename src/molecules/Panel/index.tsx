// src/components/Panel/index.tsx
import React from 'react'
import { PanelContainer, PanelHeader, PanelContent, IconWrapper, Text } from './styled'
import { PanelProps, IconObject } from './interface'
import { Icon } from '../../atoms/Icon'
import { Tooltip } from '../../atoms/Tooltip'

export const Panel: React.FC<PanelProps> = ({
  title,
  children,
  leftIcon,
  rightIcons = [],
  color = 'primary',
  disabled = false,
}) => {
  const isHeadless = !title && !leftIcon && rightIcons.length === 0

  return (
    <PanelContainer $color={color} $disabled={disabled} className={`panel ${disabled ? 'panel-disabled' : ''}`.trim()}>
      {!isHeadless && (
        <PanelHeader
          className='panel-header'
          $color={color}
          $disabled={disabled}
          $hasLeftIcon={!!leftIcon}
          $hasRightIcons={rightIcons.length > 0}
        >
          {leftIcon && (
            <IconComponent
              disabled={disabled}
              icon={leftIcon}
            />
          )}
          <div className='title'>{title}</div>
          {rightIcons.length > 0 && (
            <div className='right-header-icons-container'>
              {rightIcons.map((icon) => (
                <IconComponent
                  key={`key-${icon.icon}-${icon.color}`}
                  disabled={disabled}
                  icon={icon}
                />
              ))}
            </div>
          )}
        </PanelHeader>
      )}
      <PanelContent className='panel-content'>{children}</PanelContent>
    </PanelContainer>
  )
}

interface IconComponentProps {
  disabled?: PanelProps["disabled"]
  icon: IconObject
}
const IconComponent = (props: IconComponentProps) => {
  const { icon, disabled } = props

  const iconDetails = (
    <IconWrapper
      onClick={!disabled && icon.onClick ? icon.onClick : undefined}
      $clickable={!disabled && !!icon.onClick}
    >
      {icon.text && <Text>{icon.text}</Text>}
      <Icon icon={icon.icon} />
    </IconWrapper>
  )

  return icon.tooltip ? (
    <Tooltip
      content={icon.tooltip}
      color={icon.tooltipColor}
      type={icon.tooltipType}
      placement={icon.tooltipPlacement}
    >{iconDetails}</Tooltip>

    ) : iconDetails
}