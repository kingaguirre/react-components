// src/atoms/Badge/styled.tsx
import styled from "styled-components";
import { theme } from "../../styles/theme";

const sizeMapping = {
  sm: { dimension: "10px", fontSize: "0px" },
  md: { dimension: "20px", fontSize: "10px" },
  lg: { dimension: "24px", fontSize: "12px" },
};

export const BadgeContainer = styled.span<{
  $color?: keyof typeof theme.colors;
  $size: "sm" | "md" | "lg";
  $borderRadius?: string;
  $disabled: boolean;
  $width?: string;
  $outlined?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: ${({ $size }) => sizeMapping[$size].dimension};
  height: ${({ $size }) => sizeMapping[$size].dimension};
  font-size: ${({ $size }) => sizeMapping[$size].fontSize};
  background-color: ${({ $outlined, $color = 'primary' }) =>
    $outlined ? "white" : theme.colors[$color].base};
  color: ${({ $outlined, $color = 'primary' }) =>
    $outlined ? theme.colors[$color].base : "white"};
  border: ${({ $outlined, $color = 'primary' }) =>
    $outlined ? `1px solid ${theme.colors[$color].base}` : "none"};
  padding: 4px;
  border-radius: ${({ $borderRadius, $size }) =>
    $borderRadius || sizeMapping[$size].dimension};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  pointer-events: ${({ $disabled }) => ($disabled ? "none" : "auto")};
  font-weight: bold;
  text-transform: uppercase;
  ${({ $width }) => $width && `width: ${$width};`}
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;

  ${({ children, $size }) => {
    const text = children?.toString() ?? "";
    if (text.length <= 2) {
      return `
        width: ${sizeMapping[$size].dimension};
      `;
    }
    return "";
  }}
`;
