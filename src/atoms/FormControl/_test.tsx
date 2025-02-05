import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { FormControl } from './index';

describe('FormControl Component', () => {
  test('renders a text input with label, help text and shows invalid state when required and empty', async () => {
    render(
      <FormControl
        label="Username"
        helpText="Enter your username"
        required
      />
    );

    // Check that the label is rendered with an asterisk (for required)
    expect(screen.getByText(/Username/)).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();

    // Check that help text is rendered
    expect(screen.getByText(/Enter your username/)).toBeInTheDocument();

    // Default type is text so expect an input with the class "form-control-text"
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('form-control-text');

    // Because the input is required and empty, the effect should mark it invalid.
    await waitFor(() => expect(input).toHaveClass('is-invalid'));
  });

  test('updates invalid state when text input value changes', async () => {
    render(
      <FormControl
        label="Email"
        required
      />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    await waitFor(() => expect(input).toHaveClass('is-invalid'));

    // Simulate entering a valid value using fireEvent.change works fine for state changes
    fireEvent.change(input, { target: { value: 'hello@example.com' } });
    await waitFor(() => expect(input).not.toHaveClass('is-invalid'));
  });

  test('calls onChange callback when text input changes', async () => {
    const handleChange = vi.fn();
    render(
      <FormControl
        label="Name"
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    // Use userEvent.type to simulate a real user typing.
    await userEvent.type(input, 'John Doe');
    // Note: userEvent.type fires onChange for each keystroke.
    expect(handleChange).toHaveBeenCalled(); // Check that it was called at least once
  });

  test('renders a textarea when type is "textarea"', async () => {
    render(
      <FormControl
        label="Description"
        type="textarea"
        required
      />
    );

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');

    await waitFor(() => expect(textarea).toHaveClass('is-invalid'));
  });

  test('renders a custom checkbox control and validates required state', () => {
    const handleChange = vi.fn();
    render(
      <FormControl
        label="Accept Terms"
        type="checkbox"
        required
        onChange={handleChange}
      />
    );

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveClass('is-invalid');

    // For checkboxes, use click to simulate the change.
    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalled();
  });

  test('renders a switch control and validates required state', () => {
    const handleChange = vi.fn();
    render(
      <FormControl
        label="Enable Feature"
        type="switch"
        required
        onChange={handleChange}
      />
    );

    const switchControl = screen.getByRole('checkbox') as HTMLInputElement;
    expect(switchControl).toBeInTheDocument();
    expect(switchControl).toHaveClass('form-control-switch');
    expect(switchControl).toHaveClass('is-invalid');

    // Use click for switch controls as well.
    fireEvent.click(switchControl);
    expect(handleChange).toHaveBeenCalled();
  });

  test('renders disabled input correctly', () => {
    render(
      <FormControl
        label="Disabled Field"
        disabled
      />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  test('renders readOnly input correctly', () => {
    render(
      <FormControl
        label="Read Only Field"
        readOnly
      />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toHaveAttribute('readOnly');
  });

  test('passes pattern attribute to input', () => {
    render(
      <FormControl
        label="Number"
        pattern="[0-9]+"
      />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toHaveAttribute('pattern', '[0-9]+');
  });

  test('renders text for a custom control if "text" prop is provided', () => {
    render(
      <FormControl
        label="Option"
        type="checkbox"
        text="Custom text"
      />
    );

    expect(screen.getByText('Custom text')).toBeInTheDocument();
  });
});
