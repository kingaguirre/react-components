import styled from "styled-components";
import { IconProps } from "./interface";

export const IconContainer = styled.span<{
  $size?: IconProps["size"];
  $color?: IconProps["color"];
  $disabled?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ $size }) => ($size ? $size : "inherit")};
  color: ${({ $color, $disabled }) => ($disabled ? "gray" : $color ? `${$color}!important` : "inherit")};
  pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition: all .3s ease;
  box-sizing: border-box;
  * { box-sizing: border-box; }

  /* ✅ Ensures Icon font styles are applied */
  &::before {
    font-family: 'sc' !important;
  }
`;

/* ✅ Fallback Box (Only Shown if Icon is Missing) */
export const FallbackBox = styled.div<{ $size?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8d7da;
  color: #721c24;
  font-size: ${({ $size }) => ($size ? $size : "inherit")};
  width: ${({ $size }) => ($size ? $size : "1em")};
  height: ${({ $size }) => ($size ? $size : "1em")};
  border-radius: 4px;
  font-weight: bold;
  border: 1px solid #f5c6cb;
`;
