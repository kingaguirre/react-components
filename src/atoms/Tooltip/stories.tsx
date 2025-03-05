import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Tooltip } from './index'
import { StoryWrapper, Title } from '../../components/StoryWrapper'
import { Button } from '../../atoms/Button'

const descriptionText =
  'The Tooltip component is used to display brief, contextual information when users hover or click on an element. It supports various colors, placements, trigger types, and a "title" type.'

const meta: Meta<typeof Tooltip> = {
  title: 'Atoms/Tooltip',
  component: Tooltip,
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
      options: ['default', 'primary', 'danger', 'success', 'warning', 'info'],
    },
    placement: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
    },
    trigger: {
      control: 'select',
      options: ['hover', 'click'],
    },
  },
}

export default meta

// ✅ Default Tooltip story (hidden in production via !dev tag)
export const Default: StoryObj<typeof meta> = {
  args: {
    content: 'Tooltip in example',
    color: 'primary',
    placement: 'top',
    children: (
      <Button size='sm' color='primary'>
        Hover me
      </Button>
    ),
  },
  tags: ['!dev'],
  render: (args) => <Tooltip {...args} />,
}

// ✅ Tooltip Examples story
export const Examples = () => {
  const COLORS = ['primary', 'info', 'danger', 'success', 'warning', 'default'] as const
  return (
    <StoryWrapper title='Tooltip Examples' subTitle={descriptionText}>
      <Title>Color Variations</Title>
      <div
        style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '40px'
        }}
      >
        {COLORS.map((color) => (
          <Tooltip
            key={color}
            content={`Tooltip in ${color}`}
            color={color}
            placement='top'
          >
            <Button size='sm' color={color}>
              {color.charAt(0).toUpperCase() + color.slice(1)}
            </Button>
          </Tooltip>
        ))}
      </div>

      <Title>Different Triggers</Title>
      <div
        style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '40px'
        }}
      >
        <Tooltip content='Hover trigger' color='default' placement='top'>
          <Button size='sm' color='default'>
            Hover me
          </Button>
        </Tooltip>
        <Tooltip content='Click trigger' color='success' placement='top' trigger='click'>
          <Button size='sm' color='success'>
            Click me
          </Button>
        </Tooltip>
      </div>

      <Title>Different Placements</Title>
      <div
        style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          marginBottom: '40px'
        }}
      >
        <Tooltip content='Tooltip on top' color='info' placement='top'>
          <Button size='sm' color='info'>
            Top
          </Button>
        </Tooltip>
        <Tooltip content='Tooltip on right' color='info' placement='right'>
          <Button size='sm' color='info'>
            Right
          </Button>
        </Tooltip>
        <Tooltip content='Tooltip on bottom' color='info' placement='bottom'>
          <Button size='sm' color='info'>
            Bottom
          </Button>
        </Tooltip>
        <Tooltip content='Tooltip on left' color='info' placement='left'>
          <Button size='sm' color='info'>
            Left
          </Button>
        </Tooltip>
      </div>

      <Title>Tooltip with Long Content</Title>
      <div style={{ marginBottom: '40px' }}>
        <Tooltip
          content='This is a very long tooltip content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent suscipit ultrices magna, sed dignissim libero ullamcorper ac. Integer eget lectus eu urna hendrerit ultrices. Donec non ex sed nisi viverra commodo. In hac habitasse platea dictumst.'
          color='danger'
          placement='right'
          maxWidth={200}
        >
          <Button size='sm' color='danger'>
            Hover for long tooltip
          </Button>
        </Tooltip>
      </div>

      <Title>Tooltip with 'title' type</Title>
      <div style={{ marginBottom: '40px' }}>
        <Tooltip content='This is a title type tooltip' type='title'>
          <Button size='sm'>
            Hover for title type tooltip
          </Button>
        </Tooltip>
      </div>
    </StoryWrapper>
  )
}
Examples.tags = ['!autodocs']
