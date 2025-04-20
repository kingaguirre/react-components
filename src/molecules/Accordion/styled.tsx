// src/molecules/Accordion/styled.ts
import styled from 'styled-components';
import { theme } from '../../styles/theme'; // Adjust path as needed
import { ColorType } from '../../common/interface';

export const AccordionContainer = styled.div`
  width: 100%;
  border-radius: 2px;
`;

export const AccordionItemWrapper = styled.div<{
  $color: ColorType
  $disabled?: boolean
}>`
  position: relative;
  z-index: 0;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 2px;
  transition: all .3s ease;
  outline: none;
  * { box-sizing: border-box; }

  &:focus {
    ${({ $disabled, $color }) => $disabled ? '' : `
      box-shadow: ${`0 0 0 4px ${theme.colors[$color].lighter}`};
      z-index: 1;
    `}
  }
`;

export const AccordionHeader = styled.div<{
  $open: boolean
  $color: ColorType
  $disabled?: boolean
}>`
  display: flex;
  align-items: center;
  padding: 6px 12px;
  /* if disabled: force header text to #333, else use theme color */
  color: ${({ $disabled }) =>
    $disabled ? theme.colors.default.dark : 'white'};
  background: ${({ $disabled, $color }) =>
    $disabled ? theme.colors[$color].pale : theme.colors[$color].base};
  box-shadow: 0 0 1px 0 ${({ $color }) => theme.colors[$color].base};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  user-select: none;
  transition: all 0.3s ease;

  /* only hover when not disabled */
  &:hover {
    ${({ $disabled, $color }) =>
      $disabled ? '' : `background: ${theme.colors[$color].dark};`}
  }

  &:active {
    ${({ $disabled, $color }) =>
      $disabled ? '' : `background: ${theme.colors[$color].darker};`}
  }

  /* open state styling—only if not disabled */
  ${({ $open, $color, $disabled }) =>
    $open && !$disabled
      ? `background: ${theme.colors[$color].dark};`
      : ''}
`

export const AccordionTitle = styled.div<{
  $disabled?: boolean
}>`
  flex-grow: 1;
  font-weight: bold;
  color: ${({ $disabled }) => $disabled ? theme.colors.default.dark : 'white'};
  margin-left: 8px;
  transition: all .3s ease;
  font-size: 12px;
  text-transform: uppercase;
`;

export const AccordionRightContent = styled.div<{
  $disabled?: boolean
}>`
  margin-left: auto;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: ${({ $disabled }) => $disabled ? theme.colors.default.dark : 'white'};
  * {
    color: ${({ $disabled }) => $disabled ? theme.colors.default.dark : 'white'};
  }
`;

export const AccordionDetailContainer = styled.div<{
  $disabled?: boolean
}>`
  display: flex;
  align-items: center;
  margin-left: 8px;
  cursor: pointer;
  font-size: 12px;
  color: ${({ $disabled }) => $disabled ? theme.colors.default.dark : 'white'};

  .badge {
    box-shadow: 0 0 2px 1px rgba(255, 255, 255, 0.6);
    color: white;
  }
  & > span {
    margin-left: 4px;
    color: ${({ $disabled }) => $disabled ? theme.colors.default.dark : 'white'};
  }
`;

export const AccordionContentWrapper = styled.div<{
  $expanded: boolean
  $maxHeight: number
  $color: ColorType
}>`
  position: relative;
  overflow: hidden;
  transition: max-height 0.3s ease;
  max-height: ${({ $expanded, $maxHeight }) => ($expanded ? `${$maxHeight}px` : '0px')};
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    border: 1px solid ${({ $color }) => theme.colors[$color].dark};
    pointer-events: none;
  }
`;

export const AccordionContentInner = styled.div`
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.4;
  color: ${theme.colors.default.dark};
`;
