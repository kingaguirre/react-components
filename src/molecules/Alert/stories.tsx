/* eslint-disable react-refresh/only-export-components */
import type { Meta, StoryObj } from '@storybook/react'
import React, { useState, useRef } from 'react'
import { Alert } from './index'
import { StoryWrapper, Title } from '../../components/StoryWrapper'
import { Grid, GridItem } from '../../atoms/Grid'
import { Button } from '../../atoms/Button'

const descriptionText =
  'The Alert component is used to display important messages or notifications. It supports different colors, toast mode, closeable behavior, placements, animations, and more'

const meta: Meta<typeof Alert> = {
  title: 'Molecules/Alert',
  component: Alert,
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
    toast: { control: 'boolean' },
    closeable: { control: 'boolean' },
    placement: {
      control: 'select',
      options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    },
    animation: {
      control: 'select',
      options: ['grow', 'slide', 'fade'],
    },
  },
}

export default meta

// Default Alert Example Component
const DefaultAlertExample: React.FC<React.ComponentProps<typeof Alert>> = (args) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button color='primary' onClick={() => setOpen(!open)}>
        Toggle Alert
      </Button>
      <Alert {...args} show={open} onClose={() => setOpen(false)} />
    </>
  )
}

export const Default: StoryObj<typeof meta> = {
  args: {
    title: 'Alert',
    children: 'This is alert',
    show: true,
    toast: false,
  },
  tags: ['!dev'],
  render: (args) => <DefaultAlertExample {...args} />,
}

const alertColors = ['primary', 'success', 'warning', 'danger', 'info', 'default'] as const

// Interactive Examples as Functional Components

// Toast Placements Example
const placements = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const
const PlacementExample = () => {
  const [active, setActive] = useState<Record<typeof placements[number], boolean>>({
    'top-left': false,
    'top-right': false,
    'bottom-left': false,
    'bottom-right': false,
  })

  const showToast = (placement: typeof placements[number]) => {
    setActive((prev) => ({ ...prev, [placement]: true }))
  }

  const handleClose = (placement: typeof placements[number]) => {
    setActive((prev) => ({ ...prev, [placement]: false }))
  }

  return (
    <Grid>
      {placements.map((placement) => (
        <GridItem key={placement}>
          <Button size='sm' onClick={() => showToast(placement)}>
            Show Toast at {placement}
          </Button>
          <Alert
            color='info'
            title={`Toast ${placement}`}
            show={active[placement]}
            toast={true}
            placement={placement}
            animation='grow'
            onClose={() => handleClose(placement)}
          >
            This toast is positioned at {placement}.
          </Alert>
        </GridItem>
      ))}
    </Grid>
  )
}

// Different Animations Example (Toast)
const animations = ['grow', 'slide', 'fade'] as const
const AnimationExample = () => {
  const [active, setActive] = useState<Record<typeof animations[number], boolean>>({
    grow: false,
    slide: false,
    fade: false,
  })

  const showAnimationToast = (anim: typeof animations[number]) => {
    setActive((prev) => ({ ...prev, [anim]: true }))
  }

  const handleClose = (anim: typeof animations[number]) => {
    setActive((prev) => ({ ...prev, [anim]: false }))
  }

  return (
    <Grid>
      {animations.map((anim) => (
        <GridItem key={anim}>
          <Button size='sm' onClick={() => showAnimationToast(anim)}>
            Show {anim.charAt(0).toUpperCase() + anim.slice(1)} Animation Toast
          </Button>
          <Alert
            color='primary'
            title={`${anim.charAt(0).toUpperCase() + anim.slice(1)} Animation`}
            show={active[anim]}
            toast={true}
            placement='top-right'
            animation={anim}
            onClose={() => handleClose(anim)}
          >
            This toast uses {anim} animation.
          </Alert>
        </GridItem>
      ))}
    </Grid>
  )
}

// Non-Closeable Toast Example (Manual Close)
const NonCloseableToastExample = () => {
  const [showToast, setShowToast] = useState(false)
  const handleShow = () => setShowToast(true)
  const handleClose = () => setShowToast(false)

  return (
    <>
      <Button size='sm' onClick={handleShow}>
        Show Non-Closeable Toast (Manual Close)
      </Button>
      <Alert
        color='danger'
        title='Toast Non-Closeable'
        show={showToast}
        toast={true}
        placement='top-right'
        closeable={true}
        animation='grow'
        onClose={handleClose}
      >
        This toast requires manual close (click the clear icon).
      </Alert>
    </>
  )
}

