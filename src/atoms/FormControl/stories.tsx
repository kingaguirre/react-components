/* eslint-disable react-refresh/only-export-components */
import React, { useState, useRef } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FormControl } from './index'
import { StoryWrapper, Title } from '../../components/StoryWrapper'
import { Grid, GridItem } from '../../atoms/Grid'
import { Button } from '../../atoms/Button'

const descriptionText =
  'The FormControl component is used to build form fields. It supports various types (text, password, email, number, checkbox, radio, textarea, etc.), variants, sizes, colors, and more to create consistent and customizable form elements.'

const meta: Meta<typeof FormControl> = {
  title: 'Atoms/FormControl',
  component: FormControl,
  parameters: {
    docs: {
      description: {
        component: descriptionText,
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: [
        'text',
        'password',
        'email',
        'number',
        'checkbox',
        'radio',
        'checkbox-group',
        'radio-group',
        'switch-group',
        'radio-button-group',
        'switch',
        'textarea',
      ],
    },
    variant: {
      control: 'select',
      options: [undefined, 'outlined'],
    },
  },
}

export default meta

/** ✅ Default story */
export const Default: StoryObj<typeof meta> = {
  args: {
    label: 'Primary Label',
    type: 'text',
    color: undefined,
    size: 'md',
    helpText: 'This is a primary input field',
    disabled: false,
    readOnly: false,
    required: false,
    variant: undefined,
    text: '',
    placeholder: 'Enter text here...',
    isVerticalOptions: false,
    value: undefined
  },
  tags: ['!dev'],
}

// --- Constants & helper functions ---
const COLORS = ['primary', 'info', 'success', 'warning', 'danger', 'default'] as const
const VARIANTS = ['default', 'outlined'] as const
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const
const SAMPLE_OPTIONS = [
  { value: 'option1', text: 'Option 1' },
  { value: 'option2', text: 'Option 2', disabled: true },
  { value: 'option3', text: 'Option 3' },
]

// These helpers don't use hooks so we can keep them as functions.
const generateColorStories = (type: string, md = 4) => (
  <Grid>
    {COLORS.map((color) => (
      <GridItem xs={12} sm={6} md={md} key={color}>
        <FormControl
          type={type}
          label={`${color.charAt(0).toUpperCase() + color.slice(1)} Color`}
          helpText={`This ${type} uses ${color} color`}
          color={color}
          placeholder='Enter text here...'
          options={SAMPLE_OPTIONS}
          name={`name-${color}`}
          text='Click Me!'
        />
        <FormControl
          type={type}
          label={`${color.charAt(0).toUpperCase() + color.slice(1)} Color (Disabled)`}
          helpText={`This ${type} uses ${color} color and is disabled`}
          color={color}
          placeholder='Enter text here...'
          disabled
          options={SAMPLE_OPTIONS}
          name={`name-${color}-disabled`}
          text='Click Me!'
        />
      </GridItem>
    ))}
  </Grid>
)

const generateVariantStories = (type: string, md = 4) => (
  <Grid>
    {VARIANTS.map((variant) => (
      <GridItem xs={12} sm={6} md={md} key={variant}>
        <FormControl
          type={type}
          label={`${variant.charAt(0).toUpperCase() + variant.slice(1)} Variant`}
          helpText={`This ${type} uses ${variant} variant`}
          variant={variant}
          placeholder='Enter text here...'
          options={SAMPLE_OPTIONS}
          name={`name-${variant}`}
        />
      </GridItem>
    ))}
  </Grid>
)

const generateSizeStories = (type: string, md = 4) => (
  <Grid>
    {SIZES.map((size) => (
      <GridItem xs={12} sm={6} md={md} key={size}>
        <FormControl
          type={type}
          label={`${size.charAt(0).toUpperCase() + size.slice(1)} Size`}
          helpText={`This ${type} is ${size} sized`}
          size={size}
          placeholder='Enter text here...'
          options={SAMPLE_OPTIONS}
          name={`name-${size}`}
        />
      </GridItem>
    ))}
  </Grid>
)

// --- Components that use hooks must be proper React components ---

const FormPropsStories: React.FC<{ type: string }> = ({ type }) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [inputValue, setInputValue] = useState('')
  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleCheckValidity = () => {
    if (inputRef.current) {
      alert(inputRef.current.validity.valid ? 'Valid input!' : 'Invalid input!')
    }
  }

  return (
    <>
      <Title>Form Props</Title>
      <Grid>
        <GridItem xs={12} sm={6} md={4}>
          <FormControl
            type={type}
            label='Required'
            helpText='This input is required'
            required
            placeholder='Must not be null'
          />
          <FormControl
            type={type}
            disabled
            label='Required'
            helpText='This input is required and disabled'
            required
            placeholder='Must not be null'
          />
        </GridItem>
        {type === 'text' && (
          <GridItem xs={12} sm={6} md={4}>
            <FormControl
              type={type}
              label='Format: XXX-XX-XXXX (Alphanumeric)'
              helpText='This input has a pattern (ABC-12-XYZ9)'
              pattern='[A-Za-z0-9]{3}-[A-Za-z0-9]{2}-[A-Za-z0-9]{4}'
              placeholder='ABC-12-XYZ9'
            />
          </GridItem>
        )}
        {(type === 'text' || type === 'textarea') && (
          <GridItem xs={12} sm={6} md={4}>
            <FormControl
              type={type}
              label='Read-Only'
              helpText='This input is read-only'
              readOnly
              value='Read-only value'
            />
          </GridItem>
        )}
        <GridItem xs={12} sm={6} md={4}>
          <FormControl
            type={type}
            label='Disabled'
            helpText='This input is disabled'
            disabled
            placeholder='Disabled input'
          />
        </GridItem>
        {type === 'text' && (
          <GridItem xs={12}>
            <FormControl
              ref={inputRef}
              label='Username'
              helpText='Enter your username (alphanumeric only)'
              required
              pattern='^[a-zA-Z0-9]+$'
              placeholder='Enter username'
            />
            <div style={{ marginTop: '1rem' }}>
              <button onClick={handleFocus} style={{ marginRight: '1rem' }}>
                Focus Input
              </button>
              <button onClick={handleCheckValidity}>Check Validity</button>
            </div>
          </GridItem>
        )}
        {(type === 'checkbox' || type === 'radio' || type === 'switch') && (
          <GridItem xs={12} sm={6} md={4}>
            {type === 'checkbox' || type === 'switch' ? (
              <FormControl
                type={type}
                label={`${type} with text`}
                helpText={`This ${type} has a text prop`}
                text='Click me!'
              />
            ) : (
              <FormControl
                type='radio'
                label='Radio with Text'
                helpText='This radio button has a text prop'
                text='Select this option'
              />
            )}
          </GridItem>
        )}
      </Grid>
    </>
  )
}

