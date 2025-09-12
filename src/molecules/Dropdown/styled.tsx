import styled, { css } from "styled-components";
import { theme, scrollStyle } from "../../styles";

const CUSTOM_INPUT_PADRIGHT = 95;

export const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
`;

export const DropdownList = styled.ul<{
  $size: keyof typeof theme.sizes.boxSize;
  $position: string;
  $dropdownHeight?: number;
}>`
  background-color: white;
  position: fixed;
  max-height: ${({ $size, $dropdownHeight }) =>
    $dropdownHeight ?? theme.sizes.boxSize[$size] * 5}px;
  overflow-y: auto;
  box-shadow: 0 ${({ $position }) => ($position === "bottom" ? 2 : -1)}px 4px
    rgba(173, 173, 173, 0.5);
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
  /** Suppress :hover highlight for this row (used while editing custom input). */
  $noHover?: boolean;
}>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  line-height: 1.2;
  padding: ${({ $size }) => ($size === "sm" ? 4 : 6)}px 8px;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  color: ${({ disabled }) =>
    disabled ? theme.colors.default.light : theme.colors.default.dark};
  background-color: ${({ disabled }) =>
    disabled ? theme.colors.default.pale : "white"};
  font-size: ${({ $size }) => theme.sizes.fontSize[$size]}px;
  transition: all 0.3s ease;
  min-height: ${({ $size }) => theme.sizes.boxSize[$size]}px;
  box-sizing: border-box;
  word-break: break-word;

  &:not(:last-child) {
    border-bottom: 1px solid ${theme.colors.default.pale};
  }

  /* Focused (keyboard) state always highlights */
  &.focused {
    background: ${({ disabled }) =>
      disabled ? theme.colors.default.pale : theme.colors.primary.pale};
    color: ${({ disabled }) =>
      disabled ? theme.colors.default.light : theme.colors.primary.base};
  }

  /* Hover highlight is conditional; skip when $noHover is true */
  &:hover {
    ${({ disabled, $noHover }) =>
      !disabled &&
      !$noHover &&
      css`
        background: ${theme.colors.lightA};
        color: ${theme.colors.primary.base};
      `}
  }

  &.selected {
    background: ${({ disabled }) =>
      disabled ? theme.colors.primary.light : theme.colors.primary.base};
    color: white;
    font-weight: bold;
    > span {
      background-color: transparent;
    }
  }

  /* IMPORTANT: scope checkbox shim to option rows */
  &.option-item .form-control-input-container {
    height: 16px;
    margin-right: 8px;
    pointer-events: none;
  }

  /* Flash highlight for new/duplicate target */
  &.flash {
    background: #fff59d !important; /* soft yellow */
    color: ${theme.colors.default.dark} !important;
  }

  /* Custom add row & edit row: zero padding for full-width input */
  &.custom-row-item,
  &.editing-item {
    padding: 0;
    transition: none;
    .help-text {
      padding: 4px;
      font-weight: normal;
      background: white;
    }
  }

  /* Show row affordance on hover */
  &:hover .row-affordance {
    opacity: 1;
  }
`;

export const HighlightedText = styled.span`
  display: inline-block;
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

/* ---------- Custom row (creator) bits ---------- */

export const CustomRow = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

export const CustomInputWrap = styled.div`
  flex: 1;
  margin: 0;
  .form-control-text {
    padding-right: ${CUSTOM_INPUT_PADRIGHT}px;
  }
`;

/** Absolute-positioned action on the right, overlapping the input */
export const OverlapAction = styled.div`
  position: absolute;
  right: 8px;
  top: 7px;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 1;
  > span {
    font-weight: bold;
  }
`;

/* ---------- Edit affordance ---------- */
export const RowAffordance = styled.span`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
  user-select: none;
  font-size: 10px;
  color: ${theme.colors.default.dark};
  padding: 5px;
  background-color: white!important;
  border-radius: 50%;
  transition: all 0.3s ease;
  border: 1px solid ${theme.colors.default.pale};
  &:hover {
    background-color: ${theme.colors.primary.dark}!important;
    color: white;
    border-color: ${theme.colors.primary.dark};
  }
`;

export const EditRow = styled.div`
  position: relative;
  width: 100%;
  .form-control-text {
    padding-right: ${CUSTOM_INPUT_PADRIGHT}px;
  }
`;
