// src/atoms/FormControl/index.tsx
import { render, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { FormControl } from './index'

describe('FormControl Component', () => {
  test('renders a text input with label, help text and shows invalid state when required and empty', async () => {
    render(
      <FormControl
        label='Username'
        helpText='Enter your username'
        required
      />
    )

    // Check that the label is rendered with an asterisk (for required)
    expect(screen.getByText(/Username/)).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()

    // Check that help text is rendered
    expect(screen.getByText(/Enter your username/)).toBeInTheDocument()

    // Default type is text so expect an input with the class 'form-control-text'
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('form-control-text')

    // Because the input is required and empty, the effect should mark it invalid.
    await waitFor(() => expect(input).toHaveClass('invalid'))
  })

  test('updates invalid state when text input value changes', async () => {
    render(
      <FormControl
        label='Email'
        required
      />
    )

    const input = screen.getByRole('textbox') as HTMLInputElement
    await waitFor(() => expect(input).toHaveClass('invalid'))

    // Simulate entering a valid value using fireEvent.change works fine for state changes
    fireEvent.change(input, { target: { value: 'hello@example.com' } })
    await waitFor(() => expect(input).not.toHaveClass('invalid'))
  })

  test('calls onChange callback when text input changes', async () => {
    const handleChange = vi.fn()
    render(
      <FormControl
        label='Name'
        onChange={handleChange}
      />
    )

    const input = screen.getByRole('textbox') as HTMLInputElement
    // Use userEvent.type to simulate a real user typing.
    await userEvent.type(input, 'John Doe')
    // Note: userEvent.type fires onChange for each keystroke.
    expect(handleChange).toHaveBeenCalled() // Check that it was called at least once
  })

  test('renders a textarea when type is "textarea"', async () => {
    render(
      <FormControl
        label='Description'
        type='textarea'
        required
      />
    )

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea).toBeInTheDocument()
    expect(textarea.tagName).toBe('TEXTAREA')

    await waitFor(() => expect(textarea).toHaveClass('invalid'))
  })

  test('renders a custom checkbox control and validates required state', () => {
    const handleChange = vi.fn()
    render(
      <FormControl
        label='Accept Terms'
        type='checkbox'
        required
        onChange={handleChange}
      />
    )

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).toHaveClass('invalid')

    // For checkboxes, use click to simulate the change.
    fireEvent.click(checkbox)
    expect(handleChange).toHaveBeenCalled()
  })

  test('renders a switch control and validates required state', () => {
    const handleChange = vi.fn()
    render(
      <FormControl
        label='Enable Feature'
        type='switch'
        required
        onChange={handleChange}
      />
    )

    const switchControl = screen.getByRole('checkbox') as HTMLInputElement
    expect(switchControl).toBeInTheDocument()
    expect(switchControl).toHaveClass('form-control-switch')
    expect(switchControl).toHaveClass('invalid')

    // Use click for switch controls as well.
    fireEvent.click(switchControl)
    expect(handleChange).toHaveBeenCalled()
  })

  test('renders disabled input correctly', () => {
    render(
      <FormControl
        label='Disabled Field'
        disabled
      />
    )

    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input).toBeDisabled()
  })

  test('renders readOnly input correctly', () => {
    render(
      <FormControl
        label='Read Only Field'
        readOnly
      />
    )

    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input).toHaveAttribute('readOnly')
  })

  test('passes pattern attribute to input', () => {
    render(
      <FormControl
        label='Number'
        pattern='[0-9]+'
      />
    )

    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input).toHaveAttribute('pattern', '[0-9]+')
  })

  test('renders text for a custom control if "text" prop is provided', () => {
    render(
      <FormControl
        label='Option'
        type='checkbox'
        text='Custom text'
      />
    )

    expect(screen.getByText('Custom text')).toBeInTheDocument()
  })

  test('controlled text input: value renders, clear icon shows, clicking clear calls onChange with null (parent must update)', async () => {
    const handleChange = vi.fn()
    render(
      <FormControl
        label="Controlled"
        testId="controlled-text"
        value="hello"
        onChange={handleChange}
        clearable
      />
    )
    const input = screen.getByTestId('controlled-text') as HTMLInputElement
    expect(input.value).toBe('hello')

    const clear = screen.getByTestId('controlled-text-clear-icon')
    expect(clear).toBeInTheDocument()

    await userEvent.click(clear)
    expect(handleChange).toHaveBeenCalled()
    const evt = handleChange.mock.calls.at(-1)?.[0]
    expect(evt?.target?.value).toBeNull()

    // still old value (controlled, parent didn't update)
    expect(input.value).toBe('hello')
  })

  test('uncontrolled (value provided but no onChange): editable, clear icon toggles, onClearIcon fires', async () => {
    const onClearIcon = vi.fn()
    render(
      <FormControl
        label="Uncontrolled seed"
        testId="uncontrolled-seed"
        value="seed"
        clearable
        onClearIcon={onClearIcon}
      />
    )
    const input = screen.getByTestId('uncontrolled-seed') as HTMLInputElement
    expect(input.value).toBe('seed')

    await userEvent.type(input, 'X')
    expect(input.value).toBe('seedX')

    const clear = screen.getByTestId('uncontrolled-seed-clear-icon')
    await userEvent.click(clear)
    expect(input.value).toBe('')
    expect(screen.queryByTestId('uncontrolled-seed-clear-icon')).toBeNull()
    expect(onClearIcon).toHaveBeenCalledTimes(1)
  })

  test('clear icon hidden when clearable=false', () => {
    render(
      <FormControl
        label="No clear"
        testId="no-clear"
        value="abc"
        onChange={() => {}}
        clearable={false}
      />
    )
    expect(screen.queryByTestId('no-clear-clear-icon')).toBeNull()
  })

  test('clear icon hidden when readOnly', () => {
    render(
      <FormControl
        label="Read only"
        testId="readonly"
        value="abc"
        onChange={() => {}}
        readOnly
        clearable
      />
    )
    expect(screen.queryByTestId('readonly-clear-icon')).toBeNull()
  })

  test('clear icon hidden when disabled', () => {
    render(
      <FormControl
        label="Disabled"
        testId="disabled"
        value="abc"
        onChange={() => {}}
        disabled
        clearable
      />
    )
    expect(screen.queryByTestId('disabled-clear-icon')).toBeNull()
  })

  test('showDisabledIcon=true renders lock when disabled', () => {
    render(
      <FormControl
        label="Locked"
        testId="locked"
        disabled
        showDisabledIcon
      />
    )
    expect(screen.getByTitle('Locked')).toBeInTheDocument()
  })

  test('showDisabledIcon has no effect when not disabled', () => {
    render(
      <FormControl
        label="Not locked"
        testId="not-locked"
        showDisabledIcon
      />
    )
    expect(screen.queryByTitle('Locked')).toBeNull()
  })

  test('onClearIcon callback is called on clear', async () => {
    const onClearIcon = vi.fn()
    render(
      <FormControl
        label="With clear cb"
        testId="with-clear-cb"
        value="foo"
        onChange={() => {}}
        clearable
        onClearIcon={onClearIcon}
      />
    )
    const clear = screen.getByTestId('with-clear-cb-clear-icon')
    await userEvent.click(clear)
    expect(onClearIcon).toHaveBeenCalledTimes(1)
  })

  test('clear focuses input after click', async () => {
    render(
      <FormControl
        label="Focus after clear"
        testId="focus-after-clear"
        value="foo"
        onChange={() => {}}
        clearable
      />
    )
    const input = screen.getByTestId('focus-after-clear') as HTMLInputElement
    const clear = screen.getByTestId('focus-after-clear-clear-icon')
    await userEvent.click(clear)
    expect(document.activeElement).toBe(input)
  })

  // ----- number-specific coercion / clear-icon visibility (using testId) -----

  test('type=number (controlled) with invalid string renders empty and hides clear icon', () => {
    const handleChange = vi.fn()
    render(
      <FormControl
        label="Num invalid"
        type="number"
        testId="num-invalid"
        // intentionally invalid for number input; component coerces to ''
        value={'1,234' as unknown as number}
        onChange={handleChange}
        clearable
      />
    )
    const input = screen.getByTestId('num-invalid') as HTMLInputElement
    expect(input.value).toBe('')
    expect(screen.queryByTestId('clear-icon')).toBeNull()
  })

  test('type=number (controlled) with valid numeric string shows value and clear icon', () => {
    const handleChange = vi.fn()
    render(
      <FormControl
        label="Num valid"
        type="number"
        testId="num-valid"
        value={'3.14' as unknown as number}
        onChange={handleChange}
        clearable
      />
    )
    const input = screen.getByTestId('num-valid') as HTMLInputElement
    expect(input.value).toBe('3.14')
    expect(screen.getByTestId('num-valid-clear-icon')).toBeInTheDocument()
  })

  test('type=number (uncontrolled) seeded with invalid numeric string renders empty and no clear icon', () => {
    render(
      <FormControl
        label="Num uncontrolled invalid"
        type="number"
        testId="num-unctrl-invalid"
        value={'abc' as unknown as number} // treated as initial seed, coerced to ''
        clearable
      />
    )
    const input = screen.getByTestId('num-unctrl-invalid') as HTMLInputElement
    expect(input.value).toBe('')
    expect(screen.queryByTestId('num-unctrl-invalid-clear-icon')).toBeNull()
  })

  test('type=number (uncontrolled) seeded with valid string is editable and clearable', async () => {
    render(
      <FormControl
        label="Num uncontrolled valid"
        type="number"
        testId="num-unctrl-valid"
        value={'10' as unknown as number}
        clearable
      />
    )
    const input = screen.getByTestId('num-unctrl-valid') as HTMLInputElement
    expect(input.value).toBe('10')

    await userEvent.type(input, '5') // becomes "105"
    expect(input.value).toBe('105')

    const clear = screen.getByTestId('num-unctrl-valid-clear-icon')
    await userEvent.click(clear)
    expect(input.value).toBe('')
    expect(screen.queryByTestId('num-unctrl-valid-clear-icon')).toBeNull()
  })

    test('shows * in the label when required=true (text input)', () => {
    render(
      <FormControl
        label="Required Field"
        testId="required-text"
        required
      />
    )
    const labelEl = screen.getByText('Required Field')
    expect(within(labelEl).getByText('*')).toBeInTheDocument()
  })

  test('does NOT show * when required is false/undefined', () => {
    render(
      <FormControl
        label="Optional Field"
        testId="optional-text"
      />
    )
    const labelEl = screen.getByText('Optional Field')
    expect(within(labelEl).queryByText('*')).toBeNull()
  })

  test('shows * for required custom control (checkbox)', () => {
    render(
      <FormControl
        label="Accept Terms"
        type="checkbox"
        required
        testId="required-checkbox"
      />
    )
    const labelEl = screen.getByText('Accept Terms')
    expect(within(labelEl).getByText('*')).toBeInTheDocument()
  })

  // (optional) ensure asterisk still appears even when disabled but required
  test('required + disabled still shows *', () => {
    render(
      <FormControl
        label="Disabled Required"
        required
        disabled
        testId="required-disabled"
      />
    )
    const labelEl = screen.getByText('Disabled Required')
    expect(within(labelEl).getByText('*')).toBeInTheDocument()
  })


})
