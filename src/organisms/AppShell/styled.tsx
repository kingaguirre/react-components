import { ColorType } from 'src/common/interface'
import { scrollStyle, theme } from 'src/styles'
import styled, { keyframes } from 'styled-components'

/* Animations */
const slideInFromLeft = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`

const slideOutToLeft = keyframes`
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-100%); opacity: 0; }
`

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
  min-width: 768px; // min-width for tablet portrait
  box-sizing: border-box;
  background-color: #e1e1e1;
  overflow: hidden;
  * { box-sizing: border-box; }
`

export const Header = styled.header`
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background-color: white;
  height: 32px;
  box-shadow: 0 3px 6px 0 rgba(130, 149, 157, 0.2);
  &:before {
    content: '';
    height: 2px;
    width: 100%;
    bottom: 0;
    z-index: 1000;
    position: absolute;
    background-color: ${theme.colors.primary.dark};
  }
`

export const LeftSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

export const RightSection = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  z-index: 0;
  height: 16px;
  font-size: 10px;
`

export const HeaderWrapper = styled.div<{ $headerHidden: boolean }>`
  height: 32px;
  overflow: visible;
  margin-top: ${({ $headerHidden }) =>
    $headerHidden ? '-30px' : 0};
  transition: margin-top 0.3s ease;
`

export const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
  position: relative;
  overflow: hidden;
`

export const MainContent = styled.main`
  flex: 1;
  padding: 16px;
  overflow: auto;
  background-color: #e1e1e1;
  ${scrollStyle}
`

export const IconButton = styled.button<{ $leftDivider?: boolean, $color?: ColorType, $colorShade?: string }>`
  display: flex;
  align-self: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  height: 14px;
  font-size: 16px;
  opacity: 0.8;
  transition: all .3s ease;
  padding: 0;
  padding-right: 12px;
  &:hover {
    opacity: 1;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
  /* If $leftDivider is true, add a left border and some left padding */
  ${({ $leftDivider }) => $leftDivider && `
    border-left: 1px solid ${theme.colors.default.light};
    padding-left: 12px;
  `}
  > span {
    color: ${({ $color = 'default', $colorShade = 'base' }) => theme.colors[$color]?.[$colorShade]};
    &.text {
      margin-right: 4px;
      font-size: 12px;
    }
  }
`;

export const PageName = styled.div`
  font-size: 12px;
  margin: 0;
  padding: 4px 16px;
  color: ${theme.colors.primary.darker};
`

export const SideMenuContainer = styled.aside<{
  $collapsed: boolean;
  $overlay?: boolean;
  $visible: boolean;
}>`
  width: ${({ $collapsed }) => ($collapsed ? '50px' : '170px')};
  height: 100%;
  background-color: ${theme.colors.primary.darker};
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: visible;
  position: ${({ $overlay }) => ($overlay ? 'absolute' : 'relative')};
  top: 0;
  left: 0;
  z-index: ${({ $overlay }) => ($overlay ? '101' : '1')};
  animation: ${({ $visible }) => ($visible ? slideInFromLeft : slideOutToLeft)} 0.3s ease forwards;
`

export const CollapseToggleContainer = styled.div`
  margin-top: auto;
  padding: 0.5rem;
  text-align: center;
  cursor: pointer;
  color: white;
`

/* New styled components for animated logo transition */
export const AnimatedIconWrapper = styled.div<{ $show: boolean }>`
  position: relative;
  width: ${({ $show }) => ($show ? 140 : 38)}px;
  height: 30px;
  background-color: ${theme.colors.primary.darker};
  color: white;
  transition: all .3s ease;
  overflow: hidden;
  cursor: pointer;
`

export const AnimatedIcon = styled.div<{ $show: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  transition: opacity 0.3s ease, transform 0.3s ease;
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  transform-origin: left center;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    height: 16px;
  }
`
