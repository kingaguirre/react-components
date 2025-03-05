// src/atoms/Button/stories.tsx
import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './index'
import { StoryWrapper, Title } from '../../components/StoryWrapper'
import { Grid, GridItem } from '../../atoms/Grid'

const descriptionText =
  'The Button component is used to trigger actions or events. It supports different variants, colors, sizes, rounded corners, full width, and disabled state.'

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: descriptionText,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'link'],
    },
    color: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger', 'info', 'default'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    rounded: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
}

export default meta

export const Default: StoryObj<typeof meta> = {
  args: {
    children: 'Default Button',
    variant: 'default',
    color: 'primary',
    size: 'md',
    rounded: false,
    fullWidth: false,
    disabled: false,
  },
  tags: ['!dev'],
}

const COLORS = ['primary', 'success', 'warning', 'danger', 'info', 'default'] as const
const VARIANTS = ['default', 'outlined', 'link'] as const
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

const generateColorStories = () => (
  <Grid>
    {COLORS.map((color) => (
      <GridItem xs={12} sm={6} md={4} key={color}>
        <Button color={color}>{color.charAt(0).toUpperCase() + color.slice(1)}</Button>
        <Button color={color} disabled>
          {color.charAt(0).toUpperCase() + color.slice(1)} (Disabled)
        </Button>
      </GridItem>
    ))}
  </Grid>
)

const generateVariantStories = () => (
  <Grid>
    {VARIANTS.map((variant) => (
      <GridItem xs={12} sm={6} md={4} key={variant}>
        <Button variant={variant}>
          {variant.charAt(0).toUpperCase() + variant.slice(1)} Variant
        </Button>
      </GridItem>
    ))}
  </Grid>
)

const generateSizeStories = () => (
  <Grid>
    {SIZES.map((size) => (
      <GridItem xs={12} sm={6} md={4} key={size}>
        <Button size={size}>
          {size.charAt(0).toUpperCase() + size.slice(1)} Size
        </Button>
      </GridItem>
    ))}
  </Grid>
)

const generateRoundedStories = () => (
  <Grid>
    <GridItem xs={12} sm={6} md={4}>
      <Button rounded>Rounded Button</Button>
    </GridItem>
    <GridItem xs={12} sm={6} md={4}>
      <Button rounded disabled>
        Rounded Disabled
      </Button>
    </GridItem>
  </Grid>
)

const generateFullWidthStories = () => (
  <Grid>
    <GridItem xs={12} sm={6}>
      <Button fullWidth>Full Width Button</Button>
    </GridItem>
    <GridItem xs={12} sm={6}>
      <Button fullWidth disabled>
        Full Width Disabled
      </Button>
    </GridItem>
  </Grid>
)

export const Examples = {
  tags: ['!autodocs'],
  render: () => (
    <StoryWrapper title='Button Examples' subTitle={descriptionText}>
      <Title>Colors</Title>
      {generateColorStories()}
      <Title>Variants</Title>
      {generateVariantStories()}
      <Title>Sizes</Title>
      {generateSizeStories()}
      <Title>Rounded</Title>
      {generateRoundedStories()}
      <Title>Full Width</Title>
      {generateFullWidthStories()}
    </StoryWrapper>
  ),
}
