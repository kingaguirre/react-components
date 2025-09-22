import { fadeInOnMount, scrollStyle, theme } from "../../styles";
import styled, { css } from "styled-components";

export const DataTableWrapper = styled.div<{ $disabled?: boolean }>`
  position: relative;
  display: block;
  border: 1px solid ${theme.colors.default.pale};
  border-radius: 2px;
  box-sizing: border-box;
  background-color: ${theme.colors.default.pale};
  outline: none;
  ${scrollStyle}

  * {
    box-sizing: border-box;
  }

  button {
    outline: none !important;
  }

  ${({ $disabled }) =>
    $disabled
      ? css`
          * {
            pointer-events: none;
          }

          .data-table-loader {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .data-table-body-container:after,
          &:after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 999;
            background-color: rgba(255, 255, 255, 0.2);
            cursor: not-allowed;
            ${fadeInOnMount}
          }

          .data-table-body-container:after {
            background-color: rgba(0, 0, 0, 0.05);
          }
        `
      : ""}

  &.is-not-focused {
    .cell-container.selected:after {
      border-style: dashed;
    }
  }
`;

export const DataTableContainer = styled.div`
  overflow: auto;
  outline: none;
  position: relative;
`;

export const DataTableContentContainer = styled.div``;

export const RowsToDeleteText = styled.div<{ $isRestore?: boolean }>`
  > b {
    color: ${({ $isRestore }) =>
      !!$isRestore ? theme.colors.info.base : theme.colors.danger.base};
  }
`;

export const TableTitle = styled.div`
  padding: 8px 6px;
  font-weight: bold;
  font-size: 14px;
  line-height: 1;
  color: ${theme.colors.default.dark};
  background-color: ${theme.colors.lightA};
  border-bottom: 1px solid ${theme.colors.default.pale};
  cursor: default;
  letter-spacing: 0.5px;
`;
