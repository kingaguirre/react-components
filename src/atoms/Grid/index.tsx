import React from 'react';
import { StyledGrid, StyledGridItem } from './styled';
import { GridProps, GridItemProps } from './interface';

export const Grid: React.FC<GridProps> = ({ children, spacing = 16, style }) => {
  return <StyledGrid className="grid" spacing={spacing} style={style}>{children}</StyledGrid>;
};

export const GridItem: React.FC<GridItemProps> = ({
  children,
  xs,
  sm,
  md,
  lg,
  xl,
  offset,
  order,
}) => {
  return (
    <StyledGridItem
      data-testid="grid-item"
      className="grid-item"
      data-xs={xs} // Add data-* attributes for testing
      data-sm={sm}
      data-md={md}
      data-lg={lg}
      data-xl={xl}
      data-offset={offset}
      data-order={order}
      $xs={xs}
      $sm={sm}
      $md={md}
      $lg={lg}
      $xl={xl}
      $offset={offset}
      $order={order}
    >
      {children}
    </StyledGridItem>
  );
};

GridItem.displayName = 'GridItem';

export default GridItem;
