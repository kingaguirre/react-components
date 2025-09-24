import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Panel } from './index'
import { StoryWrapper, Title } from '../../components/StoryWrapper'
import { Grid, GridItem } from '../../atoms/Grid'
import { Button } from '../../atoms/Button'
import { Icon } from '../../atoms/Icon'

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
    disabled: { control: 'boolean' },
    isSubHeader: { control: 'boolean' },   // NEW showcase control
    hideShadow: { control: 'boolean' },     // NEW showcase control
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

/** NEW: Show all colors when isSubHeader=true */
const generateSubHeaderStories = () => (
  <Grid>
    {COLORS.map(color => (
      <GridItem xs={12} sm={6} md={4} key={`sub-${color}`}>
        <Panel
          title={`${color.charAt(0).toUpperCase() + color.slice(1)} SubHeader`}
          color={color}
          isSubHeader
        >
          <p>SubHeader variant using color <strong>{color}</strong>.</p>
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
          tooltipType: 'title'
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

    {/* No Shadow example */}
    <GridItem xs={12}>
      <Panel title='No Shadow Panel' color='info' hideShadow>
        <p>Shadow is disabled via <code>hideShadow=&#123;true&#125;</code>.</p>
      </Panel>
    </GridItem>

     <GridItem xs={12}>
      <Panel
        title='Panel with Badge Slots'
        color='warning'
        leftDetails={[
          { text: 'Draft', color: 'info' }
        ]}
        rightDetails={[
          { value: '5', valueColor: 'danger' },
          { icon: 'info', iconColor: 'info', onClick: () => alert('Info clicked') }
        ]}
      >
        <p>
          Header shows left &amp; right details (badges/icons/text), same API as Accordion’s <code>rightDetails</code>.
        </p>
      </Panel>
    </GridItem>

    <GridItem xs={12} sm={6}>
      <Panel
        title='Panel with Custom Header Content'
        color='primary'
        leftContent={
          <>
            <Icon icon='filter_list' />
            <span>Filters active</span>
          </>
        }
        rightContent={
          <Button size='xs' onClick={() => alert('Run clicked')}>Run</Button>
        }
      >
        <p>
          Use <code>leftContent</code> / <code>rightContent</code> to inject arbitrary header elements (buttons, chips, etc).
        </p>
      </Panel>
    </GridItem>

    <GridItem xs={12} sm={6}>
      <Panel
        title='SubHeader + Details'
        color='default'
        isSubHeader
        leftDetails={[{ icon: 'warning', color: 'warning' }]}
        rightDetails={[
          { value: '12', valueColor: 'warning' },
          { text: 'Open', color: 'default' }
        ]}
      >
        <p>
          SubHeader styling combined with details on both sides.
        </p>
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

      {/* NEW Section */}
      <Title>SubHeader (All Colors)</Title>
      {generateSubHeaderStories()}

      <Title>Icons</Title>
      {generateIconStories()}

      <Title>Form Props</Title>
      {generateFormPropsStories()}
    </StoryWrapper>
  )
}
