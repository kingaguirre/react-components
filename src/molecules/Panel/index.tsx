// src/components/Panel/index.tsx
import React from "react";
import {
  PanelContainer,
  PanelHeader,
  PanelContent,
  IconWrapper,
  Text,
  PanelSideGroup,
  PanelDetailContainer,
  PanelRightContent,
  PanelLeftContent,
} from "./styled";
import { PanelProps, IconObject } from "./interface";
import type { AccordionItemDetail } from "../../molecules/Accordion/interface";
import { Icon } from "../../atoms/Icon";
import { Tooltip } from "../../atoms/Tooltip";
import { Badge } from "../../atoms/Badge";

export const Panel: React.FC<PanelProps> = ({
  title,
  children,
  leftIcon,
  rightIcons = [],
  color = "primary",
  disabled = false,
  isSubHeader = false,
  hideShadow = false,
  noPadding = false,
  className = "",

  leftContent,
  rightContent,
  leftDetails = [],
  rightDetails = [],
  onHeaderClick,
}) => {
  const hasAnyHeaderAffordance =
    !!title ||
    !!leftIcon ||
    rightIcons.length > 0 ||
    !!leftContent ||
    !!rightContent ||
    (leftDetails?.length ?? 0) > 0 ||
    (rightDetails?.length ?? 0) > 0;

  return (
    <PanelContainer
      $color={color}
      $disabled={disabled}
      $hideShadow={hideShadow}
      className={`panel ${className} ${disabled ? "panel-disabled" : ""} ${
        isSubHeader ? "is-sub-header" : ""
      }`.trim()}
    >
      {hasAnyHeaderAffordance && (
        <PanelHeader
          className="panel-header"
          $color={color}
          $disabled={disabled}
          $hasLeftIcon={!!leftIcon}
          $hasRightIcons={rightIcons.length > 0}
          $isSubHeader={isSubHeader}
          $hasOnClick={!!onHeaderClick}
          {...(!!onHeaderClick ? { onClick: onHeaderClick } : {})}
        >
          {/* LEFT side: icon (legacy), leftContent, leftDetails */}
          {(leftIcon || leftContent || leftDetails.length > 0) && (
            <PanelSideGroup className="panel-left-side">
              {leftIcon && (
                <IconComponent disabled={disabled} icon={leftIcon} />
              )}

              {leftContent && (
                <PanelLeftContent aria-hidden={disabled ? true : undefined}>
                  {leftContent}
                </PanelLeftContent>
              )}

              {leftDetails?.map((d, i) => (
                <DetailComponent
                  key={`ld-${i}`}
                  disabled={disabled}
                  detail={d}
                  isSubHeader={isSubHeader}
                />
              ))}
            </PanelSideGroup>
          )}

          {/* Title */}
          {title && <div className="title">{title}</div>}

          {/* RIGHT side: rightContent, rightDetails, rightIcons (legacy) */}
          {(rightContent || rightDetails || rightIcons.length > 0) && (
            <PanelSideGroup className="panel-right-side">
              {rightContent && (
                <PanelRightContent aria-hidden={disabled ? true : undefined}>
                  {rightContent}
                </PanelRightContent>
              )}

              {rightDetails?.map((d, i) => (
                <DetailComponent
                  key={`rd-${i}`}
                  disabled={disabled}
                  detail={d}
                  align="right"
                  isSubHeader={isSubHeader}
                />
              ))}

              {rightIcons.length > 0 && (
                <div className="right-header-icons-container">
                  {rightIcons.map((icon, idx) => (
                    <IconComponent
                      key={`key-${idx}`}
                      disabled={disabled}
                      icon={icon}
                    />
                  ))}
                </div>
              )}
            </PanelSideGroup>
          )}
        </PanelHeader>
      )}

      <PanelContent className="panel-content" $noPadding={noPadding}>
        {children}
      </PanelContent>
    </PanelContainer>
  );
};

interface IconComponentProps {
  disabled?: PanelProps["disabled"];
  icon: IconObject;
}
const IconComponent = ({ icon, disabled }: IconComponentProps) => {
  const iconDetails = (
    <IconWrapper
      onClick={!disabled && icon.onClick ? icon.onClick : undefined}
      $clickable={!disabled && !!icon.onClick}
    >
      {icon.text && <Text>{icon.text}</Text>}
      <Icon icon={icon.icon} />
    </IconWrapper>
  );

  return icon.tooltip ? (
    <Tooltip
      content={icon.tooltip}
      color={icon.tooltipColor}
      type={icon.tooltipType}
      placement={icon.tooltipPlacement}
    >
      {iconDetails}
    </Tooltip>
  ) : (
    iconDetails
  );
};

const DetailComponent: React.FC<{
  disabled?: boolean;
  detail: AccordionItemDetail;
  align?: "left" | "right";
  isSubHeader: boolean;
}> = ({ disabled, detail, align = "left", isSubHeader }) => {
  const content = (
    <PanelDetailContainer
      className="panel-detail"
      $disabled={!!disabled}
      $align={align}
      onClick={(e) => {
        if (disabled) return;
        e.stopPropagation();
        detail.onClick?.();
      }}
    >
      {/* Badge value (uses your Badge atom + color palette) */}
      {detail.value != null && (
        <Badge
          outlined={isSubHeader}
          color={detail.valueColor ?? detail.color ?? "primary"}
        >
          {detail.value}
        </Badge>
      )}

      {/* Optional icon */}
      {detail.icon && (
        <Icon icon={detail.icon} color={detail.iconColor ?? detail.color} />
      )}

      {/* Optional text */}
      {detail.text && <span className="detail-text">{detail.text}</span>}
    </PanelDetailContainer>
  );

  return content;
};
