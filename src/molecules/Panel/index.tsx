// src/components/Panel/index.tsx
import React from 'react'
import { PanelContainer, PanelHeader, PanelContent, IconWrapper, Text } from './styled'
import { PanelProps } from './interface'
import { Icon } from '../../atoms/Icon'

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
            <IconWrapper
              className='left-header-icon'
              onClick={!disabled && leftIcon.onClick ? leftIcon.onClick : undefined}
              $clickable={!disabled && !!leftIcon.onClick}
              title={leftIcon.title}
            >
              <Icon icon={leftIcon.icon} />
            </IconWrapper>
          )}
          <div className='title'>{title}</div>
          {rightIcons.length > 0 && (
            <div className='right-header-icons-container'>
              {rightIcons.map((icon) => (
                <IconWrapper
                  key={`key-${icon.icon}-${icon.color}`}
                  onClick={!disabled && icon.onClick ? icon.onClick : undefined}
                  $clickable={!disabled && !!icon.onClick}
                >
                  {icon.text && <Text>{icon.text}</Text>}
                  <Icon icon={icon.icon} />
                </IconWrapper>
              ))}
            </div>
          )}
        </PanelHeader>
      )}
      <PanelContent className='panel-content'>{children}</PanelContent>
    </PanelContainer>
  )
}
