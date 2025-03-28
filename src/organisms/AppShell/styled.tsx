import styled, { keyframes } from 'styled-components';

/* Animations */
const slideInFromLeft = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const slideOutToLeft = keyframes`
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-100%); opacity: 0; }
`;

const itemSlideIn = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const floatSlideInFromTop = keyframes`
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
  * { box-sizing: inherit; }
`;

export const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
`;

export const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  img {
    height: 30px;
  }
`;

export const RightSection = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  gap: 0.5rem;
`;

export const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
  height: calc(100vh - 120px);
  position: relative;
  overflow: hidden;
`;

export const MainContent = styled.main`
  flex: 1;
  padding: 1rem;
  background-color: #fff;
`;

export const Footer = styled.footer<{ $alignment?: 'left' | 'center' | 'right' }>`
  padding: 1rem;
  text-align: ${({ $alignment }) => $alignment || 'left'};
  background-color: #f5f5f5;
  border-top: 1px solid #ddd;
`;

export const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
`;

export const Title = styled.h1`
  font-size: 1.2rem;
  margin: 0;
  color: black;
`;

export const Name = styled.span`
  font-size: 1rem;
  margin-right: 0.5rem;
  color: black;
`;

export const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: #fff;
  border: 1px solid #ddd;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
  z-index: 1000;
`;

export const DropdownItem = styled.div`
  padding: 0.5rem 1rem;
  cursor: pointer;
  &:hover {
    background-color: #f0f0f0;
  }
`;

export const SideMenuContainer = styled.aside<{
  $collapsed: boolean;
  $overlay?: boolean;
  $visible: boolean;
}>`
  width: ${({ $collapsed }) => ($collapsed ? '60px' : '200px')};
  height: 100%;
  background-color: #2c3e50;
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
`;

export const SideMenuList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 4px 0 0 0;
  max-width: 100%;
  width: 100%;
`;

export const SideMenuItemContainer = styled.li<{
  $active?: boolean;
  $sideMenuCollapsed?: boolean;
  $animate?: boolean;
}>`
  min-height: 40px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 0 1rem;
  cursor: pointer;
  position: relative;
  color: white;
  opacity: 0;
  background-color: ${({ $active }) => ($active ? '#1abc9c' : 'transparent')};
  animation: ${itemSlideIn} 0.3s ease forwards;
  ${({ $sideMenuCollapsed }) => !$sideMenuCollapsed ? `
    * {
      padding-right: 0;
    }
  ` : ''}
  &:hover {
    background-color: #34495e;
  }
`;

export const CollapseToggleContainer = styled.div`
  margin-top: auto;
  padding: 0.5rem;
  text-align: center;
  cursor: pointer;
  color: white;
`;

export const FloatingSubMenu = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  position: absolute;
  top: 0;
  left: 100%;
  background-color: #2c3e50;
  min-width: 200px;
  border: 1px solid #34495e;
  z-index: 101;
  width: 100%;
  animation: ${floatSlideInFromTop} 0.3s ease forwards;
`;

export const MenuItemContent = styled.div`
  display: flex;
  align-items: center;
  color: white;
  height: 40px;
  max-width: 100%;
  width: 100%;
`;

export const MenuItemTitle = styled.span`
  margin-left: 8px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: white;
`;

export const ArrowIconWrapper = styled.div`
  margin-left: auto;
  color: white;
  pointer-events: none;
`;

export const FloatingHeader = styled.div`
  padding: 0.5rem;
  border-bottom: 1px solid #34495e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: white;
  background-color: #2c3e50;
`;

/* New styled components for animated logo transition */
export const AnimatedIconWrapper = styled.div`
  position: relative;
  width: 40px;
  height: 40px;
`;

export const AnimatedIcon = styled.div<{ $show: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  transform: scale(${({ $show }) => ($show ? 1 : 0.8)});
`;
