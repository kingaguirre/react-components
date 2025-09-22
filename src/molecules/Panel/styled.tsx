import styled from "styled-components";
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
`;

export const PanelHeader = styled.div<{
  $color: ColorType;
  $disabled: boolean;
  $hasLeftIcon: boolean;
  $hasRightIcons: boolean;
  $isSubHeader?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ $isSubHeader }) => ($isSubHeader ? "8px 12px" : "9px 12px")};
  height: ${({ $isSubHeader }) => ($isSubHeader ? "28px" : "30px")};
  box-sizing: border-box;
  letter-spacing: 0.5px;
  border-radius: 2px;

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
    cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "default")};
    padding-left: ${({ $hasLeftIcon }) => ($hasLeftIcon ? "8px" : "0")};
    padding-right: ${({ $hasRightIcons }) => ($hasRightIcons ? "8px" : "0")};
    font-size: 12px;
    text-transform: uppercase;
    font-weight: bold;
    line-height: 1;
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
  padding: ${({ $noPadding }) => !!$noPadding ? 0 : 12}px;
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

  /* Critical: bind to header color pipeline */
  color: var(--panel-header-fg, inherit);

  transition: all 0.3s ease;
  font-size: 16px;
  gap: 4px;

  /* make sure inner glyphs follow the wrapper color */
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
