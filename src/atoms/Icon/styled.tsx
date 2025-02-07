// src/atoms/Icon/styled.tsx
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
  color: ${({ $color, $disabled }) => ($disabled ? "gray" : $color ? $color : "inherit")};
  pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};

  /* Ensures IcoMoon font styles are applied */
  &::before {
    font-family: 'icomoon' !important;
  }
`;

