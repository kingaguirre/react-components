import React, { useState, useCallback } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Dropdown } from './index'
import { StoryWrapper, Title } from '../../components/StoryWrapper'
import { Grid, GridItem } from '../../atoms/Grid'
import { Button } from '../../atoms/Button'

const descriptionText =
  'The Dropdown component is used to select one or multiple options from a list. It supports various colors, sizes, filtering, and dynamic options, making it highly customizable.'

const DEFAULT_OPTIONS = [
  { value: 'option1', text: 'Option 1' },
  { value: 'option2', text: 'Option 2' },
  { value: 'option3', text: 'Option 3', disabled: true },
  { value: 'option4', text: 'Option 4' },
  {
    value: 'option5',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat'
  },
  { value: 'option6', text: 'Option 6' },
  { value: 'option7', text: 'Option 7' },
  { value: 'option8', text: 'Option 8' }
]

const meta: Meta<typeof Dropdown> = {
  title: 'Molecules/Dropdown',
  component: Dropdown,
  parameters: {
    docs: {
      description: {
        component: descriptionText,
      },
    },
  },
}

export default meta

// ✅ Default Dropdown story (hidden in production via !dev tag)
export const Default: StoryObj<typeof meta> = {
  args: {
    label: 'This is a dropdown',
    options: DEFAULT_OPTIONS
  },
  tags: ['!dev'],
}

const AsyncFilterDropdown = () => {
  const [options, setOptions] = useState<{ value: string; text: string }[]>([])
  const [loading, setLoading] = useState(false)

  const handleFilterChange = useCallback(async (filterText: string) => {
    setLoading(true)
    // Example: fetch users from JSONPlaceholder and filter by name
    const res = await fetch('https://jsonplaceholder.typicode.com/users')
    const users = await res.json()
    const filtered = users
      .filter((u: any) =>
        u.name.toLowerCase().includes(filterText.toLowerCase())
      )
      .map((u: any) => ({
        value: u.id.toString(),
        text: u.name,
      }))
    setOptions(filtered)
    setLoading(false)
  }, [])

  return (
    <div style={{ width: 300 }}>
      <Dropdown
        label='Async Filter Dropdown'
        options={options}
        filter
        loading={loading}
        placeholder={loading ? 'Loading...' : 'Type to search users'}
        onFilterChange={handleFilterChange}
      />
    </div>
  )
}

