import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExamplePOC } from './index';

describe('ExamplePOC', () => {
  test('renders heading and multiple ExampleMolecule components with various types', () => {
    render(<ExamplePOC />);
    
    // Check the main heading.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Example POC');
    
    // Verify that the expected labels are rendered.
    expect(screen.getByText(/Label Text/)).toBeInTheDocument();
    expect(screen.getByText(/Checkbox/)).toBeInTheDocument();
    expect(screen.getByText(/Radio/)).toBeInTheDocument();
    expect(screen.getByText(/Switch/)).toBeInTheDocument();

  });
});
