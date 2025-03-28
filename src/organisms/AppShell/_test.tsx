import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import AppShell from './index';

describe('AppShell Component', () => {
  const dynamicIcons = [
    { icon: '⭐', onClick: jest.fn() },
    { icon: '⚙️', onClick: jest.fn() },
  ];

  const dropdownItems = [
    { label: 'Item 1', onClick: jest.fn() },
    { label: 'Item 2', onClick: jest.fn() },
  ];

  test('renders header with title and name', () => {
    render(
      <AppShell
        title="Dashboard"
        name="John Doe"
        dynamicIcons={dynamicIcons}
        dropdownItems={dropdownItems}
      />
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('toggle collapse icon changes when clicked', () => {
    render(
      <AppShell title="Dashboard" name="John Doe" dynamicIcons={[]} dropdownItems={[]} />
    );
    const toggleButton = screen.getByTestId('toggle-button');
    // Initially should show collapse icon (🡄)
    expect(toggleButton).toHaveTextContent('🡄');
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveTextContent('🡆');
  });

  test('dropdown menu appears when dropdown icon clicked', () => {
    render(
      <AppShell title="Dashboard" name="John Doe" dynamicIcons={[]} dropdownItems={dropdownItems} />
    );
    const dropdownButton = screen.getByTestId('dropdown-button');
    fireEvent.click(dropdownButton);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });
});