// Multiple Toasts Example with different colors
const MultipleToastsExample = () => {
  const colors = ['primary', 'success', 'warning', 'danger', 'info', 'default'] as const
  const [toasts, setToasts] = useState<{ id: number; color: typeof colors[number] }[]>([])
  const toastIdRef = useRef(0)

  const addToasts = () => {
    const newToasts = [0, 1, 2].map(() => {
      const id = toastIdRef.current
      const color = colors[toastIdRef.current % colors.length]
      toastIdRef.current += 1
      return { id, color }
    })
    setToasts((prev) => [...prev, ...newToasts])
  }

  const handleClose = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div>
      <Button size='sm' onClick={addToasts}>
        Show 3 Toasts
      </Button>
      {toasts.map((toast) => (
        <Alert
          key={toast.id}
          color={toast.color}
          title={`Toast ${toast.id}`}
          toast={true}
          placement='top-right'
          animation='grow'
          onClose={() => handleClose(toast.id)}
        >
          This is toast number {toast.id} with color {toast.color}.
        </Alert>
      ))}
    </div>
  )
}

// Long Content Alerts Example
const LongContentExample = () => {
  const longText =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
    'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '.repeat(5)

  const [showToast, setShowToast] = useState(false)

  return (
    <>
      <Title>Non-Toast Long Content</Title>
      <Alert
        color='info'
        title='Long Content Alert'
        toast={false}
        closeable={true}
        animation='grow'
        icon='info'
      >
        {longText}
      </Alert>

      <Title>Toast Long Content</Title>
      <Button size='sm' onClick={() => setShowToast(true)}>
        Show Toast Long Content
      </Button>
      <Alert
        color='info'
        title='Long Content Toast'
        show={showToast}
        toast={true}
        placement='top-right'
        animation='grow'
        onClose={() => setShowToast(false)}
        icon='info'
      >
        {longText}
      </Alert>
    </>
  )
}

// Close Delay Example (Toast that auto-closes in 1 second)
const CloseDelayExample = () => {
  const [showToast, setShowToast] = useState(false)
  const handleShow = () => setShowToast(true)
  const handleClose = () => setShowToast(false)

  return (
    <>
      <Button size='sm' onClick={handleShow}>
        Show 1-Second Toast
      </Button>
      <Alert
        color='primary'
        title='1-Second Toast'
        show={showToast}
        toast={true}
        placement='top-right'
        closeDelay={1000}
        animation='grow'
        onClose={handleClose}
      >
        This toast will close in 1 second.
      </Alert>
    </>
  )
}

// Inline Alert Example
const InlineAlertExample = () => {
  const [show, setShow] = useState(false)
  return (
    <>
      <Button size='sm' onClick={() => setShow(true)}>
        Show Inline Alert
      </Button>
      <Alert
        color='primary'
        title='Inline Alert'
        show={show}
        toast={false}
        closeable={true}
        animation='grow'
        onClose={() => setShow(false)}
      >
        This is an inline alert.
      </Alert>
    </>
  )
}

export const Examples: StoryObj<typeof Alert> = {
  render: () => (
    <StoryWrapper title='Alert Examples' subTitle={descriptionText}>
      <Title>Different Colors</Title>
      <Grid>
        {alertColors.map((color) => (
          <GridItem xs={12} sm={6} key={color}>
            <Alert
              color={color}
              title={`${color.charAt(0).toUpperCase() + color.slice(1)} Alert`}
              icon='check'
              toast={false}
              closeable={true}
              animation='grow'
            >
              This is a {color} alert.
            </Alert>
          </GridItem>
        ))}
      </Grid>

      <Title>Toast Placements</Title>
      <PlacementExample />

      <Title>Different Animations (Toast)</Title>
      <AnimationExample />

      <Title>Non-Closeable Toast (Manual Close)</Title>
      <NonCloseableToastExample />

      <Title>Multiple Toasts (Different Colors)</Title>
      <MultipleToastsExample />

      <LongContentExample />

      <Title>Close Delay Example (1 second)</Title>
      <CloseDelayExample />

      <Title>Inline Alert Example</Title>
      <InlineAlertExample />

      <Title>Alert with Icon</Title>
      <Alert
        color='success'
        title='Success!'
        closeable={true}
        animation='grow'
        icon='check'
      >
        This alert has an icon on the left.
      </Alert>
    </StoryWrapper>
  ),
}
