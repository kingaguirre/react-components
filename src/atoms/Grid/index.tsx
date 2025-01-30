import React from 'react';
import { StyledGrid, StyledGridItem } from './styled';
import { GridProps, GridItemProps } from './interface';

export const Grid: React.FC<GridProps> = ({ children, spacing = 12 }) => {
  return <StyledGrid spacing={spacing}>{children}</StyledGrid>;
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
