import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Panel } from './index'
import { StoryWrapper, Title } from '../../components/StoryWrapper'
import { Grid, GridItem } from '../../atoms/Grid'
import { Button } from '../../atoms/Button'

const descriptionText =
  'The Panel component is used to display content in a bordered container with an optional header, icons, and actions. It supports different colors, disabled states, and can be used as a headless container.'

const meta: Meta<typeof Panel> = {
  title: 'Molecules/Panel',
  component: Panel,
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
      options: ['primary', 'success', 'warning', 'danger', 'info', 'default']
    },
    disabled: { control: 'boolean' }
  }
}

export default meta

export const Default: StoryObj<typeof meta> = {
  args: {
    title: 'Default Panel',
    color: 'primary',
    disabled: false,
    children: <p>This is a default panel content.</p>
  },
  tags: ['!dev']
}

const COLORS = ['primary', 'success', 'warning', 'danger', 'info', 'default'] as const

const generateColorStories = () => (
  <Grid>
    {COLORS.map(color => (
      <GridItem xs={12} sm={6} md={4} key={color}>
        <Panel title={`${color.charAt(0).toUpperCase() + color.slice(1)} Panel`} color={color}>
          <p>This is a {color} panel content.</p>
        </Panel>
      </GridItem>
    ))}
  </Grid>
)

const generateIconStories = () => (
  <Grid>
    <GridItem xs={12} sm={6} md={6}>
      <Panel
        title='Panel with Left Icon'
        color='primary'
        leftIcon={{
          color: 'grey',
          icon: 'home',
          onClick: () => alert('Left icon clicked'),
          tooltip: 'Im a tooltip with **title** type',
          tooltipType: "title"
        }}
      >
        <p>This panel has a left icon.</p>
      </Panel>
    </GridItem>
    <GridItem xs={12} sm={6} md={6}>
      <Panel
        title='Panel with Right Icons'
        color='info'
        rightIcons={[
          { icon: 'folder', onClick: () => alert('Folder clicked'), color: 'grey', hoverColor: 'red', tooltip: 'Im a tooltip' },
          { icon: 'folder_special', onClick: () => alert('Add Folder clicked'), text: 'New Folder', tooltip: 'Im a tooltip but green', tooltipColor: 'success' }
        ]}
      >
        <p>This panel has right icons.</p>
      </Panel>
    </GridItem>
  </Grid>
)

const generateFormPropsStories = () => (
  <Grid>
    <GridItem xs={12} sm={6}>
      <Panel title='Disabled Panel' disabled>
        <p>This panel is disabled, and interactions are disabled.</p>
      </Panel>
    </GridItem>
    <GridItem xs={12} sm={6}>
      <Panel color='success'>
        <p>This is a headless panel without a header.</p>
      </Panel>
    </GridItem>
    <GridItem xs={12} sm={12}>
      <Panel title='Panel with Buttons' color='warning'>
        <div>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: 20 }}>
          <Button color='primary' onClick={() => alert('Primary button clicked')}>
            Primary
          </Button>
          <Button color='danger' onClick={() => alert('Danger button clicked')}>
            Danger
          </Button>
        </div>
      </Panel>
    </GridItem>
  </Grid>
)

export const Examples = {
  tags: ['!autodocs'],
  render: () => (
    <StoryWrapper title='Panel Examples' subTitle={descriptionText}>
      <Title>Colors</Title>
      {generateColorStories()}
      <Title>Icons</Title>
      {generateIconStories()}
      <Title>Form Props</Title>
      {generateFormPropsStories()}
    </StoryWrapper>
  )
}
