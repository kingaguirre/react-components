import React from 'react';
import { Header, flexRender } from '@tanstack/react-table';
import {
  Resizer,
  LeftIconContainer,
  IconContainer,
} from './styled'
import { Icon } from '@atoms/Icon';

interface ColumnPinAndResizeProps {
  header: any;
}

export const ColumnPinAndResize: React.FC<ColumnPinAndResizeProps> = ({
  header,
}) => {
  return (
    <>
      {(header.column.getCanPin() || header.column.getCanSort()) && (
          <LeftIconContainer>
            {header.column.getCanPin() && (
              <IconContainer
                title={`${header.column.getIsPinned() ? 'Unpin' : 'Pin'} ${flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const isPinned = header.column.getIsPinned() === 'left';
                  header.column.pin(isPinned ? false : 'left');
                }}
              >
                <Icon icon="push_pin" />
              </IconContainer>
            )}
            {header.column.getCanSort() && (
              <IconContainer
                onClick={header.column.getToggleSortingHandler()}
                title={
                  header.column.getCanSort()
                    ? header.column.getNextSortingOrder() === 'asc'
                      ? 'Sort ascending'
                      : header.column.getNextSortingOrder() === 'desc'
                        ? 'Sort descending'
                        : 'Clear sort'
                    : undefined
                }
              >
                <Icon
                  icon={
                    header.column.getIsSorted() === 'asc'
                      ? 'keyboard_arrow_up'
                      : header.column.getIsSorted() === 'desc'
                      ? 'keyboard_arrow_down'
                      : 'unfold_more'
                  }
                />
              </IconContainer>
            )}
          </LeftIconContainer>
        )}
        {header.column.getCanResize() && (
          <Resizer
            {...{
              onDoubleClick: () => header.column.resetSize(),
              onMouseDown: header.getResizeHandler(),
              onTouchStart: header.getResizeHandler(),
              className: `column-resizer onChange ${
                header.column.getIsResizing() ? 'is-resizing' : ''
              }`,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
    </>
  );
};
