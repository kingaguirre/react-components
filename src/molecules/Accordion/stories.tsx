import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Accordion } from './index'
import type { AccordionItemProps } from './interface'
import { StoryWrapper, Title } from '../../components/StoryWrapper'
import { Button } from '../../atoms/Button'

const descriptionText =
  'The Accordion component is used to display collapsible content panels for presenting information in a limited amount of space. It supports various configurations including colors, dynamic content, and right details.'

const meta: Meta<typeof Accordion> = {
  title: 'Molecules/Accordion',
  component: Accordion,
  parameters: {
    docs: {
      description: {
        component: descriptionText,
      },
    },
  },
}

export default meta

const sampleItems: AccordionItemProps[] = [
  {
    title: 'Accordion Item 1',
    children: <div>This is the content for item 1.</div>,
    color: 'primary',
    rightContent: <span>RC1</span>,
    rightDetails: [
      { value: '2', icon: 'check', text: 'Detail 1', onClick: () => alert('Detail 1 clicked') },
    ],
    disabled: true
  },
  {
    title: 'Accordion Item 2',
    children: <div>This is the content for item 2. It can change dynamically.</div>,
    color: 'success',
    rightContent: <span>RC2</span>,
    rightDetails: [
      { value: '5', icon: 'check', text: 'Detail 2', onClick: () => alert('Detail 2 clicked') },
    ],
    open: true,
  },
  {
    title: 'Accordion Item 3',
    children: <div>This is the content for item 3.</div>,
    color: 'warning',
    rightContent: <span>RC3</span>,
    rightDetails: [
      { value: '10', icon: 'check', text: 'Detail 3', onClick: () => alert('Detail 3 clicked') },
    ],
  },
]

export const Default: StoryObj<typeof Accordion> = {
  tags: ['!dev'],
  args: {
    items: sampleItems,
    allowMultiple: false,
  },
}

const AccordionExamples = () => {
  const [dynamicContent, setDynamicContent] = useState(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
  )
  const [allowMultiple, setAllowMultiple] = useState(false)

  // Colors Accordion: one item per allowed color.
  const colors: AccordionItemProps[] = ['primary', 'info', 'success', 'warning', 'danger', 'default']
    .flatMap((col) => {
      const title = `Accordion ${col.charAt(0).toUpperCase() + col.slice(1)}`
      return [
        {
          title,
          children: <div>This is a {col} accordion item.</div>,
          color: col as AccordionItemProps['color'],
        },
        {
          title: `${title} (disabled)`,
          children: <div>This is a disabled {col} accordion item.</div>,
          color: col as AccordionItemProps['color'],
          disabled: true,
        },
      ]
    })

  // RightDetails Examples: various configurations.
  const detailExamples: AccordionItemProps[] = [
    {
      title: 'Icon + Text',
      children: <div>Item with detail: icon + text</div>,
      color: 'primary',
      rightDetails: [{ icon: 'check', iconColor: 'success', text: 'Icon+Text', onClick: () => alert('Icon+Text clicked') }],
      open: true,
    },
    {
      title: 'Value + Text',
      children: <div>Item with detail: value + text</div>,
      color: 'success',
      rightDetails: [{ value: '3', text: 'Value+Text', onClick: () => alert('Value+Text clicked') }],
    },
    {
      title: 'Icon Only',
      children: <div>Item with detail: icon only</div>,
      color: 'warning',
      rightDetails: [{ icon: 'check', onClick: () => alert('Icon only clicked') }],
    },
    {
      title: 'Value Only',
      children: <div>Item with detail: value only</div>,
      color: 'danger',
      rightDetails: [{ value: '7', onClick: () => alert('Value only clicked') }],
    },
    {
      title: 'Right Content as Button',
      children: <div>Item with right content as a react element.</div>,
      color: 'info',
      rightContent: <Button size='xs'>Extra</Button>,
    },
  ]

  return (
    <StoryWrapper title='Accordion Examples' subTitle={descriptionText}>
      <Title>Colors Accordion</Title>
      <Accordion items={colors} />

      <Title>Dynamic Content Accordion</Title>
      <Button
        size='sm'
        onClick={() =>
          setDynamicContent(
            dynamicContent +
              ' Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque volutpat condimentum velit.'
          )
        }
      >
        Add More Content
      </Button>
      <Accordion
        items={[
          {
            title: 'Dynamic Item',
            children: <div>{dynamicContent}</div>,
            color: 'danger',
            open: true,
          },
        ]}
        allowMultiple={true}
      />

      <Title>Toggle Behavior Accordion</Title>
      <Button size='sm' onClick={() => setAllowMultiple(!allowMultiple)}>
        Toggle Allow Multiple (Currently {allowMultiple ? 'Multiple' : 'Single'})
      </Button>
      <Accordion items={sampleItems} allowMultiple={allowMultiple} />

      <Title>RightDetails Accordion</Title>
      <Accordion items={detailExamples} allowMultiple={true} />

      <Title>Callbacks Accordion</Title>
      <Accordion
        items={[
          {
            title: 'Try Me',
            children: <div>Watch the console and alerts.</div>,
            color: 'info',
            onClick: () => console.log('[Accordion] header clicked'),
            onOpen: () => alert('[Accordion] just opened'),
            onClose: () => alert('[Accordion] just closed'),
          },
        ]}
        allowMultiple={false}
      />
    </StoryWrapper>
  )
}

export const Examples: StoryObj<typeof Accordion> = {
  render: () => <AccordionExamples />,
}
