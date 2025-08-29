// src/atoms/Grid/_test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import 'jest-styled-components';
import { Grid, GridItem } from './index';

describe('Grid Component', () => {
  it('renders with children', () => {
    const { container } = render(
      <Grid>
        <div data-testid="child">Test Child</div>
      </Grid>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();

    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveStyleRule('display', 'flex');
    expect(grid).toHaveStyleRule('flex-wrap', 'wrap');
  });

  it('stays flex even if Tailwind "grid" class is applied', () => {
    const { container } = render(
      <Grid className="grid">
        <div>child</div>
      </Grid>
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid).toHaveStyleRule('display', 'flex'); // wins via && specificity
    expect(grid).toHaveStyleRule('grid-template-columns', 'initial');
    expect(grid).toHaveStyleRule('grid-auto-rows', 'initial');
  });

  it('applies spacing to direct children', () => {
    const { container } = render(
      <Grid spacing={24}>
        <div data-testid="pad1">A</div>
        <div data-testid="pad2">B</div>
      </Grid>
    );
    const grid = container.firstChild as HTMLElement;
    // use '& > *' for nested rules
    expect(grid).toHaveStyleRule('padding', '12px', { modifier: '& > *' });
  });

  it('passes through className', () => {
    const { container } = render(
      <Grid className="custom-grid-class">
        <div>child</div>
      </Grid>
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toMatch(/custom-grid-class/);
    expect(grid).toHaveStyleRule('display', 'flex');
  });
});

describe('GridItem Component', () => {
  it('renders with children', () => {
    render(
      <Grid>
        <GridItem xs={12} data-testid="grid-item">
          Test Grid Item
        </GridItem>
      </Grid>
    );
    expect(screen.getByTestId('grid-item')).toBeInTheDocument();
    expect(screen.getByText('Test Grid Item')).toBeInTheDocument();
  });

  it('applies responsive data-* attributes (smoke)', () => {
    render(
      <Grid>
        <GridItem xs={6} sm={8} md={10} lg={12} xl={4} data-testid="grid-item">
          Test Responsive GridItem
        </GridItem>
      </Grid>
    );
    const gridItem = screen.getByTestId('grid-item');
    expect(gridItem).toHaveAttribute('data-xs', '6');
    expect(gridItem).toHaveAttribute('data-sm', '8');
    expect(gridItem).toHaveAttribute('data-md', '10');
    expect(gridItem).toHaveAttribute('data-lg', '12');
    expect(gridItem).toHaveAttribute('data-xl', '4');
  });

  it('calculates base width for xs (flex-basis/max-width)', () => {
    render(
      <Grid>
        <GridItem xs={6} data-testid="grid-item">widths</GridItem>
      </Grid>
    );
    const gridItem = screen.getByTestId('grid-item');
    // xs: 6/12 = 50%
    expect(gridItem).toHaveStyleRule('width', '50.000000%');
    expect(gridItem).toHaveStyleRule('flex-basis', '50.000000%');
    expect(gridItem).toHaveStyleRule('max-width', '50.000000%');
  });

  it('applies offset and order correctly', () => {
    render(
      <Grid>
        <GridItem offset={2} order={3} data-testid="grid-item">
          offset/order
        </GridItem>
      </Grid>
    );
    const gridItem = screen.getByTestId('grid-item');
    expect(gridItem).toHaveAttribute('data-offset', '2');
    expect(gridItem).toHaveAttribute('data-order', '3');
    expect(gridItem).toHaveStyleRule('margin-left', '16.666667%'); // 2/12
    expect(gridItem).toHaveStyleRule('order', '3');
  });

  it('supports order=0 and offset=0 (zero-friendly)', () => {
    render(
      <Grid>
        <GridItem offset={0} order={0} data-testid="grid-item-0">
          zeroes
        </GridItem>
      </Grid>
    );
    const item = screen.getByTestId('grid-item-0');
    expect(item).toHaveStyleRule('order', '0');
    // no margin-left rule when offset=0
    expect(item).not.toHaveStyleRule('margin-left');
  });

  it('leaves item fluid when no breakpoint props', () => {
    render(
      <Grid>
        <GridItem data-testid="fluid-item">fluid</GridItem>
      </Grid>
    );
    const fluid = screen.getByTestId('fluid-item');
    expect(fluid).not.toHaveStyleRule('width');
    expect(fluid).not.toHaveStyleRule('flex-basis');
    expect(fluid).not.toHaveStyleRule('max-width');
  });

  it('passes through custom className on GridItem', () => {
    render(
      <Grid>
        <GridItem className="custom-item" data-testid="grid-item">
          with class
        </GridItem>
      </Grid>
    );
    const gridItem = screen.getByTestId('grid-item');
    expect(gridItem.className).toMatch(/custom-item/);
  });
});
