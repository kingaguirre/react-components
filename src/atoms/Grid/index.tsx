import React from "react";
import { StyledGrid, StyledGridItem } from "./styled";
import { GridProps, GridItemProps } from "./interface";

export const Grid: React.FC<GridProps> = ({
  children,
  spacing = 16,
  style,
  className,
  ...rest
}) => {
  return (
    <StyledGrid
      spacing={spacing}
      style={style}
      className={className}
      {...rest}
    >
      {children}
    </StyledGrid>
  );
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
  className,
  ...rest
}) => {
  return (
    <StyledGridItem
      data-xs={xs}
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
      className={className}
      {...rest}
    >
      {children}
    </StyledGridItem>
  );
};
