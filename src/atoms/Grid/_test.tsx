// src/atoms/Grid/_test.tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import 'jest-styled-components';
import { Grid, GridItem } from './index';

const pct = (n: number) => `${((n / 12) * 100).toFixed(6)}%`;

/** Try multiple modifier spellings SC may emit for the same nested selector */
function expectStyleRuleWithAnyModifier(
  el: HTMLElement,
  property: string,
  value: string,
  modifiers: string[]
) {
  let lastErr: unknown;
  for (const modifier of modifiers) {
    try {
      // @ts-expect-error jest-styled-components matcher types
      expect(el).toHaveStyleRule(property, value, { modifier });
      return;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error(`No modifier matched for ${property}: ${value}`);
}

// --- helpers: robust CSS scan across all SC classes + media variants ---
function assertRuleInMedia(el: HTMLElement, minWidthPx: number, property: string, value: string) {
  const classes = Array.from(el.classList); // include both sc-… and hashed classes
  if (!classes.length) throw new Error('Element has no classes to match against.');

  const styles = Array.from(document.querySelectorAll('style'))
    .map((s) => s.textContent || '')
    .join('\n');

  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Accept spacing/no-spacing and "screen"/"only screen" variants
  const mediaHeads = [
    String.raw`@media\s*\(\s*min-width\s*:\s*${minWidthPx}\s*px\s*\)`,
    String.raw`@media\s*screen\s*and\s*\(\s*min-width\s*:\s*${minWidthPx}\s*px\s*\)`,
    String.raw`@media\s*only\s*screen\s*and\s*\(\s*min-width\s*:\s*${minWidthPx}\s*px\s*\)`,
  ];

  for (const cls of classes) {
    const clsEsc = esc(cls);
    for (const head of mediaHeads) {
      // @media … { … .<class> { … property: value; … } … }
      const re = new RegExp(
        `${head}\\s*\\{[\\s\\S]*?\\.${clsEsc}[^\\{]*\\{[\\s\\S]*?${esc(property)}\\s*:\\s*${esc(
          value
        )}\\s*;[\\s\\S]*?\\}`,
        'm'
      );
      if (re.test(styles)) return; // found it for this class & media variant
    }
  }

  // Not found: show some debug context
  const preview = styles.slice(0, 2000);
  throw new Error(
    `Responsive rule not found for ANY of classes [${classes.join(
      ' '
    )}] @ ${minWidthPx}px → ${property}: ${value}\nFirst 2KB of styles:\n${preview}`
  );
}

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
    expect(root).toHaveStyleRule('display', 'flex', { modifier: '&&' });
    // @ts-expect-error
    expect(root).toHaveStyleRule('flex-wrap', 'wrap', { modifier: '&&' });
    // @ts-expect-error
    expect(root).toHaveStyleRule('grid-template-columns', 'initial', { modifier: '&&' });
    // @ts-expect-error
    expect(root).toHaveStyleRule('grid-auto-rows', 'initial', { modifier: '&&' });
  });

  it('applies negative outer margin and child padding from "spacing"', () => {
    render(
      <Grid data-testid="grid-root" spacing={24}>
        <div>c1</div>
        <div>c2</div>
      </Grid>
    );
    const root = screen.getByTestId('grid-root');

    // container
    // @ts-expect-error
    expect(root).toHaveStyleRule('box-sizing', 'border-box');
    // @ts-expect-error
    expect(root).toHaveStyleRule('margin', '-12px');

    // children padding (SC v6 can serialize nested selector a few ways)
    const childModifiers = [
      '& > *',          // typical
      '&>*',            // no spaces
      '&& > *',         // specificity-lifted variant
      '&&>*',           // no spaces with &&
    ];
    expectStyleRuleWithAnyModifier(root, 'padding', '12px', childModifiers);
  });

  it('passes className/style/role/aria through and supports polymorphic "as"', () => {
    render(
      <Grid
        data-testid="grid-root"
        className="custom-class"
        style={{ backgroundColor: 'rgb(1, 2, 3)' }}
        role="list"
        aria-label="grid-list"
        as="section"
      >
        <div>child</div>
      </Grid>
    );
    const root = screen.getByTestId('grid-root');
    expect(root).toHaveClass('custom-class');
    expect(root).toHaveStyle('background-color: rgb(1, 2, 3)');
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

  it('applies width/flex-basis/max-width for xs (no media)', () => {
    render(
      <Grid>
        <GridItem data-testid="gi" xs={12} />
      </Grid>
    );
    const gi = screen.getByTestId('gi');
    const p = pct(12);
    // @ts-expect-error
    expect(gi).toHaveStyleRule('width', p);
    // @ts-expect-error
    expect(gi).toHaveStyleRule('flex-basis', p);
    // @ts-expect-error
    expect(gi).toHaveStyleRule('max-width', p);
  });

  it('applies responsive width rules for sm/md/lg/xl (CSS-scan, zero flake)', () => {
    render(
      <Grid>
        <GridItem data-testid="gi" xs={12} sm={6} md={4} lg={3} xl={2} >Test</GridItem>
      </Grid>
    );
    const gi = screen.getByTestId('gi');
    const pct = (n: number) => `${((n / 12) * 100).toFixed(6)}%`;

    // sm: 576px
    assertRuleInMedia(gi, 576, 'width', pct(6));
    assertRuleInMedia(gi, 576, 'flex-basis', pct(6));
    assertRuleInMedia(gi, 576, 'max-width', pct(6));

    // md: 768px
    assertRuleInMedia(gi, 768, 'width', pct(4));
    assertRuleInMedia(gi, 768, 'flex-basis', pct(4));
    assertRuleInMedia(gi, 768, 'max-width', pct(4));

    // lg: 992px
    assertRuleInMedia(gi, 992, 'width', pct(3));
    assertRuleInMedia(gi, 992, 'flex-basis', pct(3));
    assertRuleInMedia(gi, 992, 'max-width', pct(3));

    // xl: 1200px
    assertRuleInMedia(gi, 1200, 'width', pct(2));
    assertRuleInMedia(gi, 1200, 'flex-basis', pct(2));
    assertRuleInMedia(gi, 1200, 'max-width', pct(2));
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
      <Grid data-testid="grid-root">
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
      <Grid data-testid="grid-root">
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
      <Grid data-testid="grid-root">
        <GridItem xs={6}>a</GridItem>
        <GridItem xs={6}>b</GridItem>
      </Grid>
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByTestId('grid-error')).toBeNull();
  });
});

