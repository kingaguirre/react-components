import styled, { keyframes } from "styled-components";
import { theme } from "src/styles";

const itemSlideIn = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

export const SideMenuItemContainer = styled.li<{
  $sideMenuCollapsed?: boolean;
  $active?: boolean;
}>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  cursor: pointer;
  position: relative;
  color: white;
  opacity: 0;
  animation: ${itemSlideIn} 0.3s ease forwards;
`;

export const MenuItemContent = styled.div`
  display: flex;
  align-items: center;
  color: white;
  max-width: 100%;
  width: 100%;
`;

export const MenuItemTitle = styled.div<{
  $hasChild?: boolean;
  $menuCollapsed?: boolean;
}>`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: white;
  font-size: 14px;
  text-transform: capitalize;
  display: flex;
  justify-content: space-between;
  ${({ $hasChild }) => ($hasChild ? "padding-right: 14px;" : "")}
  > div {
    overflow: hidden;
    text-overflow: ellipsis;
    color: white;
    font-size: 14px;
    padding-right: ${({ $menuCollapsed }) => ($menuCollapsed ? 12 : 4)}px;
  }
  .icon {
    font-size: 18px;
  }
`;

export const MenuItemWrapper = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  background-color: transparent;
  gap: 8px;
  padding: 6px 12px;
  transition: all 0.3s ease;
  border-top: 1px solid ${theme.colors.primary.dark};
  &:last-child {
    border-bottom: 1px solid ${theme.colors.primary.dark};
  }

  ${MenuItemTitle} .menu-text,
  > .icon {
    transition: all 0.3s ease;
    color: #dfdfdf;
  }

  &.active {
    background-color: ${theme.colors.primary.dark};
  }

  &:hover {
    background-color: ${theme.colors.primary.dark};
    ${MenuItemTitle} .menu-text,
    > .icon {
      color: white;
    }
  }

  &.collapsed {
    padding: 0 4px;
    height: 32px;
    justify-content: center;
  }
`;

export const SideMenuList = styled.ul<{
  $isSubMenu?: boolean;
  $collapsed?: boolean;
}>`
  list-style: none;
  padding: 0;
  margin: 0;
  max-width: 100%;
  width: 100%;
  ${({ $isSubMenu }) =>
    $isSubMenu
      ? `
    ${SideMenuItemContainer} {
      padding-left: 12px;

      ${MenuItemWrapper} {
        background-color: transparent;
        border: none;

        &.active.collapsed,
        &.active:not(.has-child) {
          ${MenuItemTitle} > div,
          ${MenuItemTitle} > div .menu-text,
          > .icon {
            color: #7bc6f7;
          }
        }
      }
    }
  `
      : ""}

  ${({ $collapsed, $isSubMenu }) =>
    !$isSubMenu && !$collapsed
      ? `
      overflow: hidden;
      overflow-y: auto;
    `
      : ""}
`;

export const ArrowIconWrapper = styled.div`
  margin-left: auto;
  color: white;
  pointer-events: none;
  line-height: 1;
  position: absolute;
  right: 8px;
  &.collapsed {
    right: 2px;
  }
`;

export const FloatingSubMenu = styled.ul<{ $open: boolean }>`
  list-style: none;
  padding: 0;
  margin: 0;
  position: absolute;
  top: 0;
  left: 100%;
  background-color: ${theme.colors.primary.darker};
  min-width: 160px;
  border: 1px solid ${theme.colors.primary.dark};
  z-index: 101;
  width: 100%;
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transform: ${({ $open }) => ($open ? "translateY(0)" : "translateY(-10px)")};
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
  border-radius: 2px;
  pointer-events: ${({ $open }) => ($open ? "auto" : "none")};
`;

export const FloatingHeader = styled.div`
  padding: 6px;
  border-bottom: 1px solid ${theme.colors.primary.dark};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #dfdfdf;
  font-size: 13px;
  background-color: ${theme.colors.primary.darker};
  cursor: default;
  text-transform: capitalize;
  display: flex;
  justify-content: space-between;
  > div {
    color: #dfdfdf;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 4px;
    .menu-text {
      color: #dfdfdf;
      font-size: 13px;
    }
  }
  .icon {
    font-size: 18px;
  }
`;
