// src/components/Loader/_test.tsx
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import Loader from './index';

afterEach(cleanup);

describe('Loader Component', () => {
  test('renders circular spinner by default', () => {
    const { container } = render(<Loader />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('renders line loader when type="line"', () => {
    const { container } = render(<Loader type="line" />);
    const lineContainer = container.querySelector('div');
    expect(lineContainer).toBeInTheDocument();
    expect(lineContainer).toHaveStyle('height: 4px');
  });

  test('determinate circle sets stroke-dasharray on progress', () => {
    const { container } = render(<Loader value={50} />);
    const circles = container.querySelectorAll('circle');
    // last circle is the progress indicator
    const progress = circles[circles.length - 1];
    expect(progress).toBeInTheDocument();
    const dashArr = progress.getAttribute('stroke-dasharray') || '';
    expect(dashArr).toMatch(/^\d+(\.\d+)? \d+(\.\d+)?$/);
  });

  test('buffer circle renders buffer circle with stroke-dasharray', () => {
    const { container } = render(<Loader value={30} valueBuffer={60} />);
    const circles = container.querySelectorAll('circle');
    // circles: [track, buffer, progress]
    const buffer = circles[1];
    expect(buffer).toBeInTheDocument();
    const dash = buffer.getAttribute('stroke-dasharray') || '';
    expect(dash).toMatch(/^\d+(\.\d+)? \d+(\.\d+)?$/);
  });

  test('indeterminate circle has indeterminate class', () => {
    const { container } = render(<Loader />);
    // progress in indeterminate mode has class "indeterminate"
    const progress = container.querySelector('circle.indeterminate');
    expect(progress).toBeInTheDocument();
  });

  test('numeric size sets svg width and height', () => {
    const { container } = render(<Loader size={50} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '50');
    expect(svg).toHaveAttribute('height', '50');
  });

  test('custom thickness sets stroke-width on all circles', () => {
    const { container } = render(<Loader size={40} thickness={8} />);
    const circles = container.querySelectorAll('circle');
    circles.forEach((c) => {
      expect(c).toHaveAttribute('stroke-width', '8');
    });
  });

  test('appends line loader to container when appendTo is provided', () => {
    const target = document.createElement('div');
    target.className = 'portal-target';
    document.body.appendChild(target);

    render(<Loader type="line" appendTo=".portal-target" />);

    // should render inside our target div
    const lineInside = target.querySelector('div');
    expect(lineInside).toBeInTheDocument();

    document.body.removeChild(target);
  });

  test('appends circle loader with overlay to container when appendTo is provided', () => {
    const target = document.createElement('div');
    target.className = 'portal-target';
    document.body.appendChild(target);

    render(<Loader type="default" appendTo=".portal-target" />);

    // overlay should be the only child, wrapping the svg
    expect(target.children).toHaveLength(1);
    const overlay = target.firstElementChild as HTMLElement;
    expect(overlay).toBeInstanceOf(HTMLDivElement);
    expect(overlay.querySelector('svg')).toBeInTheDocument();

    document.body.removeChild(target);
  });
});
