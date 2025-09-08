// src/components/Modal/styled.tsx
import styled, { css } from "styled-components";
import { scrollStyle } from "../../styles/GlobalStyles";
import { ModalProps } from "./interface";

const getModalWidth = (width: ModalProps["modalWidth"]) => {
  switch (true) {
    case width === "sm":
      return "300px";
    case width === "md":
      return "500px";
    case width === "lg":
      return "800px";
    default:
      return "auto";
  }
};

export const ModalOverlay = styled.div<{
  $zIndex: number;
  $show: boolean;
  $closeable: boolean;
  $keepMounted?: boolean; // NEW
}>`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  overflow-y: scroll;

  background: rgba(0, 0, 0, 0.6);
  z-index: ${({ $zIndex }) => $zIndex};
  padding: 20px 0;
  box-sizing: border-box;
  ${scrollStyle}

  /* Original animation: fade via transition */
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  transition: opacity 300ms ease-in-out;
  will-change: opacity;

  /* Non-interactive while not shown */
  pointer-events: ${({ $show }) => ($show ? "auto" : "none")};

  * {
    box-sizing: border-box;
  }

  ${({ $closeable }) =>
    !$closeable &&
    css`
      ${ModalContainer} {
        transition: transform 300ms ease;
      }
      &:active {
        ${ModalContainer} {
          transform: translateY(0) scale(0.99);
        }
      }
    `}

  /* HARD HIDE ONLY when fully exited AND we're keeping it mounted */
  ${({ $keepMounted }) =>
    $keepMounted &&
    css`
      &[data-state="exited"] {
        z-index: -1; /* drop out of stacking so it never blocks */
        visibility: hidden; /* hide from a11y/paint */
        pointer-events: none; /* belt & suspenders */
        opacity: 0; /* ensure fully transparent */
      }
    `}
`;

export const ModalContainer = styled.div<{
  $modalWidth: ModalProps["modalWidth"];
  $show: boolean;
  $keepMounted?: boolean; // NEW
}>`
  width: ${({ $modalWidth }) => getModalWidth($modalWidth)};
  max-width: 90%;
  margin: auto;
  display: flex;
  flex-direction: column;

  opacity: ${({ $show }) => ($show ? 1 : 0)};
  transform: ${({ $show }) => ($show ? "translateY(0)" : "translateY(20px)")};
  transition:
    opacity 300ms ease-in-out,
    transform 300ms ease-in-out;
  will-change: opacity, transform;
  pointer-events: ${({ $show }) => ($show ? "auto" : "none")};

  ${({ $keepMounted }) =>
    $keepMounted &&
    css`
      &[data-state="exited"] {
        transition: none !important;
        opacity: 0 !important;
        transform: translateY(20px) !important;
      }
    `}
`;
