import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExampleMolecule } from './index';

describe('ExampleMolecule', () => {
  test('renders with given label and default text input', () => {
    render(<ExampleMolecule label="Test Label" />);
    
    // Check that the label is rendered.
    expect(screen.getByText(/Test Label/)).toBeInTheDocument();
    
    // Since FormControl is used with placeholder "Type here...", verify it.
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
    
    // Default type is "text", so the textbox role should be available.
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('renders a checkbox when type is set to "checkbox"', () => {
    render(<ExampleMolecule label="Checkbox Test" type="checkbox" />);
    
    // Check that the label is rendered.
    expect(screen.getByText(/Checkbox Test/)).toBeInTheDocument();
    
    // The input should be rendered as a checkbox.
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });
});
