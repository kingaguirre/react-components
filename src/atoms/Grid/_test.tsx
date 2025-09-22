// src/atoms/Grid/_test.tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import 'jest-styled-components';
import { Grid, GridItem } from './index';

const pct = (n: number) => `${((n / 12) * 100).toFixed(6)}%`;

describe('Grid', () => {
  it('renders with children', () => {
    render(
      <Grid data-testid="grid-root">
        <GridItem>child-1</GridItem>
        <GridItem>child-2</GridItem>
      </Grid>
    );
    expect(screen.getByTestId('grid-root')).toBeInTheDocument();
  });

  it('forces flex layout and defuses stray grid props even if class="grid" is added', () => {
    render(
      <Grid data-testid="grid-root" className="grid">
        <GridItem>child</GridItem>
      </Grid>
    );
    const root = screen.getByTestId('grid-root');

    // rules inside "&& { ... }"
    // @ts-expect-error
    expect(root).toHaveStyleRule('display', 'block', { modifier: '&&' });
  });

  it('applies modern gap from "spacing" (no negative margins or child padding)', () => {
    render(
      <Grid data-testid="grid-root" spacing={24}>
        <div>c1</div>
        <div>c2</div>
      </Grid>
    );

    const root = screen.getByTestId('grid-root');
    const grid = root.querySelector('.grid-component') as HTMLElement;
    expect(grid).toBeTruthy();

    // container styles still present outside &&
    expect(grid).toHaveStyleRule('box-sizing', 'border-box');

    // NEW: gap & CSS vars live inside `&& { ... }`
    expect(grid).toHaveStyleRule('gap', 'var(--gap)', { modifier: '&&' });
    expect(grid).toHaveStyleRule('--gap', '24px', { modifier: '&&' });
    expect(grid).toHaveStyleRule('--col', 'calc((100% - (11 * var(--gap))) / 12)', {
      modifier: '&&',
    });

    // no legacy negative margins
    expect(grid).not.toHaveStyleRule('margin', expect.anything());

    // no legacy child padding rule (any selector variant)
    const childModifiers = ['& > *', '&>*', '&& > *', '&&>*'];
    for (const m of childModifiers) {
      expect(grid).not.toHaveStyleRule('padding', expect.anything(), { modifier: m });
    }
  });

  it('passes className/style/role/aria through and supports polymorphic "as"', () => {
    render(
      <Grid
        data-testid="grid-root"
        className="custom-class"
        role="list"
        aria-label="grid-list"
        as="section"
      >
        <div>child</div>
      </Grid>
    );
    const root = screen.getByTestId('grid-root');
    expect(root).toHaveClass('custom-class');
    expect(root.tagName).toBe('SECTION');
  });
});

describe('GridItem', () => {
  it('sets base layout rules (flex/min-width/box-sizing)', () => {
    render(
      <Grid>
        <GridItem data-testid="gi" >Test</GridItem>
      </Grid>
    );
    const gi = screen.getByTestId('gi');
    // @ts-expect-error
    expect(gi).toHaveStyleRule('flex', '0 0 auto');
    // @ts-expect-error
    expect(gi).toHaveStyleRule('box-sizing', 'border-box');
    // @ts-expect-error
    expect(gi).toHaveStyleRule('min-width', '0');
  });

  const w = (s: number) => `calc(var(--col) * ${s} + var(--gap) * ${s - 1})`;
  it('applies width/flex-basis/max-width for xs (no media)', () => {
    render(
      <Grid>
        <GridItem data-testid="gi" xs={12} />
      </Grid>
    );
    const gi = screen.getByTestId('gi');

    // @ts-expect-error
    expect(gi).toHaveStyleRule('width', w(12));
    // @ts-expect-error
    expect(gi).toHaveStyleRule('flex-basis', w(12));
    // @ts-expect-error
    expect(gi).toHaveStyleRule('max-width', w(12));
  });

  it('applies offset (margin-left) and order', () => {
    render(
      <Grid>
        <GridItem data-testid="gi" xs={6} offset={1} order={5} >Test</GridItem>
      </Grid>
    );
    const gi = screen.getByTestId('gi');
    // @ts-expect-error
    expect(gi).toHaveStyleRule('margin-left', pct(1));
    // @ts-expect-error
    expect(gi).toHaveStyleRule('order', '5');
  });

  it('data-* present and $* transient props do not leak', () => {
    render(
      <Grid>
        <GridItem data-testid="gi" xs={12} sm={6} md={4} lg={3} xl={2} offset={1} order={2} >Test</GridItem>
      </Grid>
    );
    const gi = screen.getByTestId('gi');
    expect(gi).toHaveAttribute('data-xs', '12');
    expect(gi).toHaveAttribute('data-sm', '6');
    expect(gi).toHaveAttribute('data-md', '4');
    expect(gi).toHaveAttribute('data-lg', '3');
    expect(gi).toHaveAttribute('data-xl', '2');
    expect(gi).toHaveAttribute('data-offset', '1');
    expect(gi).toHaveAttribute('data-order', '2');

    expect(gi.getAttribute('$xs')).toBeNull();
    expect(gi.getAttribute('$sm')).toBeNull();
    expect(gi.getAttribute('$md')).toBeNull();
    expect(gi.getAttribute('$lg')).toBeNull();
    expect(gi.getAttribute('$xl')).toBeNull();
    expect(gi.getAttribute('$offset')).toBeNull();
    expect(gi.getAttribute('$order')).toBeNull();
  });
});

