// src/molecules/Accordion/styled.ts
import styled from 'styled-components';
import { theme } from '../../styles/theme'; // Adjust path as needed
import { ColorType } from '@common/interfaces';

// Simple helper to lighten a hex color
const lighten = (hex: string, percent: number) => {
  // Remove the hash if present
  hex = hex.replace(/^#/, '');
  // Parse the r, g, b values
  const num = parseInt(hex, 16);
  let r = (num >> 16) + Math.round(255 * percent);
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * percent);
  let b = (num & 0x0000ff) + Math.round(255 * percent);

  // Ensure values are within 0-255
  r = r > 255 ? 255 : r;
  g = g > 255 ? 255 : g;
  b = b > 255 ? 255 : b;

  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
};

export const AccordionContainer = styled.div`
  width: 100%;
  border: 1px solid ${lighten(theme.colors.default.pale, 0.02)};
  border-radius: 2px;
  overflow: hidden;
`;

export const AccordionItemWrapper = styled.div`
  border-bottom: 1px solid ${lighten(theme.colors.default.pale, 0.02)};
  box-sizing: border-box;
  * { box-sizing: border-box; }
  &:last-child {
    border-bottom: none;
  }
`;

export const AccordionHeader = styled.div<{ $open: boolean; $color: ColorType }>`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: ${({ $color }) => lighten(theme.colors[$color].pale, 0.05)};
  color: ${({ $color }) => theme.colors[$color].base};
  box-shadow: 0 0 1px 0 ${({ $color }) => theme.colors[$color].base};
  cursor: pointer;
  user-select: none;
  transition: background .3s ease;

  &:hover {
    background: ${({ $color }) => theme.colors[$color].pale};
  }

  ${({ $open, $color }) => $open ? `
    background: ${theme.colors[$color].pale};
  ` : ''}
`;

export const AccordionTitle = styled.div<{ $color: ColorType }>`
  flex-grow: 1;
  font-weight: bold;
  color: ${({ $color }) => theme.colors[$color].base};
  margin-left: 8px;
  transition: all .3s ease;
  font-size: 12px;
  text-transform: uppercase;
`;

export const AccordionRightContent = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: ${theme.colors.default.dark};
`;

export const AccordionDetailContainer = styled.div`
  display: flex;
  align-items: center;
  margin-left: 8px;
  cursor: pointer;
  font-size: 12px;
  color: ${theme.colors.default.dark};

  .badge {
    box-shadow: 0 0 2px 1px rgba(255, 255, 255, 0.6);
  }
  & > span {
    margin-left: 4px;
  }
`;

export const AccordionContentWrapper = styled.div<{ $expanded: boolean; $maxHeight: number }>`
  overflow: hidden;
  transition: max-height 0.3s ease;
  max-height: ${({ $expanded, $maxHeight }) => ($expanded ? `${$maxHeight}px` : '0px')};
`;

export const AccordionContentInner = styled.div`
  padding: 12px 16px;
  font-size: 14px;
  color: ${theme.colors.default.dark};
`;
