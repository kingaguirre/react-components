import type { Meta, StoryObj } from '@storybook/react'
import { DatePicker } from './index'
import { StoryWrapper, Title } from '../../components/StoryWrapper'
import React, { useState } from 'react'
import { Button } from '../../atoms/Button'
import styled from 'styled-components'
import { Grid, GridItem } from '../../atoms/Grid'

const descriptionText =
  'The DatePicker component is used to select dates (or date ranges). It supports various colors, required/disabled states, and customizable placeholders, along with interactive examples.'

const meta: Meta<typeof DatePicker> = {
  title: 'Molecules/DatePicker',
  component: DatePicker,
  parameters: {
    docs: {
      description: {
        component: descriptionText,
      },
    },
  },
  argTypes: {
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    range: { control: 'boolean' },
    color: {
      control: 'select',
      options: ['primary', 'success', 'danger', 'info', 'warning', 'default']
    },
  },
}

export default meta

// ✅ Default DatePicker
export const Default: StoryObj<typeof meta> = {
  args: {
    label: 'Pick a Date'
  },
  tags: ['!dev'],
}

const GridContainer = styled.div`
  margin-top: 16px;
`

const COLORS = ['primary', 'success', 'danger', 'info', 'warning', 'default'] as const

const ExamplesComponent: React.FC = () => {
  const [singleDate, setSingleDate] = useState<string | null | [string | string] | Date>('10-Feb-2025')
  const [rangeDate, setRangeDate] = useState<[Date, Date] | null>([
    new Date('2025-02-10'),
    new Date('2025-02-28')
  ])
  const [isSingleDisabled, setIsSingleDisabled] = useState<boolean>(false)
  const [isRangeDisabled, setIsRangeDisabled] = useState<boolean>(false)
  const [isSingleRequired, setIsSingleRequired] = useState<boolean>(false)
  const [isRangeRequired, setIsRangeRequired] = useState<boolean>(false)

  return (
    <StoryWrapper title='Date Picker Examples' subTitle={descriptionText}>
      <Title>Color Variants</Title>
      <Grid>
        {COLORS.map((color: typeof COLORS[number]) => (
          <GridItem xs={12} sm={6} md={4} key={color}>
            <DatePicker
              label={`${color.charAt(0).toUpperCase() + color.slice(1)} Color`}
              color={color}
              helpText='This is a help text'
              placeholder='Select Date...'
              onChange={value => console.log(value)}
            />
            <DatePicker
              label={`${color.charAt(0).toUpperCase() + color.slice(1)} Color`}
              color={color}
              helpText='This is a help text'
              placeholder='Select Date...'
              onChange={value => console.log(value)}
              disabled
            />
          </GridItem>
        ))}
      </Grid>

      <Grid style={{ marginTop: 20 }}>
        {/* Left Column: Single Date Picker */}
        <GridItem xs={12} sm={6}>
          <Title>Single Date Picker</Title>
          <DatePicker
            label='Single Date'
            value={singleDate as string}
            onChange={(date) => {
              setSingleDate(date as string)
              console.log('Selected Single Date: ', date)
            }}
            required={isSingleRequired}
            disabled={isSingleDisabled}
            showDisabledIcon
            minDate={new Date()}
          />
          <GridContainer>
            <Grid>
              <GridItem xs={6}>
                <Button
                  size='sm'
                  fullWidth
                  color='primary'
                  onClick={() => setIsSingleDisabled((prev) => !prev)}
                >
                  Toggle Disabled with lock icon
                </Button>
              </GridItem>
              <GridItem xs={6}>
                <Button
                  size='sm'
                  fullWidth
                  color='warning'
                  onClick={() => setIsSingleRequired((prev) => !prev)}
                >
                  Toggle Required
                </Button>
              </GridItem>
              <GridItem xs={6}>
                <Button
                  size='sm'
                  fullWidth
                  color='success'
                  onClick={() => setSingleDate(new Date())}
                >
                  Set Today's Date
                </Button>
              </GridItem>
              <GridItem xs={6}>
                <Button
                  size='sm'
                  fullWidth
                  color='danger'
                  onClick={() => setSingleDate(null)}
                >
                  Clear Date
                </Button>
              </GridItem>
            </Grid>
          </GridContainer>
        </GridItem>

        {/* Right Column: Date Range Picker */}
        <GridItem xs={12} sm={6}>
          <Title>Date Range Picker</Title>
          <DatePicker
            label='Date Range'
            value={rangeDate}
            onChange={(date) => console.log(date)}
            required={isRangeRequired}
            disabled={isRangeDisabled}
            range
          />
          <GridContainer>
            <Grid>
              <GridItem xs={6}>
                <Button
                  size='sm'
                  fullWidth
                  color='primary'
                  onClick={() => setIsRangeDisabled((prev) => !prev)}
                >
                  Toggle Disabled
                </Button>
              </GridItem>
              <GridItem xs={6}>
                <Button
                  size='sm'
                  fullWidth
                  color='warning'
                  onClick={() => setIsRangeRequired((prev) => !prev)}
                >
                  Toggle Required
                </Button>
              </GridItem>
              <GridItem xs={6}>
                <Button
                  size='sm'
                  fullWidth
                  color='success'
                  onClick={() =>
                    setRangeDate([new Date(), new Date(new Date().setDate(new Date().getDate() + 7))])
                  }
                >
                  Set Next 7 Days
                </Button>
              </GridItem>
              <GridItem xs={6}>
                <Button
                  size='sm'
                  fullWidth
                  color='danger'
                  onClick={() => setRangeDate(null)}
                >
                  Clear Date Range
                </Button>
              </GridItem>
            </Grid>
          </GridContainer>
        </GridItem>
      </Grid>
    </StoryWrapper>
  )
}

export const Examples: StoryObj<typeof DatePicker> = {
  tags: ['!autodocs'],
  render: () => <ExamplesComponent />
}
