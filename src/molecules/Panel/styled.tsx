// src/components/Panel/styled.tsx
import styled from "styled-components"
import { theme } from "../../styles/theme"
import { ColorType } from "../../common/interface"

export const PanelContainer = styled.div<{
  $color: ColorType
  $disabled: boolean
}>`
  background-color: white;
  border-radius: 2px;
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.16), 0 0 6px rgba(0, 0, 0, 0.08);
  /* opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)}; */
  pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};
  overflow: hidden;
  font-family: ${theme.fontFamily};
`

export const PanelHeader = styled.div<{
  $color: ColorType
  $disabled: boolean;
  $hasLeftIcon: boolean;
  $hasRightIcons: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* background-color: ${({ $color }) => theme.colors[$color].dark }; */
  padding: 10px 12px;
  height: 32px;
  box-sizing: border-box;
  
  background: ${({ $disabled, $color }) =>
    $disabled ? theme.colors[$color].pale : theme.colors[$color].base};
  * {
    box-sizing: border-box;
  }

  .title {
    flex: 1;
    text-align: left;
    /* color: white; */
    color: ${({ $disabled }) => $disabled ? theme.colors.default.dark : 'white'};
    cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'default')};
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
`

export const PanelContent = styled.div`
  padding: 12px;
  font-size: 14px;
  color: ${theme.colors.default.dark};
  p {
    margin: 0 0 1rem;
  }
`

export const IconWrapper = styled.div<{
  $clickable: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all .3s ease;
  font-size: 16px;
  gap: 4px;

  ${({ $clickable }) => ($clickable ? `
    cursor: pointer;

    &:hover {
      color: ${theme.colors.default.pale}
    }

    &:active {
      color: ${theme.colors.default.light}
    }
  ` : `
    cursor: default;
  `)};
`

export const Text = styled.div`
  font-size: 12px;
  color: inherit;
`