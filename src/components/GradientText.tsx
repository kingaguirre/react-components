"use client";

import React from "react";
import styled from "styled-components";
import { theme } from "../styles";

export const GradientTextContainer = styled.span<{ $bold?: boolean }>`
  /* Gradient fill */
  background: linear-gradient(
    135deg,
    ${theme.colors.primary.dark},
    ${theme.colors.primary.base},
    ${theme.colors.secondary.base},
    ${theme.colors.secondary.dark}
  );
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent; /* crucial for WebKit */

  /* Avoid paint-area cropping */
  display: inline-block;
  line-height: 1.4;
  overflow: visible;
  text-rendering: optimizeLegibility;

  ${({ $bold }) => (!!$bold ? "font-weight: bold;" : "")}
`;

interface GradientTextProps {
  children: React.ReactNode;
  bold?: boolean;
}

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  bold = false,
}) => <GradientTextContainer $bold={bold}>{children}</GradientTextContainer>;

export default GradientText;
