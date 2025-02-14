// src/molecules/Accordion/Accordion.test.tsx
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Accordion from './index';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Polyfill for ResizeObserver for testing environments
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

const items: any = [
  { title: 'Item 1', children: <div>Content 1</div>, color: 'primary' },
  { title: 'Item 2', children: <div>Content 2</div>, color: 'success' },
];

describe('Accordion Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders accordion items', () => {
    render(<Accordion items={items} allowMultiple={true} />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

});
