import React from 'react';
import { render, screen } from '@testing-library/react';
import { Grid, GridItem } from './index';

describe('Grid Component', () => {
  it('renders the Grid component with children', () => {
    render(
      <Grid>
        <div data-testid="child">Test Child</div>
      </Grid>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

});

describe('GridItem Component', () => {
  it('renders the GridItem component with children', () => {
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

  it('applies responsive props correctly', () => {
    render(
      <Grid>
        <GridItem xs={6} sm={8} md={10} lg={12} xl={4} data-testid="grid-item">
          Test Responsive GridItem
        </GridItem>
      </Grid>
    );
  
    const gridItem = screen.getByTestId('grid-item');
  
    // Check if data-* attributes are set correctly
    expect(gridItem).toHaveAttribute("data-xs", "6");
    expect(gridItem).toHaveAttribute("data-sm", "8");
    expect(gridItem).toHaveAttribute("data-md", "10");
    expect(gridItem).toHaveAttribute("data-lg", "12");
    expect(gridItem).toHaveAttribute("data-xl", "4");
  });

  it('applies order and offset props correctly', () => {
    render(
      <Grid>
        <GridItem offset={2} order={3} data-testid="grid-item">
          Test Grid Item
        </GridItem>
      </Grid>
    );
  
    const gridItem = screen.getByTestId('grid-item');
  
    // Check if data-* attributes are set correctly
    expect(gridItem).toHaveAttribute("data-offset", "2");
    expect(gridItem).toHaveAttribute("data-order", "3");
  });
});
