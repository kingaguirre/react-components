// src/components/Tabs/styled.tsx
import styled, { keyframes } from "styled-components";
import { theme } from "../../styles/theme";
import { ifElse } from "../../utils/index";
import { ColorType } from "../../common/interface";

export const TabWrapper = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

export const TabsContainer = styled.div<{ $fullHeader: boolean }>`
  display: flex;
  align-items: center;
  overflow-x: auto;
  margin-bottom: -2px;
  white-space: nowrap;
  scrollbar-width: none;
  -ms-overflow-style: none;
  ${({ $fullHeader }) => ($fullHeader ? "width: 100%;" : "")}

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const TabItem = styled.button<{
  $active: boolean;
  $focused: boolean;
  $disabled: boolean;
  $color: ColorType;
  $fullHeader: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 16px;
  font-size: 14px;
  font-weight: bold;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: ${({ $disabled, $active }) =>
    $disabled ? "not-allowed" : ifElse($active, "default", "pointer")};
  background-color: ${({ $active, $color }) =>
    $active ? theme.colors[$color].pale : "transparent"};
  border-color: ${({ $active, $color }) =>
    $active ? theme.colors[$color].base : "transparent"};
  border-bottom-color: transparent;
  color: ${({ $disabled }) =>
    $disabled ? theme.colors.default.dark : theme.colors.default.darker};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition: background 0.3s ease;
  ${({ $fullHeader }) => ($fullHeader ? "flex: 1;" : "")}

  .title {
    transition: all 0.3s ease;
    color: ${({ $active, $color }) =>
      !$active ? theme.colors[$color].base : theme.colors[$color].dark};
  }

  .icon {
    font-size: 16px;
    color: ${theme.colors.default.darker};
  }

  &:hover {
    > .title {
      color: ${({ $active, $color }) =>
        !$active ? theme.colors[$color].dark : undefined};
    }
  }

  .badge {
    margin: -4px 0;
  }

  /* ✅ Focused Tab Styling */
  ${({ $focused, $disabled, $color, $active }) =>
    $focused &&
    !$disabled &&
    `
    background-color: ${theme.colors[$color].pale};
    ${
      !$active
        ? `
      border-bottom-color: ${theme.colors[$color].base};
    `
        : ``
    }
  `}
`;

const getPosition = (position: string) => {
  switch (true) {
    case position === "left":
      return "left: 0;";
    case position === "left-adjusted":
      return "left: 35px;";
    case position === "right":
      return "right: 0;";
    default:
      return "right: 35px;";
  }
};

export const ScrollButton = styled.button<{
  $position: "left" | "left-adjusted" | "right" | "right-adjusted";
}>`
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  border: none;
  font-size: 22px;
  cursor: pointer;
  padding: 4px;
  top: 0;
  transition: all 0.3s ease;
  z-index: 2;
  color: ${theme.colors.primary.dark};
  outline: none;

  &:hover {
    color: ${theme.colors.primary.base};
  }

  ${({ $position }) => getPosition($position)}
`;

export const TabContentWrapper = styled.div<{ $color: ColorType }>`
  padding: 12px;
  border-top: 2px solid
    ${({ $color }) => theme.colors[$color || "primary"].base};
  font-size: 14px;
  color: ${theme.colors.default.dark};
  outline: none;
  transition: all 0.3s ease;
  p {
    margin: 0 0 16px;
  }
`;

export const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  background: transparent;
  border: none;
  font-size: 22px;
  cursor: pointer;
  padding: 4px;
  color: ${theme.colors.primary.dark};
  transition: all 0.3s ease;
  outline: none;

  &:hover {
    color: ${theme.colors.primary.base};
  }
`;

/* ✅ Only fade-in (No flickering) */
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const TabContent = styled.div`
  animation: ${fadeIn} 0.2s ease-in-out;
`;
