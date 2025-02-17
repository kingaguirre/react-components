// src/molecules/Dropdown/styled.tsx
import styled from "styled-components";
import { theme } from "../../styles/theme";
import { scrollStyle } from "../../styles/GlobalStyles";

export const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
`;

export const DropdownList = styled.ul<{ $size: keyof typeof theme.sizes.boxSize; $position: string }>`
  background-color: white;
  position: fixed;
  max-height: ${({ $size }) => theme.sizes.boxSize[$size] * 5}px;
  overflow-y: auto;
  box-shadow: 0 ${({ $position }) => $position === 'bottom' ? 2 : -1}px 4px rgba(173, 173, 173, 0.5);
  z-index: 1000;
  border-radius: 1px;
  padding: 0;
  margin: 0;
  list-style: none;
  font-family: ${theme.fontFamily};
  ${scrollStyle}
`;

export const DropdownItem = styled.li<{
  disabled?: boolean;
  $size: keyof typeof theme.sizes.boxSize;
}>`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  line-height: 1.2;
  padding: 6px 8px;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  color: ${({ disabled }) => (disabled ? theme.colors.default.light : theme.colors.default.dark)};
  background-color: ${({ disabled }) => (disabled ? theme.colors.default.pale : 'white')};
  font-size: ${({ $size }) => theme.sizes.fontSize[$size]}px;
  transition: all .3s ease;
  min-height: ${({ $size }) => theme.sizes.boxSize[$size]}px;
  box-sizing: border-box;

  &:not(:last-child) {
    border-bottom: 1px solid ${theme.colors.default.pale};
  }

  &.focused,
  &:hover {
    background: ${({ disabled }) => (disabled ? theme.colors.default.pale : theme.colors.primary.pale)};
    color: ${({ disabled }) => (disabled ? theme.colors.default.light : theme.colors.primary.base)};
  }

  &.selected {
    background: ${({ disabled }) => (disabled ? theme.colors.primary.light : theme.colors.primary.base)};
    color: white;
    font-weight: bold;
    > span {
      background-color: transparent;
    }
  }

  .form-control-input-container {
    height: 16px;
    margin-right: 8px;
  }
`;

export const HighlightedText = styled.span`
  background-color: yellow;
  font-weight: bold;
`;

export const DropdownFilterContainer = styled.div`
  background-color: ${theme.colors.default.lighter};
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 6px;
  border-bottom: 1px solid ${theme.colors.default.pale};
`;

export const NoOptionsContainer = styled.div`
  padding: 6px 8px;
  font-size: 12px;
  background-color: #f1f1f1;
  color: ${theme.colors.default.base};
  font-style: italic;
`;
