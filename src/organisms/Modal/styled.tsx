// src/components/Modal/styled.tsx
import styled, { keyframes, css } from "styled-components";
import { scrollStyle } from "../../styles/GlobalStyles";
import { ModalProps } from "./interface";

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const slideDown = keyframes`
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(20px); opacity: 0; }
`;

export const ModalOverlay = styled.div<{ $zIndex: number; $show: boolean; $closeable: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: ${({ $zIndex }) => $zIndex};
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${({ $show }) => ($show ? fadeIn : fadeOut)} 0.3s ease-in-out;
  overflow-y: auto;
  padding: 20px 0;
  box-sizing: border-box;
  ${scrollStyle}
  ${({ $show }) => !$show && css`pointer-events: none;`}

  * {
    box-sizing: border-box;
  }

  ${({ $closeable }) =>
    !$closeable &&
    css`
    ${ModalContainer} {
      transition: transform 0.3s ease;
    }
    &:active {
      ${ModalContainer} {
        transform: scale(0.99);
      }
    }
    `}
`;

const getModalWidth = (width: ModalProps["modalWidth"]) => {
  switch(true) {
    case width === "sm":
      return "300px";
    case width === "md":
      return "500px";
    case width === "lg":
      return "800px";
    default: return "auto";
  }
};

export const ModalContainer = styled.div<{
  $modalWidth: ModalProps["modalWidth"];
  $show: boolean;
}>`
  width: ${({ $modalWidth }) => getModalWidth($modalWidth)};
  max-width: 90%;
  animation: ${({ $show }) => ($show ? slideUp : slideDown)} 0.3s ease-in-out;
  ${({ $show }) => !$show && css`pointer-events: none;`}
  margin: auto;
  display: flex;
  flex-direction: column;
`;