const GroupStories: React.FC<{ type: string }> = ({ type }) => {
  const [selectedValue, setSelectedValue] = useState<string>('option2,option3')
  const [options, setOptions] = useState(SAMPLE_OPTIONS)
  const [disabled, setDisabled] = useState(false)
  const [isVerticalOptions, setIsVerticalOptions] = useState(false)

  const handleSetValue = () => setSelectedValue('option1,option2')
  const handleClearValue = () => setSelectedValue('')
  const handleAddOption = () => {
    const newOption = { value: `option${options.length + 1}`, text: `Option ${options.length + 1}` }
    setOptions([...options, newOption])
  }
  const handleRemoveOption = () => {
    if (options.length > 1) setOptions(options.slice(0, -1))
  }
  const handleToggleDisabled = () => setDisabled(!disabled)
  const handleToggleVertical = () => setIsVerticalOptions(!isVerticalOptions)
  const handleChange = (value: string) => setSelectedValue(value)

  return (
    <StoryWrapper title={`${type.charAt(0).toUpperCase() + type.slice(1)}`} subTitle={descriptionText}>
      <Title>Colors</Title>
      {generateColorStories(type)}
      <Title>Sizes</Title>
      {generateSizeStories(type)}
      <Title>Form Props</Title>
      <Grid>
        <GridItem xs={12} sm={6}>
          <FormControl
            name='form-control-1'
            type={type}
            label='Required'
            required
            options={options}
            helpText={`This is required ${type}`}
          />
        </GridItem>
        <GridItem xs={12} sm={6}>
          <FormControl
            name='form-control-2'
            type={type}
            label='Pre-Selected'
            value={selectedValue}
            options={options}
            onChange={handleChange}
          />
          <div style={{ display: 'flex', gap: '6px', marginTop: '1rem' }}>
            <Button size='sm' onClick={handleSetValue}>
              Set Value
            </Button>
            <Button size='sm' onClick={handleClearValue} color='danger'>
              Clear Value
            </Button>
          </div>
          <p>
            Current Value: <strong>{selectedValue.toString()}</strong>
          </p>
        </GridItem>
        <GridItem xs={12} sm={6}>
          <FormControl name='form-control-3' type={type} label='Disabled' disabled={disabled} options={options} />
          <div style={{ marginTop: '1rem' }}>
            <Button size='sm' onClick={handleToggleDisabled} color='warning'>
              Toggle Disabled
            </Button>
          </div>
          <p>
            Status: <strong>{disabled ? 'Disabled' : 'Enabled'}</strong>
          </p>
        </GridItem>
        <GridItem xs={12} sm={6}>
          <FormControl
            name='form-control-4'
            type={type}
            label='Dynamic Options'
            options={options}
            isVerticalOptions={isVerticalOptions}
          />
          <div style={{ marginTop: '1rem', gap: 8, display: 'flex', flexWrap: 'wrap' }}>
            <Button size='sm' onClick={handleAddOption}>
              Add Option
            </Button>
            <Button size='sm' onClick={handleRemoveOption} color='danger'>
              Remove Option
            </Button>
            <Button size='sm' onClick={handleToggleVertical}>
              Toggle vertical align
            </Button>
          </div>
          <p>
            Options Count: <strong>{options.length}</strong>
          </p>
        </GridItem>
      </Grid>
    </StoryWrapper>
  )
}

