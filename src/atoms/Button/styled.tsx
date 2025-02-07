// src/atoms/Button/styled.tsx
import styled from "styled-components";
import { ButtonProps } from "./interface";
import { theme } from "../../styles/theme";

export const ButtonContainer = styled.button<{
  $color: NonNullable<ButtonProps["color"]>;
  $variant: ButtonProps["variant"];
  $size: NonNullable<ButtonProps["size"]>;
  $rounded: boolean;
  $fullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.fontFamily};
  font-size: ${({ $size }) => `${theme.sizes.fontSize[$size]}px`};
  min-height: ${({ $size }) => `${theme.sizes.boxSize[$size]}px`};
  max-height: ${({ $size }) => `${theme.sizes.boxSize[$size]}px`};
  padding: ${({ $size }) => `${theme.sizes.buttonPadding[$size]}`};
  border-radius: ${({ $rounded, $size }) => ($rounded ? `${theme.sizes.boxSize[$size]}px` : "2px")};
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  transition: all 0.3s ease;
  border: none;
  text-align: center;
  box-sizing: border-box;
  line-height: 1;
  max-width: 100%;

  > span {
    transition: all 0.3s ease;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    color: white;
  }

  ${({ $variant, $color }) =>
    $variant === "outlined"
      ? `
        background: transparent;
        border: 1px solid ${theme.colors[$color].base};
        > span {
          color: ${theme.colors[$color].base};
        }
        &:hover {
          background: ${theme.colors[$color].base};
          > span {
            color: white;
          }
        }
      `
      : $variant === "link"
      ? `
        background: transparent;
        > span {
          color: ${theme.colors[$color].base};
          text-decoration: underline;
        }
        &:hover {
          > span {
            color: ${theme.colors[$color].dark};
          }
        }
      `
      : `
        background: ${theme.colors[$color].base};
        > span {
          color: white;
        }
        &:hover {
          background: ${theme.colors[$color].dark};
        }
      `}

  &:focus {
    outline: none;
  }

  ${({ $variant, $color }) => $variant !== "link" ? `
    &:focus {
      box-shadow: ${`0 0 0 4px ${theme.colors[$color].lighter}`};
    }

    &:active {
      background: ${theme.colors[$color].darker};
    }

    &:visited {
      background: ${theme.colors[$color].dark};
    }
  ` : `
    &:focus, &:active, &:visited {
      > span {
        color: ${theme.colors[$color].darker};
      }
    }
  `}

  &.button-disabled,
  &:disabled {
    ${({ $variant, $color }) => $variant === "link" ? `
      > span {
        color: ${theme.colors[$color].light};
      }
    ` : `
      background: ${$variant === "outlined" ? 'transparent' : theme.colors[$color].pale};
      border: 1px solid ${theme.colors[$color].lighter};
      > span {
        color: ${theme.colors.default.dark};
      }
    `}
  }
`;
