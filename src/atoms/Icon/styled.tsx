import styled from "styled-components";
import { IconProps } from "./interface";
import { ifElse } from "../../utils/index";

const getSize = (s: IconProps["size"]) => typeof s === 'string' ? s : `${s}px`

export const IconContainer = styled.span<{
  $size?: IconProps["size"];
  $color?: IconProps["color"];
  $disabled?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ $size }) => getSize($size) ?? "inherit"};
  color: ${({ $color, $disabled }) => ifElse($disabled ?? false, "gray", $color ? `${$color}!important` : "inherit")};
  pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  box-sizing: border-box;
  line-height: 1;
  * { box-sizing: border-box; }

  /* ✅ Ensures Icon font styles are applied */
  &::before {
    font-family: 'sc' !important;
  }
`;

/* ✅ Fallback Box (Only Shown if Icon is Missing) */
export const FallbackBox = styled.div<{ $size?: IconProps["size"] }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8d7da;
  color: #721c24;
  font-size: ${({ $size }) => getSize($size) ?? "inherit"};
  min-width: ${({ $size }) => $size ?? "1em"};
  width: ${({ $size }) => $size ?? "1em"};
  height: ${({ $size }) => $size ?? "1em"};
  border-radius: 4px;
  font-weight: bold;
  border: 1px solid #f5c6cb;
  line-height: 1;
`;