// --- Story Definitions ---
const Text: StoryObj = {
  tags: ['!autodocs'],
  render: () => (
    <StoryWrapper title='Text Input' subTitle={descriptionText}>
      <Title>Colors</Title>
      {generateColorStories('text')}
      <Title>Variants</Title>
      {generateVariantStories('text')}
      <Title>Sizes</Title>
      {generateSizeStories('text')}
      <FormPropsStories type='text' />
    </StoryWrapper>
  ),
}

const TextArea: StoryObj = {
  tags: ['!autodocs'],
  render: () => (
    <StoryWrapper title='Textarea' subTitle={descriptionText}>
      <Title>Colors</Title>
      {generateColorStories('textarea')}
      <Title>Variants</Title>
      {generateVariantStories('textarea')}
      <Title>Sizes</Title>
      {generateSizeStories('textarea')}
      <FormPropsStories type='textarea' />
    </StoryWrapper>
  ),
}

const Checkbox: StoryObj = {
  tags: ['!autodocs'],
  render: () => (
    <StoryWrapper title='Checkbox' subTitle={descriptionText}>
      <Title>Colors</Title>
      {generateColorStories('checkbox')}
      <Title>Sizes</Title>
      {generateSizeStories('checkbox')}
      <FormPropsStories type='checkbox' />
    </StoryWrapper>
  ),
}

const Radio: StoryObj = {
  tags: ['!autodocs'],
  render: () => (
    <StoryWrapper title='Radio' subTitle={descriptionText}>
      <Title>Colors</Title>
      {generateColorStories('radio')}
      <Title>Sizes</Title>
      {generateSizeStories('radio')}
      <FormPropsStories type='radio' />
    </StoryWrapper>
  ),
}

const Switch: StoryObj = {
  tags: ['!autodocs'],
  render: () => (
    <StoryWrapper title='Switch' subTitle={descriptionText}>
      <Title>Colors</Title>
      {generateColorStories('switch')}
      <Title>Sizes</Title>
      {generateSizeStories('switch')}
      <FormPropsStories type='switch' />
    </StoryWrapper>
  ),
}

const CheckboxGroup: StoryObj = {
  tags: ['!autodocs'],
  render: () => <GroupStories type='checkbox-group' />,
}

const RadioGroup: StoryObj = {
  tags: ['!autodocs'],
  render: () => <GroupStories type='radio-group' />,
}

const SwitchGroup: StoryObj = {
  tags: ['!autodocs'],
  render: () => <GroupStories type='switch-group' />,
}

const RadioButtonGroup: StoryObj = {
  tags: ['!autodocs'],
  render: () => <GroupStories type='radio-button-group' />,
}

export { Text, TextArea, Checkbox, Radio, Switch, CheckboxGroup, RadioGroup, SwitchGroup, RadioButtonGroup }
