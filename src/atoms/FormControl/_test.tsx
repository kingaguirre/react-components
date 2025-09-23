// src/atoms/FormControl/index.tsx
import { useState } from 'react'
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
        onChange={() => { }}
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
        onChange={() => { }}
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
        onChange={() => { }}
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
    );

    // target the lock icon element, not the label
    const lockIcon = screen
      .getAllByTitle('Locked')
      .find(el => el.classList.contains('container-icon') && el.classList.contains('lock-icon'));
    expect(lockIcon).toBeTruthy();
  });


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
        onChange={() => { }}
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
        onChange={() => { }}
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

  test('checkbox-group: renders options, respects value, fires onChange with value', async () => {
    const onChange = vi.fn()
    render(
      <FormControl
        label="Prefs"
        type="checkbox-group"
        testId="prefs"
        options={[
          { value: 'a', text: 'Alpha' },
          { value: 'b', text: 'Beta' },
          { value: 'c', text: 'Gamma' },
        ]}
        value={['b']}
        onChange={onChange}
      />
    )

    const a = screen.getByTestId('prefs-a') as HTMLInputElement
    const b = screen.getByTestId('prefs-b') as HTMLInputElement
    const c = screen.getByTestId('prefs-c') as HTMLInputElement

    expect(a.checked).toBe(false)
    expect(b.checked).toBe(true)
    expect(c.checked).toBe(false)

    await userEvent.click(c)
    expect(onChange).toHaveBeenCalledWith('b,c')
  })

  test('checkbox-group: disabled option cannot be toggled', async () => {
    const onChange = vi.fn();
    render(
      <FormControl
        label="Prefs"
        type="checkbox-group"
        testId="prefs2"
        options={[
          { value: 'a', text: 'Alpha', disabled: true },
          { value: 'b', text: 'Beta' },
        ]}
        value={null}
        onChange={onChange}
      />
    );

    const a = screen.getByTestId('prefs2-a') as HTMLInputElement;
    expect(a).toBeDisabled();
    await userEvent.click(a);
    expect(onChange).not.toHaveBeenCalled();
  });

  test('checkbox-group: empty options shows "No Options found"', () => {
    render(
      <FormControl
        label="Empty"
        type="checkbox-group"
        options={[]}
      />
    );
    expect(screen.getByText('No Options found')).toBeInTheDocument();
  });

  test('radio-group: renders options, respects value, fires onChange with value', async () => {
    const onChange = vi.fn()
    render(
      <FormControl
        label="Choice"
        type="radio-group"
        testId="choice"
        options={[
          { value: 'x', text: 'X' },
          { value: 'y', text: 'Y' },
        ]}
        // IMPORTANT: public API usually "value" (single)
        value="x"
        onChange={onChange}
      />
    )

    const x = screen.getByTestId('choice-x') as HTMLInputElement
    const y = screen.getByTestId('choice-y') as HTMLInputElement

    expect(x.checked).toBe(true)
    expect(y.checked).toBe(false)

    await userEvent.click(y)
    expect(onChange).toHaveBeenCalledWith('y')
  })

  test('radio-group: empty options shows "No Options found"', () => {
    render(
      <FormControl
        label="Choice empty"
        type="radio-group"
        options={[]}
      />
    );
    expect(screen.getByText('No Options found')).toBeInTheDocument();
  });

  test('switch-group: renders options, respects value, fires onChange', async () => {
    const onChange = vi.fn()
    render(
      <FormControl
        label="Toggles"
        type="switch-group"
        testId="toggles"
        options={[
          { value: 'on', text: 'On' },
          { value: 'off', text: 'Off' },
        ]}
        value={['on']}
        onChange={onChange}
      />
    )

    const on = screen.getByTestId('toggles-on') as HTMLInputElement
    const off = screen.getByTestId('toggles-off') as HTMLInputElement

    expect(on.checked).toBe(true)
    expect(off.checked).toBe(false)

    await userEvent.click(off)
    expect(onChange).toHaveBeenCalledWith('on,off')
  })

  test('switch-group: empty options shows "No Options found"', () => {
    render(
      <FormControl
        label="Toggles empty"
        type="switch-group"
        options={[]}
      />
    );
    expect(screen.getByText('No Options found')).toBeInTheDocument();
  });

  test('radio-button-group: renders options, respects value, fires onChange via input', async () => {
    const onChange = vi.fn()
    render(
      <FormControl
        label="RBGroup"
        type="radio-button-group"
        testId="rb"
        options={[
          { value: 'r1', text: 'R1' },
          { value: 'r2', text: 'R2' },
        ]}
        value="r1"
        onChange={onChange}
      />
    )

    const r1 = screen.getByTestId('rb-r1') as HTMLInputElement
    const r2 = screen.getByTestId('rb-r2') as HTMLInputElement

    expect(r1.checked).toBe(true)
    expect(r2.checked).toBe(false)

    await userEvent.click(r2)
    expect(onChange).toHaveBeenCalledWith('r2')
  })

  // --- LAYOUT & SIZE FLAGS (smoke checks) ---

  test('group containers render with vertical layout flag without crashing', () => {
    render(
      <>
        <FormControl
          label="CG vertical"
          type="checkbox-group"
          options={[{ value: 'a', text: 'A' }]}
          isVerticalOptions
        />
        <FormControl
          label="RG vertical"
          type="radio-group"
          options={[{ value: 'x', text: 'X' }]}
          isVerticalOptions
        />
        <FormControl
          label="SG vertical"
          type="switch-group"
          options={[{ value: 's1', text: 'S1' }]}
          isVerticalOptions
        />
        <FormControl
          label="RBG vertical"
          type="radio-button-group"
          options={[{ value: 'r1', text: 'R1' }]}
          isVerticalOptions
        />
      </>
    );

    // Containers exist
    expect(document.querySelector('.group-control-container.checkbox-group')).toBeInTheDocument();
    expect(document.querySelector('.group-control-container.radio-group')).toBeInTheDocument();
    expect(document.querySelector('.group-control-container.switch-group')).toBeInTheDocument();
    expect(document.querySelector('.group-control-container.radio-button-group')).toBeInTheDocument();
  });

  test('size="sm" renders groups without errors (gap changes internally)', () => {
    render(
      <>
        <FormControl
          label="CG sm"
          type="checkbox-group"
          size="sm"
          testId="cg-sm"
          options={[{ value: 'a', text: 'A' }]}
          values={[]} // no preselect
        />
        <FormControl
          label="RG sm"
          type="radio-group"
          size="sm"
          testId="rg-sm"
          options={[{ value: 'x', text: 'X' }]}
          value="" // no preselect
        />
      </>
    )

    // Inputs exist and are addressable via testId pattern
    expect(screen.getByTestId('cg-sm-a')).toBeInTheDocument()
    expect(screen.getByTestId('rg-sm-x')).toBeInTheDocument()
  })

  test('value-only (no onChange) mirrors later prop updates into the input', async () => {
    const { rerender } = render(
      <FormControl
        label="Mirror"
        testId="mirror"
        value="seed"
        clearable
      />
    )

    const input = screen.getByTestId('mirror') as HTMLInputElement
    expect(input.value).toBe('seed')

    // Prove it's editable (uncontrolled semantics)
    await userEvent.type(input, 'X')
    expect(input.value).toBe('seedX')

    // Parent updates the value prop — component must resync the DOM value
    rerender(
      <FormControl
        label="Mirror"
        testId="mirror"
        value="NEW"
        clearable
      />
    )

    await waitFor(() => expect(input.value).toBe('NEW'))
    // Clear icon should still be visible since there's content
    expect(screen.getByTestId('mirror-clear-icon')).toBeInTheDocument()
  })

  test('type=number with value-only resyncs and coerces invalid tokens on prop change', async () => {
    const { rerender } = render(
      <FormControl
        label="Num Mirror"
        type="number"
        testId="num-mirror"
        value={'12' as unknown as number}
        clearable
      />
    )
    const input = screen.getByTestId('num-mirror') as HTMLInputElement
    expect(input.value).toBe('12')

    await userEvent.type(input, '3') // user edit
    expect(input.value).toBe('123')

    // Now parent sets an invalid numeric token → should coerce to ''
    rerender(
      <FormControl
        label="Num Mirror"
        type="number"
        testId="num-mirror"
        value={'abc' as unknown as number}
        clearable
      />
    )
    await waitFor(() => expect(input.value).toBe(''))
    expect(screen.queryByTestId('num-mirror-clear-icon')).toBeNull()
  })

  test('value-only (no onChange) mirrors parent state updates triggered by button', async () => {
    function Parent() {
      const [val, setVal] = useState('seed');
      return (
        <>
          <FormControl
            label="Mirror Btn"
            testId="mirror-btn"
            value={val}
            clearable
          />
          <button type="button" onClick={() => setVal('next')}>set-next</button>
          <button type="button" onClick={() => setVal((v) => v + 'X')}>append-x</button>
        </>
      );
    }

    render(<Parent />);

    const input = screen.getByTestId('mirror-btn') as HTMLInputElement;
    expect(input.value).toBe('seed');

    // Prove the field is still editable (uncontrolled semantics)
    await userEvent.type(input, 'U');
    expect(input.value).toBe('seedU');

    // Parent replaces value via button → input reflects it
    await userEvent.click(screen.getByRole('button', { name: /set-next/i }));
    await waitFor(() => expect(input.value).toBe('next'));

    // Parent updates via functional setState → input reflects it
    await userEvent.click(screen.getByRole('button', { name: /append-x/i }));
    await waitFor(() => expect(input.value).toBe('nextX'));

    // Clear icon should be visible since input has content
    expect(screen.getByTestId('mirror-btn-clear-icon')).toBeInTheDocument();
  });


})
