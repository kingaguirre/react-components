// src/Alert/Alert.test.tsx
import React from "react";
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert } from './index';
import { vi } from 'vitest';

describe('Alert Component', () => {
  it('renders alert with title and content', () => {
    render(
      <Alert show={true} title="Test Title" onClose={vi.fn()}>
        Test Content
      </Alert>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Alert show={true} title="Test" onClose={onClose}>
        Content
      </Alert>
    );
    const closeButton = screen.getByTestId('alert-close-icon');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when show is false', () => {
    const { container } = render(
      <Alert show={false} title="Test" onClose={vi.fn()}>
        Content
      </Alert>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders toast inside a portal', () => {
    const onClose = vi.fn();
    render(
      <Alert show={true} toast={true} title="Toast" onClose={onClose}>
        Toast Content
      </Alert>
    );
    // The toast content should be appended to document.body
    expect(document.body.textContent).toContain('Toast Content');
  });
});
