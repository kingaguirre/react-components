import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExampleOrganism } from './index';

describe('ExampleOrganism', () => {
  test('renders heading and three ExampleMolecule components', () => {
    render(<ExampleOrganism />);
    
    // Check the main heading.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Example Organism');
    
    // Check that all expected labels are rendered.
    expect(screen.getByText(/Your Name/)).toBeInTheDocument();
    expect(screen.getByText(/Your Email/)).toBeInTheDocument();
    expect(screen.getByText(/Agree/)).toBeInTheDocument();
    
    // For the checkbox, we expect a checkbox element.
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });
});
