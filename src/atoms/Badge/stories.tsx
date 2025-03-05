// src/atoms/Badge/stories.tsx
import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './index'
import { BadgeProps } from './interface'
import { StoryWrapper, Title } from '../../components/StoryWrapper'

const descriptionText =
  'The Badge component is used to display small pieces of information. It supports different colors, sizes, outlined variants, disabled states, and custom styles for border radius and width.'

const meta: Meta<BadgeProps> = {
  title: 'Atoms/Badge',
  component: Badge,
  parameters: {
    docs: {
      description: {
        component: descriptionText,
      },
    },
  },
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger', 'info', 'default'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    borderRadius: { control: 'text' },
    width: { control: 'text' },
    disabled: { control: 'boolean' },
  },
}

export default meta

// ✅ Default Badge story (hidden in production via !dev tag)
export const Default: StoryObj<typeof meta> = {
  args: {
    children: '!',
    color: 'primary',
    size: 'md',
    borderRadius: undefined,
    width: '',
    disabled: false,
  },
  tags: ['!dev'],
  render: (args) => <Badge {...args} />,
}

// ✅ All Badge Examples story with description at the top
export const Examples = () => (
  <StoryWrapper title='Badge Examples' subTitle={descriptionText}>
    {/* ✅ Color Variants */}
    <Title>Color Variants</Title>
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {(['primary', 'success', 'warning', 'danger', 'info', 'default'] as const).map(
        (color) => (
          <Badge key={color} color={color}>
            {color.charAt(0).toUpperCase() + color.slice(1)}
          </Badge>
        )
      )}
    </div>

    {/* ✅ Outlined Badges */}
    <Title>Outlined Badges</Title>
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {(['primary', 'success', 'warning', 'danger', 'info', 'default'] as const).map(
        (color) => (
          <Badge key={color} color={color} outlined>
            {color.charAt(0).toUpperCase() + color.slice(1)}
          </Badge>
        )
      )}
    </div>

    {/* ✅ Disabled Badges */}
    <Title>Disabled Badges</Title>
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {(['primary', 'success', 'warning', 'danger', 'info', 'default'] as const).map(
        (color) => (
          <Badge key={color} color={color} disabled>
            {color.charAt(0).toUpperCase() + color.slice(1)} (Disabled)
          </Badge>
        )
      )}
    </div>

    {/* ✅ Size Variants */}
    <Title>Size Variants</Title>
    <div style={{ display: 'flex', gap: '12px' }}>
      <Badge size='sm'>S</Badge>
      <Badge size='md'>M</Badge>
      <Badge size='lg'>L</Badge>
    </div>

    {/* ✅ Custom Border Radius */}
    <Title>Custom Border Radius</Title>
    <div style={{ display: 'flex', gap: '12px' }}>
      <Badge borderRadius='0'>Edgy</Badge>
      <Badge borderRadius='4px'>Rounded</Badge>
      <Badge borderRadius='12px'>More Rounded</Badge>
      <Badge borderRadius='20px'>Pill</Badge>
    </div>

    {/* ✅ Width Control */}
    <Title>Custom Width</Title>
    <div style={{ display: 'flex', gap: '12px' }}>
      <Badge width='40px'>Wide</Badge>
      <Badge width='80px'>Wider</Badge>
      <Badge width='120px'>Extra Wide</Badge>
    </div>

    {/* ✅ Numeric Badges (1 & 2 Characters) */}
    <Title>Numeric Badges</Title>
    <div style={{ display: 'flex', gap: '12px' }}>
      <Badge size='sm'>1</Badge>
      <Badge size='md'>12</Badge>
      <Badge size='lg'>99</Badge>
    </div>
  </StoryWrapper>
)
