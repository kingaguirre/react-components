// src/setupTests.ts
import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { cleanup } from "@testing-library/react";
import '@testing-library/jest-dom/vitest';
import 'vitest-styled-components';
import 'jest-styled-components';

// Ensure all tests start with a clean slate; avoids leaked portal mocks
afterEach(() => {
  cleanup();
  // Do NOT mutate document.body.innerHTML here.
});

// ──────────────────────────────────────────────────────────────
// Block ALL anchor navigations in tests (fixes jsdom navigation errors)
// ──────────────────────────────────────────────────────────────
let __removeAnchorBlocker: (() => void) | null = null;

beforeAll(() => {
  // Some code may try window.open on blob URLs
  vi.spyOn(window, 'open').mockImplementation(() => null as any);

  const anchorBlocker = (e: Event) => {
    // robust target detection across portals/animations
    const path = (e as any).composedPath?.() ?? [];
    const fromPath = path.find((n: any) => n?.tagName === 'A') as HTMLAnchorElement | undefined;
    const fromTarget =
      (e.target as Element | null)?.closest?.('a') as HTMLAnchorElement | null;

    const a = fromPath ?? fromTarget ?? null;
    if (a) {
      e.preventDefault();
      e.stopPropagation?.();
    }
  };

  // Capture phase so we beat library handlers
  document.addEventListener('click', anchorBlocker, true);
  __removeAnchorBlocker = () => document.removeEventListener('click', anchorBlocker, true);
});

afterAll(() => {
  __removeAnchorBlocker?.();
  (window.open as any).mockRestore?.();
});

/* ──────────────────────────────────────────────────────────────
   ResizeObserver (robust CJS/ESM require)
────────────────────────────────────────────────────────────── */
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ro =
    (require('resize-observer-polyfill') as any)?.default ??
    require('resize-observer-polyfill');
  (globalThis as any).ResizeObserver = ro;
} catch {
  // Silent fallback; only some tests need it.
}

/* ──────────────────────────────────────────────────────────────
   Small DOM polyfills
────────────────────────────────────────────────────────────── */
if (!('scrollTo' in window)) {
  (window as any).scrollTo = vi.fn();
}
if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  // eslint-disable-next-line no-extend-native
  Element.prototype.scrollTo = function (options: any) {
    if (typeof options === 'object') {
      const { top = 0, left = 0 } = options ?? {};
      // @ts-ignore
      this.scrollTop = top;
      // @ts-ignore
      this.scrollLeft = left;
    } else {
      // @ts-ignore
      this.scrollLeft = arguments[0];
      // @ts-ignore
      this.scrollTop = arguments[1];
    }
  };
}
if (!(HTMLElement.prototype as any).scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = vi.fn() as any;
}
if (!('matchMedia' in window)) {
  (window as any).matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

/* ──────────────────────────────────────────────────────────────
   Download plumbing (JSDOM lacks these)
────────────────────────────────────────────────────────────── */
if (typeof URL === 'undefined') {
  (globalThis as any).URL = {} as any;
}
if (typeof URL.createObjectURL === 'function') {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
} else {
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    configurable: true,
    value: vi.fn(() => 'blob:mock'),
  });
}
if (typeof URL.revokeObjectURL === 'function') {
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
} else {
  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    configurable: true,
    value: vi.fn(),
  });
}
if (!(HTMLAnchorElement.prototype as any).click) {
  Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
    writable: true,
    configurable: true,
    value: vi.fn(),
  });
}

/* ──────────────────────────────────────────────────────────────
   FileReader stub so uploads progress to onload
────────────────────────────────────────────────────────────── */
class MockFileReader {
  public result: ArrayBuffer | string | null = null;
  public onload: ((ev: any) => void) | null = null;
  public onerror: ((ev: any) => void) | null = null;

  readAsArrayBuffer(_blob: Blob) {
    this.result = new ArrayBuffer(8);
    setTimeout(() => this.onload?.({ target: this }), 0);
  }
  readAsBinaryString(_blob: Blob) {
    this.result = '\x00\x01';
    setTimeout(() => this.onload?.({ target: this }), 0);
  }
}
vi.stubGlobal('FileReader', MockFileReader);
