// src/components/Panel/index.tsx
import React from "react";
import { PanelContainer, PanelHeader, PanelContent, IconWrapper } from "./styled";
import { PanelProps } from "./interface";
import Icon from "@atoms/Icon";

export const Panel: React.FC<PanelProps> = ({
  title,
  children,
  leftIcon,
  rightIcons = [],
  color = "primary",
  disabled = false,
}) => {
  const isHeadless = !title && !leftIcon && rightIcons.length === 0;

  return (
    <PanelContainer $color={color} $disabled={disabled} className={`panel ${disabled ? 'panel-disabled' : ''}`.trim()}>
      {!isHeadless && (
        <PanelHeader
          className="panel-header"
          $color={color}
          $disabled={disabled}
          $hasLeftIcon={!!leftIcon}
          $hasRightIcons={rightIcons.length > 0}
        >
          {leftIcon && (
            <IconWrapper
              className="left-header-icon"
              onClick={!disabled && leftIcon.onClick ? leftIcon.onClick : undefined}
              $color="white"
              $clickable={!disabled && !!leftIcon.onClick}
            >
              <Icon icon={leftIcon.icon} />
            </IconWrapper>
          )}
          <div className="title">{title}</div>
          {rightIcons.length > 0 && (
            <div className="right-header-icons-container">
              {rightIcons.map((icon, index) => (
                <IconWrapper
                  key={index}
                  onClick={!disabled && icon.onClick ? icon.onClick : undefined}
                  $color="white"
                  $clickable={!disabled && !!icon.onClick}
                >
                  <Icon icon={icon.icon} />
                </IconWrapper>
              ))}
            </div>
          )}
        </PanelHeader>
      )}
      <PanelContent className="panel-content">{children}</PanelContent>
    </PanelContainer>
  );
};

export default Panel;