const ExamplesComponent: React.FC = () => {
  // Examples that use constant options.
  const [selected, setSelected] = useState<string>('option1')
  const [selectedMulti, setSelectedMulti] = useState<string[]>(['option1', 'option2'])
  const [disabled, setDisabled] = useState(false)

  // State for toggling filterAtBeginning in single-select example.
  const [filterAtBeginning, setFilterAtBeginning] = useState(false)

  // State used only for the Dynamic Options example.
  const [dynamicOptions, setDynamicOptions] = useState(DEFAULT_OPTIONS)

  const addDynamicOption = () => {
    const newOption = {
      value: `option${dynamicOptions.length + 1}`,
      text: `Option ${dynamicOptions.length + 1}`
    }
    setDynamicOptions([...dynamicOptions, newOption])
  }

  const removeDynamicOption = () => {
    if (dynamicOptions.length > 1) setDynamicOptions(dynamicOptions.slice(0, -1))
  }

  return (
    <StoryWrapper title='Dropdown Component' subTitle={descriptionText}>
      <Title>Colors</Title>
      <Grid>
        {['primary', 'info', 'success', 'warning', 'danger', 'default'].map(color => (
          <GridItem xs={12} sm={6} md={4} key={color}>
            <Dropdown
              label={color}
              options={DEFAULT_OPTIONS}
              color={color as any}
              helpText={`Color variant example (${color}). ${color !== 'info' ? '' : 'Not clearable'}`}
              clearable={color !== 'info'}
              hideOnScroll={color === 'info'}
            />
            <Dropdown
              label={color}
              options={DEFAULT_OPTIONS}
              color={color as any}
              helpText={`Color variant example (${color}). ${color !== 'info' ? '' : 'Not clearable'}`}
              clearable={color !== 'info'}
              hideOnScroll={color === 'info'}
              disabled
            />
          </GridItem>
        ))}
      </Grid>

      <Title>Sizes (Multi-Select)</Title>
      <Grid>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => (
          <GridItem xs={12} sm={6} md={4} key={size}>
            <Dropdown
              multiselect
              label={size.toUpperCase()}
              options={DEFAULT_OPTIONS}
              size={size}
              helpText='Multi-select size example.'
            />
          </GridItem>
        ))}
      </Grid>

      <Title>Form Props</Title>
      <Grid>
        <GridItem xs={12} sm={6}>
          <Dropdown
            label='Required'
            options={DEFAULT_OPTIONS}
            required
            helpText='Required field example.'
          />
        </GridItem>
        <GridItem xs={12} sm={6}>
          <Dropdown
            label='Disabled'
            options={DEFAULT_OPTIONS}
            disabled={disabled}
            helpText='Disabled state example.'
            showDisabledIcon
          />
          <Button size='sm' onClick={() => setDisabled(!disabled)}>
            Toggle Disabled with lock icon
          </Button>
        </GridItem>
        <GridItem xs={12} sm={6}>
          <Dropdown
            label='Pre-selected'
            options={DEFAULT_OPTIONS}
            value={selected}
            onChange={(value: any) => {
              const newValue = Array.isArray(value) ? value[0] : value
              setSelected(newValue)
              console.log(`Selected: `, newValue)
            }}
            helpText='Pre-selected value example.'
          />
          <Button size='sm' onClick={() => setSelected('option2')}>
            Set Value
          </Button>
          <Button size='sm' onClick={() => setSelected('')}>
            Clear Value
          </Button>
        </GridItem>
        <GridItem xs={12} sm={6}>
          <Dropdown
            label='Filterable'
            options={DEFAULT_OPTIONS}
            filter
            filterAtBeginning={filterAtBeginning}
            helpText='Single select dropdown with filter highlighting at the beginning.'
          />
          <Button size='sm' onClick={() => setFilterAtBeginning(prev => !prev)}>
            Toggle filterAtBeginning ({filterAtBeginning ? 'On' : 'Off'})
          </Button>
        </GridItem>
      </Grid>

      <Grid>
        <GridItem xs={12} sm={6}>
          <Dropdown
            label='MultiSelect'
            options={DEFAULT_OPTIONS}
            multiselect
            value={selectedMulti}
            onChange={(value: any) => {
              const newValue = typeof value === 'string' ? [value] : value
              setSelectedMulti(newValue)
            }}
            filter
            helpText='Multi-select dropdown example.'
          />
          <Button size='sm' onClick={() => setSelectedMulti(['option3', 'option4'])}>
            Set Multi Value
          </Button>
          <Button size='sm' onClick={() => setSelectedMulti([])}>
            Clear Multi Value
          </Button>
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Dropdown
            label='Dynamic Options'
            options={dynamicOptions}
            helpText='Dropdown with dynamic options (add/remove).'
          />
          <Button size='sm' onClick={addDynamicOption}>
            Add Option
          </Button>
          <Button size='sm' onClick={removeDynamicOption} color='danger'>
            Remove Option
          </Button>
        </GridItem>
      </Grid>

      <Title>Aync Filter Dropdown</Title>
      <Grid>
        <GridItem xs={12} sm={6} md={4}>
          <AsyncFilterDropdown/>
        </GridItem>
      </Grid>
    </StoryWrapper>
  )
}

export const Examples: StoryObj<typeof Dropdown> = {
  tags: ['!autodocs'],
  render: () => <ExamplesComponent />,
}
