// src/molecules/Alert/styled.tsx
import styled, { keyframes, css } from 'styled-components';
import { theme } from '../../styles/theme';
import { ColorType } from '@common/interfaces';

// --- Opening animations ---
const growIn = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;
const slideIn = keyframes`
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// --- Closing animations ---
const growOut = keyframes`
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0.95); opacity: 0; }
`;
const slideOut = keyframes`
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(-20px); opacity: 0; }
`;
const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const getAnimation = ($animation: 'grow' | 'slide' | 'fade', closing = false) => {
  if ($animation === 'grow') {
    return closing ? growOut : growIn;
  } else if ($animation === 'slide') {
    return closing ? slideOut : slideIn;
  } else {
    return closing ? fadeOut : fadeIn;
  }
};

export const AlertWrapper = styled.div<{
  $color: ColorType;
  $animation: "grow" | "slide" | "fade";
}>`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 2px;
  font-size: 14px;
  background-color: ${({ $color }) => theme.colors[$color].pale};
  color: ${({ $color }) => theme.colors[$color].dark};
  border: 1px solid ${({ $color }) => theme.colors[$color].light};
  border-top: 4px solid ${({ $color }) => theme.colors[$color].base};
  gap: 12px;
  position: relative;
  /* Remove the transition to prevent conflicts with the keyframes */
  /* transition: opacity 0.3s ease, transform 0.3s ease; */
  box-sizing: border-box;
  * {
    box-sizing: border-box;
  }
  animation: ${({ $animation }) => css`
    ${getAnimation($animation)}
    0.3s ease-out forwards
  `};

  &.closing {
    animation: ${({ $animation }) => css`
      ${getAnimation($animation, true)}
      0.3s ease-out forwards
    `};
  }
`;


export const Title = styled.div<{ $color: ColorType }>`
  font-weight: bold;
  margin-bottom: 4px;
  color: ${({ $color }) => theme.colors[$color].base};
`;

export const Content = styled.span`
  flex-grow: 1;
  color: ${theme.colors.default.dark};
`;

export const IconWrapper = styled.div<{ $color: ColorType }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: ${({ $color }) => theme.colors[$color].base};
`;

export const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: ${theme.colors.default.base};
  margin-left: auto;
  display: flex;
  align-items: center;
  transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
  padding: 0;

  &:hover {
    color: ${theme.colors.danger.base};
  }

  &:active {
    transform: scale(0.9);
  }
`;

export const ToastContainer = styled.div<{ $placement: string }>`
  position: fixed;
  width: 300px;
  ${({ $placement }) => ($placement.includes('top') ? 'top: 16px;' : 'bottom: 16px;')}
  ${({ $placement }) => ($placement.includes('right') ? 'right: 16px;' : 'left: 16px;')}
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: ${theme.fontFamily};
`;

// Overlay behind toast alerts.
export const ToastOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9997;
  background: transparent;
`;