// ⬇️ Replace the whole "Grid child validation" describe block with this
describe('Grid child validation', () => {
  it('shows a non-crashing warning when there are zero GridItem children (and ignores invalid ones)', () => {
    render(
      <Grid data-testid="grid-root" debugWarnings>
        {/* invalid child only */}
        <div data-testid="bad-child">nope</div>
      </Grid>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('data-testid', 'grid-error');

    const text = (alert.textContent || '').toLowerCase();
    expect(text).toContain('requires at least one');   // zero-valid branch
    expect(text).toContain('ignored:');                // lists invalids

    // invalid child should NOT render
    expect(screen.queryByTestId('bad-child')).toBeNull();
  });

  it('shows a warning when a non-GridItem sibling exists alongside a valid GridItem (and ignores the invalid)', () => {
    render(
      <Grid data-testid="grid-root" debugWarnings>
        <GridItem data-testid="valid">ok</GridItem>
        <div data-testid="bad-child">nope</div>
      </Grid>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('data-testid', 'grid-error');

    const text = (alert.textContent || '').toLowerCase();
    expect(text).toContain('only accepts');            // mixed-valid/invalid branch
    expect(text).toContain('ignored:');

    // invalid child should NOT render
    expect(screen.queryByTestId('bad-child')).toBeNull();
  });

  it('does not show the warning box when all children are GridItem', () => {
    render(
      <Grid data-testid="grid-root" debugWarnings>
        <GridItem xs={6}>a</GridItem>
        <GridItem xs={6}>b</GridItem>
      </Grid>
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByTestId('grid-error')).toBeNull();
  });
  
});

// ─────────────────────────────────────────────────────────────────────────────
// New tests for debugWarnings feature (relaxed vs. strict mode)
// ─────────────────────────────────────────────────────────────────────────────

describe('Grid debugWarnings (new feature)', () => {
  it('RELAXED (default): renders any children and shows NO warning', () => {
    render(
      <Grid data-testid="grid-root">
        <div data-testid="bad-child">loose div</div>
        {'inline text'}
        <GridItem data-testid="good-child">ok</GridItem>
      </Grid>
    );

    // All children render (no filtering)
    expect(screen.getByTestId('bad-child')).toBeInTheDocument();
    expect(screen.getByTestId('good-child')).toBeInTheDocument();

    // No warning box by default
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByTestId('grid-error')).toBeNull();
  });

  it('STRICT (debugWarnings=true): filters invalids and warns (original strict behavior)', () => {
    render(
      <Grid data-testid="grid-root" debugWarnings>
        <GridItem data-testid="good-child">ok</GridItem>
        <div data-testid="bad-child">nope</div>
      </Grid>
    );

    // Invalid child should be filtered out
    expect(screen.queryByTestId('bad-child')).toBeNull();

    // Valid child remains
    expect(screen.getByTestId('good-child')).toBeInTheDocument();

    // Warning visible (mixed children branch)
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('data-testid', 'grid-error');
    expect((alert.textContent || '').toLowerCase()).toContain('only accepts');
    expect((alert.textContent || '').toLowerCase()).toContain('ignored:');
  });

  it('STRICT: with NO children at all → shows "requires at least one <GridItem />."', () => {
    render(<Grid data-testid="grid-root" debugWarnings />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect((alert.textContent || '').toLowerCase()).toContain('requires at least one');
    // No invalid list if there were literally no children
    expect((alert.textContent || '').toLowerCase()).not.toContain('ignored:');
  });

  it('STRICT: whitespace-only text nodes are ignored (still treated as zero-valid)', () => {
    render(
      <Grid data-testid="grid-root" debugWarnings>
        {'   '}
        {'\n\t '}
      </Grid>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    const text = (alert.textContent || '').toLowerCase();
    expect(text).toContain('requires at least one'); // zero-valid branch
    // Pure whitespace shouldn’t be listed as "ignored"
    expect(text).not.toContain('ignored:');
  });

  it('STRICT: fragments are flattened (invalids inside fragments are filtered + warned)', () => {
    render(
      <Grid data-testid="grid-root" debugWarnings>
        <>
          <GridItem data-testid="good-child">ok</GridItem>
          <div data-testid="bad-child">nope</div>
        </>
      </Grid>
    );

    // Invalid inside fragment should be filtered
    expect(screen.queryByTestId('bad-child')).toBeNull();
    // Valid remains
    expect(screen.getByTestId('good-child')).toBeInTheDocument();

    // Warning shows (mixed branch)
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect((alert.textContent || '').toLowerCase()).toContain('only accepts');
    expect((alert.textContent || '').toLowerCase()).toContain('ignored:');
  });

  it('STRICT: lists invalid names using component displayName/name', () => {
    const BadFC: React.FC<{ 'data-testid'?: string }> = (p) => <div {...p} />;
    (BadFC as any).displayName = 'BadThing';

    render(
      <Grid debugWarnings>
        <GridItem>ok</GridItem>
        <BadFC data-testid="bad-child" />
      </Grid>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    const text = alert.textContent || '';
    // Should include our component name in the ignored list
    expect(text).toMatch(/Ignored:\s.*BadThing/);
    // And the invalid element should be filtered out
    expect(screen.queryByTestId('bad-child')).toBeNull();
  });

  it('RELAXED: even zero-valid (only invalids) should NOT warn and should render them', () => {
    render(
      <Grid data-testid="grid-root">
        <div data-testid="bad-child-1">a</div>
        <span data-testid="bad-child-2">b</span>
      </Grid>
    );

    // Both render
    expect(screen.getByTestId('bad-child-1')).toBeInTheDocument();
    expect(screen.getByTestId('bad-child-2')).toBeInTheDocument();

    // No warning in relaxed mode
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
