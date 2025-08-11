import React from "react";
import { theme } from "src/styles";
import styled from "styled-components";

interface FooterProps {
  alignment?: "left" | "center" | "right";
  content?: React.ReactNode;
}

const Container = styled.footer`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background-color: ${theme.colors.lightA};
`;

const getAlignment = (alignment) => {
  switch (alignment) {
    case "center":
      return "center";
    case "right":
      return "flex-end";
    default:
      return "flex-start";
  }
};

const Text = styled.div<{ $alignment?: FooterProps["alignment"] }>`
  padding: 5px 16px;
  min-height: 24px;
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: ${({ $alignment = "left" }) => getAlignment($alignment)};
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${theme.colors.default.base};
`;
const Bar = styled.div<{ $width: number; $color: string }>`
  align-self: stretch;
  width: ${({ $width }) => $width}px;
  background-color: ${({ $color }) => $color};
`;

const BARS = [
  { color: theme.colors.secondary.dark, width: 50 },
  { color: theme.colors.secondary.darker, width: 26 },
  { color: theme.colors.primary.darker, width: 38 },
  { color: theme.colors.primary.base, width: 12 },
  { color: theme.colors.primary.dark, width: 128 },
];

export const Footer: React.FC<FooterProps> = ({ alignment, content }) => (
  <Container data-testid="app-shell-footer">
    {BARS.map((b) => (
      <Bar key={b.width} $width={b.width} $color={b.color} />
    ))}
    <Text $alignment={alignment}>{content ?? "Footer Content"}</Text>
  </Container>
);
