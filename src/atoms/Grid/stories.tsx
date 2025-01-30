import type { Meta } from '@storybook/react';
import { Grid, GridItem } from './index';
import { StoryWrapper, Title } from '@components/StoryWrapper';
import styled from 'styled-components';

const Wrapper = styled.div`
  background-color: #f7f7f7;
  padding: 16px;
`;

const Cell = styled.div`
  border: 1px solid lightgrey;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
`;

// Default export for the meta configuration
const meta = {
  title: 'Atoms/Grid',
  component: Grid,
} satisfies Meta<typeof Grid>;

export default meta;

// Combined Story
/* eslint-disable @typescript-eslint/no-explicit-any */
export const Default: any = {
  tags: ['!autodocs'],
  render: () => (
    <StoryWrapper title="Grid">
      <Title>Basic Example</Title>
      <Wrapper>
        <Grid spacing={16}>
          {/* Row 1 */}
          <GridItem xs={12} sm={8} md={6} lg={4}>
            <Cell>xs=12, sm=8, md=6, lg=4</Cell>
          </GridItem>
          <GridItem xs={12} sm={4} md={6} lg={8}>
            <Cell>xs=12, sm=4, md=6, lg=8</Cell>
          </GridItem>

          {/* Row 2 */}
          <GridItem xs={6} sm={6} md={3} lg={3}>
            <Cell>xs=6, sm=6, md=3, lg=3</Cell>
          </GridItem>
          <GridItem xs={6} sm={6} md={3} lg={3}>
            <Cell>xs=6, sm=6, md=3, lg=3</Cell>
          </GridItem>
          <GridItem xs={6} sm={6} md={6} lg={6}>
            <Cell>xs=6, sm=6, md=6, lg=6</Cell>
          </GridItem>

          {/* Row 3 */}
          <GridItem xs={12} sm={8} md={4} lg={4}>
            <Cell>xs=12, sm=8, md=4, lg=4</Cell>
          </GridItem>
          <GridItem xs={6} sm={4} md={4} lg={4}>
            <Cell>xs=6, sm=4, md=4, lg=4</Cell>
          </GridItem>
          <GridItem xs={6} sm={4} md={4} lg={4}>
            <Cell>xs=6, sm=4, md=4, lg=4</Cell>
          </GridItem>
        </Grid>
      </Wrapper>

      <Title>Offset Example</Title>
      <Wrapper>
        <Grid spacing={16}>
          <GridItem xs={4} offset={4}>
            <Cell>xs=4, offset=4</Cell>
          </GridItem>
          <GridItem xs={6} offset={3}>
            <Cell>xs=6, offset=3</Cell>
          </GridItem>
          <GridItem xs={3} offset={9}>
            <Cell>xs=3, offset=9</Cell>
          </GridItem>
        </Grid>
      </Wrapper>

      <Title>Order Example</Title>
      <Wrapper>
        <Grid spacing={16}>
          <GridItem xs={4} order={3}>
            <Cell>
              xs=4, order=3 <br /> Ordered 3rd but 1st in DOM
            </Cell>
          </GridItem>
          <GridItem xs={4} order={1}>
            <Cell>
              xs=4, order=1 <br /> Ordered 1st but 2nd in DOM
            </Cell>
          </GridItem>
          <GridItem xs={4} order={2}>
            <Cell>
              xs=4, order=2 <br /> Ordered 2nd but 3rd in DOM
            </Cell>
          </GridItem>
        </Grid>
      </Wrapper>
    </StoryWrapper>
  ),
};
