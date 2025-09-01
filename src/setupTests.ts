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
// ── SheetJS mock ──
// Drives upload parsing from globalThis.__mockUploadRows and captures exports into globalThis.__lastAOA
vi.mock('xlsx', () => {
  const utils = {
    aoa_to_sheet: (aoa: any[][]) => {
      (globalThis as any).__lastAOA = aoa; // capture for assertions
      return { __aoa: aoa } as any;
    },
    book_new: () => ({ SheetNames: [], Sheets: {} } as any),
    book_append_sheet: (wb: any, _ws: any, name: string) => {
      wb.SheetNames.push(name);
      wb.Sheets[name] = {}; // minimal shape
    },
    // Your upload flow will call sheet_to_json(ws). Just return the mocked rows.
    sheet_to_json: (_ws: any) => (globalThis as any).__mockUploadRows ?? [],
  };

  const read = vi.fn((_data: any, _opts?: any) => ({
    SheetNames: ['Sheet1'],
    Sheets: { Sheet1: {} }, // we don’t parse real file content in tests
  }));

  const write = vi.fn((_wb: any, _opts?: any) => new ArrayBuffer(8));

  return {
    __esModule: true,
    default: { utils, read, write },
    utils,
    read,
    write,
  };
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
