import type { Meta, StoryObj } from '@storybook/react';
import { FormControl } from './index';
import { useRef } from 'react';
import { StoryWrapper, Title } from '@components/StoryWrapper';
import { Grid, GridItem } from '@atoms/Grid';

const meta = {
  title: 'Atoms/FormControl',
  component: FormControl,
  argTypes: {
    type: {
      control: 'select',
      options: [
        "text",
        "password",
        "email",
        "number",
        "checkbox",
        "radio",
        // "date",
        // "date-range",
        // "dropdown",
        // "checkbox-group",
        // "radio-group",
        // "switch-group",
        "switch",
        "textarea",
      ],
    },
    variant: {
      control: 'select',
      options: [undefined, 'outlined'], // Dropdown with an empty option and 'outlined'
    },
  },
} satisfies Meta<typeof FormControl>;

export default meta;

// Default story
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
    text: "",
  },
  tags: ['!dev'],
};

const COLORS = ['primary', 'info', 'success', 'warning', 'danger', 'default'];
const VARIANTS = ['default', 'outlined'];
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];

const generateColorStories = (type: string) => (
  <Grid>
    {COLORS.map((color) => (
      <GridItem xs={12} sm={6} md={4} key={color}>
        <FormControl
          type={type}
          label={`${color.charAt(0).toUpperCase() + color.slice(1)} Color`}
          helpText={`This ${type} uses ${color} color`}
          color={color}
          placeholder="Enter text here..."
        />
        <FormControl
          type={type}
          label={`${color.charAt(0).toUpperCase() + color.slice(1)} Color (Disabled)`}
          helpText={`This ${type} uses ${color} color and is disabled`}
          color={color}
          placeholder="Enter text here..."
          disabled
        />
      </GridItem>
    ))}
  </Grid>
);

const generateVariantStories = (type: string) => (
  <Grid>
    {VARIANTS.map((variant) => (
      <GridItem xs={12} sm={6} md={4} key={variant}>
        <FormControl
          type={type}
          label={`${variant.charAt(0).toUpperCase() + variant.slice(1)} Variant`}
          helpText={`This ${type} uses ${variant} variant`}
          variant={variant}
          placeholder="Enter text here..."
        />
      </GridItem>
    ))}
  </Grid>
);

const generateSizeStories = (type: string) => (
  <Grid>
    {SIZES.map((size) => (
      <GridItem xs={12} sm={6} md={4} key={size}>
        <FormControl
          type={type}
          label={`${size.charAt(0).toUpperCase() + size.slice(1)} Size`}
          helpText={`This ${type} is ${size} sized`}
          size={size}
          placeholder="Enter text here..."
        />
      </GridItem>
    ))}
  </Grid>
);

const generateFormPropsStories = (type: string) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCheckValidity = () => {
    if (inputRef.current) {
      alert(inputRef.current.validity.valid ? 'Valid input!' : 'Invalid input!');
    }
  };

  return (
    <>
      <Title>Form Props</Title>
      <Grid>
        <GridItem xs={12} sm={6} md={4}>
          <FormControl type={type} label="Required" helpText="This input is required" required placeholder="Must not be null" />
          <FormControl type={type} disabled label="Required" helpText="This input is required and disabled" required placeholder="Must not be null" />
        </GridItem>
        {type === 'text' && (
          <GridItem xs={12} sm={6} md={4}>
            <FormControl type={type} label="Format: XXX-XX-XXXX (Alphanumeric)" helpText="This input has a pattern (ABC-12-XYZ9)" pattern="[A-Za-z0-9]{3}-[A-Za-z0-9]{2}-[A-Za-z0-9]{4}" placeholder="ABC-12-XYZ9" />
          </GridItem>
        )}
        {(type === 'text' || type === 'textarea') && (
          <GridItem xs={12} sm={6} md={4}>
            <FormControl type={type} label="Read-Only" helpText="This input is read-only" readOnly value="Read-only value" />
          </GridItem>
        )}
        <GridItem xs={12} sm={6} md={4}>
          <FormControl type={type} label="Disabled" helpText="This input is disabled" disabled placeholder="Disabled input" />
        </GridItem>
        {type === 'text' && (
          <GridItem xs={12}>
            <FormControl
              ref={inputRef} // Pass the ref to the FormControl
              label="Username"
              helpText="Enter your username (alphanumeric only)"
              required
              pattern="^[a-zA-Z0-9]+$" // Only alphanumeric characters are allowed
              placeholder="Enter username"
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
            {(type === 'checkbox' || type === 'switch') ? (
              <FormControl type={type} label={`${type} with text`} helpText={`This ${type} has a text prop`} text="Click me!" />
            ) : (
              <FormControl type="radio" label="Radio with Text" helpText="This radio button has a text prop" text="Select this option" />
            )}
          </GridItem>
        )}
      </Grid>
    </>
  );
};

const Text: StoryObj = {
  tags: ['!autodocs'],
  render: () => (
    <StoryWrapper title="Text Input">
      <Title>Colors</Title>
      {generateColorStories('text')}
      <Title>Variants</Title>
      {generateVariantStories('text')}
      <Title>Sizes</Title>
      {generateSizeStories('text')}
      {generateFormPropsStories('text')}
    </StoryWrapper>
  ),
};

const TextArea: StoryObj = {
  tags: ['!autodocs'],
  render: () => (
    <StoryWrapper title="Textarea">
      <Title>Colors</Title>
      {generateColorStories('textarea')}
      <Title>Variants</Title>
      {generateVariantStories('textarea')}
      <Title>Sizes</Title>
      {generateSizeStories('textarea')}
      {generateFormPropsStories('textarea')}
    </StoryWrapper>
  ),
};

const Checkbox: StoryObj = {
  tags: ['!autodocs'],
  render: () => (
    <StoryWrapper title="Checkbox">
      <Title>Colors</Title>
      {generateColorStories('checkbox')}
      <Title>Sizes</Title>
      {generateSizeStories('checkbox')}
      {generateFormPropsStories('checkbox')}
    </StoryWrapper>
  ),
};

const Radio: StoryObj = {
  tags: ['!autodocs'],
  render: () => (
    <StoryWrapper title="Radio">
      <Title>Colors</Title>
      {generateColorStories('radio')}
      <Title>Sizes</Title>
      {generateSizeStories('radio')}
      {generateFormPropsStories('radio')}
    </StoryWrapper>
  ),
};

const Switch: StoryObj = {
  tags: ['!autodocs'],
  render: () => (
    <StoryWrapper title="switch">
      <Title>Colors</Title>
      {generateColorStories('switch')}
      <Title>Sizes</Title>
      {generateSizeStories('switch')}
      {generateFormPropsStories('switch')}
    </StoryWrapper>
  ),
};

export { Text, TextArea, Checkbox, Radio, Switch };
