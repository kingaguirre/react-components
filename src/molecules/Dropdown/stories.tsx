import React, { useState, useCallback } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Dropdown } from './index'
import { StoryWrapper, Title } from '../../components/StoryWrapper'
import { Grid, GridItem } from '../../atoms/Grid'
import { Button } from '../../atoms/Button'
import { LocalServerNotice, API_BASE } from "../../components/LocalServerNotice";

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

// ✅ Default Dropdown story (hidden via !dev tag)
export const Default: StoryObj<typeof meta> = {
  args: {
    label: 'This is a dropdown',
    options: DEFAULT_OPTIONS
  },
  tags: ['!dev'],
}

const AsyncFilterDropdown = () => {
  const [options, setOptions] = useState<{ value: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFilterChange = useCallback(async (filterText: string) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        q: filterText ?? '',
        limit: '20',
        skip: '0',
        select: 'id,title',
      });
      const res = await fetch(`${API_BASE}/products/search?${qs.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const next =
        Array.isArray(json?.products)
          ? json.products.map((p: any) => ({
              value: String(p.id),
              text: String(p.title),
            }))
          : [];

      setOptions(next);
    } catch (err) {
      console.error('Local API error:', err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Dropdown
      label="Async Filter Dropdown"
      options={options}
      filter
      loading={loading}
      placeholder={loading ? 'Loading…' : 'Type to search products'}
      onFilterChange={handleFilterChange}
    />
  );
};

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
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button size='sm' onClick={() => setSelected('option2')}>
              Set Value
            </Button>
            <Button size='sm' onClick={() => setSelected('')}>
              Clear Value
            </Button>
          </div>
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
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button size='sm' onClick={() => setSelectedMulti(['option3', 'option4'])}>
              Set Multi Value
            </Button>
            <Button size='sm' onClick={() => setSelectedMulti([])}>
              Clear Multi Value
            </Button>
          </div>
        </GridItem>

        <GridItem xs={12} sm={6}>
          <Dropdown
            label='Dynamic Options'
            options={dynamicOptions}
            helpText='Dropdown with dynamic options (add/remove).'
          />
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button size='sm' onClick={addDynamicOption}>
              Add Option
            </Button>
            <Button size='sm' onClick={removeDynamicOption} color='danger'>
              Remove Option
            </Button>
          </div>
        </GridItem>
      </Grid>

      <Title>Async Filter Dropdown</Title>
      <Grid>
        <GridItem xs={12} sm={6}>
          <LocalServerNotice title="Local API not detected" description={<>Run <code>node server.js</code> at project root.</>} />
          <AsyncFilterDropdown/>
        </GridItem>
      </Grid>

      {/* ---------- Custom Option Flow – Advanced (NEW demo) ---------- */}
      <Title>Custom Option Flow – Advanced</Title>
      <Grid>
        <AdvancedCustomOptionDemo />
      </Grid>
      {/* ---------- End Advanced Section ---------- */}
    </StoryWrapper>
  )
}

const AdvancedCustomOptionDemo: React.FC = () => {
  // Independent demo state
  const [enabled, setEnabled] = useState(true);
  const [allowMultiple, setallowMultiple] = useState(false);  // false = once (hide 'Others' after first add)
  const [optionAtTop, setOptionAtTop] = useState(false);  // false = bottom; true = top

  const [single, setSingle] = useState<string | null>('custom-test');
  const [multi, setMulti] = useState<string[]>([]);

  // Persisted custom options for this advanced demo
  const [persisted, setPersisted] = useState<{ value: string; text: string }[]>([
    { "value": "custom-test", "text": "Others - test"}
  ]);

  const handleAdd = useCallback((opt: { value: string; text: string }, raw: string) => {
    // Respect insertion semantics: PREPEND if optionAtTop, else APPEND
    setPersisted(prev => {
      if (prev.some(p => p.value === opt.value)) return prev;
      return optionAtTop ? [opt, ...prev] : [...prev, opt];
    });
    console.log("[Advanced] Created (persist me):", opt, "raw:", raw);
  }, [optionAtTop]);

  return (
    <>
      <GridItem xs={12} sm={12} md={6}>
        <Dropdown
          label="Single (Advanced)"
          options={DEFAULT_OPTIONS}
          value={single ?? ''}
          onChange={(v: any) => setSingle(v)}
          enableCustomOption={enabled}
          customOption={{
            onAdd: handleAdd,
            options: persisted,
            allowMultiple,   // allow multiple creations or once
            optionAtTop,   // place 'Others' at TOP; new options PREPEND
          }}
          helpText={`allowMultiple=${String(allowMultiple)} · optionAtTop=${String(optionAtTop)} · ${optionAtTop ? 'New options PREPEND under Others' : 'New options APPEND before Others/bottom'}`}
        />
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button size="sm" onClick={() => setEnabled(v => !v)}>
            {enabled ? 'Disable' : 'Enable'} Custom Option
          </Button>
          <Button size="sm" onClick={() => setallowMultiple(v => !v)}>
            allowMultiple: {String(allowMultiple)}
          </Button>
          <Button size="sm" onClick={() => setOptionAtTop(v => !v)}>
            optionAtTop: {String(optionAtTop)}
          </Button>
          <Button size="sm" onClick={() => setPersisted([])}>
            Clear persisted customOptions
          </Button>
          <Button size="sm" onClick={() => setSingle('')}>
            Clear Single Value
          </Button>
        </div>
      </GridItem>

      <GridItem xs={12} sm={12} md={6}>
        <Dropdown
          label="Multi (Advanced)"
          multiselect
          options={DEFAULT_OPTIONS}
          value={multi}
          onChange={(v: any) => setMulti(Array.isArray(v) ? v : [v])}
          enableCustomOption={enabled}
          customOption={{
            onAdd: handleAdd,
            options: persisted,
            allowMultiple,
            optionAtTop,
          }}
          helpText={`Multiselect shares the same rules. ${optionAtTop ? 'PREPEND under Others' : 'APPEND near bottom'}.`}
          filter
        />
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button size="sm" onClick={() => setMulti([])}>
            Clear Multi Value
          </Button>
        </div>
      </GridItem>
    </>
  );
};

export const Examples: StoryObj<typeof Dropdown> = {
  tags: ['!autodocs'],
  render: () => <ExamplesComponent />,
}
