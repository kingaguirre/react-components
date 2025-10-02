// src/components/Panel/styled.ts
import styled, { css } from "styled-components";
import { theme } from "../../styles/theme";
import { ColorType } from "../../common/interface";

export const PanelContainer = styled.div<{
  $color: ColorType;
  $disabled: boolean;
  $hideShadow?: boolean;
}>`
  background-color: white;
  border-radius: 2px;
  box-shadow: ${({ $hideShadow = false }) =>
    !$hideShadow
      ? `0px 8px 16px rgba(0, 0, 0, 0.16), 0 0 6px rgba(0, 0, 0, 0.08)`
      : "none"};
  pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};
  font-family: ${theme.fontFamily};
  box-sizing: border-box;

  * {
    box-sizing: border-box;
  }
`;

export const PanelHeader = styled.div<{
  $color: ColorType;
  $disabled: boolean;
  $hasRightIcons: boolean;
  $isSubHeader?: boolean;
  $hasOnClick?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ $isSubHeader }) => ($isSubHeader ? "8px 12px" : "9px 12px")};
  height: ${({ $isSubHeader }) => ($isSubHeader ? "28px" : "30px")};
  box-sizing: border-box;
  letter-spacing: 0.5px;
  border-radius: 2px;
  gap: 8px;

  ${({ $hasOnClick }) =>
    !!$hasOnClick
      ? css`
          cursor: pointer;
        `
      : ""}

  ${({ $color, $disabled, $isSubHeader }) => {
    const normalBg = $disabled
      ? theme.colors[$color].pale
      : theme.colors[$color].dark;

    const subHeaderBg = theme.colors.lightA;
    const bg = $isSubHeader ? subHeaderBg : normalBg;

    const fg = $isSubHeader
      ? normalBg
      : $disabled
        ? theme.colors.default.base
        : "white";

    const borderLeft = $isSubHeader ? `2px solid ${normalBg}` : "none";

    return `
      background: ${bg};
      color: ${fg};
      border-left: ${borderLeft};
      --panel-header-fg: ${fg};
    `;
  }}

  * {
    box-sizing: border-box;
  }

  .title {
    flex: 1;
    text-align: left;
    color: inherit;
    cursor: ${({ $disabled, $hasOnClick }) =>
      $disabled ? "not-allowed" : $hasOnClick ? "pointer" : "default"};
    padding-right: ${({ $hasRightIcons }) => ($hasRightIcons ? "8px" : "0")};
    font-size: 12px;
    text-transform: uppercase;
    font-weight: bold;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .right-header-icons-container {
    display: flex;
    gap: 8px;
  }

  .tooltip-container {
    display: block;
    line-height: 1;
  }

  .panel &,
  & {
    svg,
    i,
    path,
    span {
      color: inherit;
      fill: currentColor;
      stroke: currentColor;
    }
  }
`;

export const PanelContent = styled.div<{ $noPadding?: boolean }>`
  padding: ${({ $noPadding }) => (!!$noPadding ? 0 : 12)}px;
  font-size: 14px;
  color: ${theme.colors.default.dark};
  p {
    margin: 0 0 1rem;
  }
`;

export const IconWrapper = styled.div<{ $clickable: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--panel-header-fg, inherit);
  transition: all 0.3s ease;
  font-size: 16px;
  gap: 4px;

  svg,
  i,
  path,
  span {
    color: inherit;
    fill: currentColor;
    stroke: currentColor;
  }

  ${({ $clickable }) =>
    $clickable
      ? `
        cursor: pointer;
        &:hover { opacity: 0.9; }
        &:active { opacity: 0.8; }
      `
      : `cursor: default;`};
`;

export const Text = styled.div`
  font-size: 12px;
  color: inherit;
`;

/* NEW: header side groups + detail container + custom content wrappers */
export const PanelSideGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: inherit;
`;

export const PanelLeftContent = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: inherit;

  & > * {
    color: inherit;
  }
`;

export const PanelRightContent = styled(PanelLeftContent)`
  margin-left: auto;
`;

export const PanelDetailContainer = styled.div<{
  $disabled?: boolean;
  $align?: "left" | "right";
}>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
  margin: -2px 0;
  font-size: inherit;
  color: inherit;

  .badge {
    /* keep badge readable on dark headers */
    box-shadow: 0 0 2px 1px rgba(255, 255, 255, 0.5);
    color: white;
  }

  &:hover {
    ${({ $disabled }) => ($disabled ? "" : "opacity: 0.95;")}
  }
`;
