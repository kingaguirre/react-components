import { CSSProperties } from 'react';
import styled, { css } from 'styled-components';
import { Column } from '@tanstack/react-table';

export const TableWrapper = styled.div`
  width: 100%;
  overflow: auto;
`;

export const TableStyled = styled.div`
  border-collapse: collapse;
  width: 100%;
`;

export const ThStyled = styled.div`
  border: 1px solid #ccc;
  padding: 8px;
  background: #f4f4f4;
  user-select: none;
  position: relative;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  flex-direction: column;
`;

export const TdStyled = styled.div<{ isFocused?: boolean; hasError?: boolean }>`
  border: 1px solid #ccc;
  padding: 8px;
  cursor: pointer;
  background-color: ${(props) => (props.isFocused ? 'lightblue' : 'inherit')};

  ${({ hasError }) =>
    hasError &&
    css`
      border: 1px solid red;
    `}
`;

export const Resizer = styled.div`
  display: inline-block;
  width: 5px;
  height: 100%;
  position: absolute;
  right: 0;
  top: 0;
  transform: translateX(50%);
  cursor: col-resize;
  user-select: none;
  touch-action: none;
  background-color: grey;
`;

export const ActionButton = styled.button`
  margin: 0 4px;
`;

// Helper styled components for pin/sort icons.
export const LeftIconContainer = styled.div`
  display: flex;
  align-items: center;
`;

export const IconContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-right: 4px;
`;

export const getCommonPinningStyles = (column: Column<any>): CSSProperties => {
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn =
    isPinned === 'left' && column.getIsLastColumn('left')
  const isFirstRightPinnedColumn =
    isPinned === 'right' && column.getIsFirstColumn('right')

  return {
    boxShadow: isLastLeftPinnedColumn
      ? '-4px 0 4px -4px gray inset'
      : isFirstRightPinnedColumn
        ? '4px 0 4px -4px gray inset'
        : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    opacity: isPinned ? 0.95 : 1,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  }
}
