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

  // --- Custom dateFormat demo state ---
  const [fmtSingleValue, setFmtSingleValue] = useState<string | Date | null>('2025-02-10'); // yyyy-MM-dd
  const [fmtSinglePayload, setFmtSinglePayload] = useState<string | null>(null);

  const [fmtRangeValue, setFmtRangeValue] = useState<string | null>('10/02/2025,17/02/2025'); // dd/MM/yyyy
  const [fmtRangePayload, setFmtRangePayload] = useState<string | null>(null);

  // helper for dd/MM/yyyy strings
  const toDDMMYYYY = (d: Date) =>
    `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

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

      <Title>Custom Date Formats (display ↔ onChange stay in sync)</Title>

      <Grid>
        {/* Single with yyyy-MM-dd */}
        <GridItem xs={12} sm={6}>
          <DatePicker
            label="Single (yyyy-MM-dd)"
            dateFormat="yyyy-MM-dd"
            value={fmtSingleValue}
            onChange={(v) => {
              setFmtSinglePayload(v as any);
              setFmtSingleValue(v ?? null as any); // you can also set Date objects; both work
            }}
            placeholder="Pick date..."
            helpText="onChange returns a string in yyyy-MM-dd"
          />
          <GridContainer>
            <Grid>
              <GridItem xs={6}>
                <Button
                  size="sm"
                  fullWidth
                  color="success"
                  onClick={() => setFmtSingleValue(new Date())}
                >
                  Set Today (Date)
                </Button>
              </GridItem>
              <GridItem xs={6}>
                <Button
                  size="sm"
                  fullWidth
                  color="danger"
                  onClick={() => setFmtSingleValue(null)}
                >
                  Clear
                </Button>
              </GridItem>
            </Grid>
            <div style={{ marginTop: 8, fontFamily: 'monospace' }}>
              onChange payload: <code>{fmtSinglePayload ?? '—'}</code>
            </div>
          </GridContainer>
        </GridItem>

        {/* Range with dd/MM/yyyy */}
        <GridItem xs={12} sm={6}>
          <DatePicker
            label="Range (dd/MM/yyyy)"
            range
            dateFormat="dd/MM/yyyy"
            value={fmtRangeValue}
            onChange={(v) => {
              // range emits "start,end" as a single string
              setFmtRangePayload(v as string | null);
              setFmtRangeValue(v as string | null);
            }}
            placeholder="Pick date range..."
            helpText="onChange returns 'start,end' in dd/MM/yyyy"
          />
          <GridContainer>
            <Grid>
              <GridItem xs={6}>
                <Button
                  size="sm"
                  fullWidth
                  color="success"
                  onClick={() => {
                    const s = new Date();
                    const e = new Date();
                    e.setDate(s.getDate() + 7);
                    setFmtRangeValue(`${toDDMMYYYY(s)},${toDDMMYYYY(e)}`);
                  }}
                >
                  Set Next 7 Days (string)
                </Button>
              </GridItem>
              <GridItem xs={6}>
                <Button
                  size="sm"
                  fullWidth
                  color="danger"
                  onClick={() => setFmtRangeValue(null)}
                >
                  Clear Range
                </Button>
              </GridItem>
            </Grid>
            <div style={{ marginTop: 8, fontFamily: 'monospace' }}>
              onChange payload: <code>{fmtRangePayload ?? '—'}</code>
            </div>
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
