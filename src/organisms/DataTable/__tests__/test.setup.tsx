import ReactDOM from 'react-dom';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { getDeepValue, setDeepValue } from '../utils'; // relative to this file
import type { ColumnSetting } from '../interface';

// ─────────────────────────────────────────────────────────────────────────────
// Global test flags/state
// ─────────────────────────────────────────────────────────────────────────────
declare global {
  var __lastAOA: any[] | null;
  var __mockUploadRows: Array<Record<string, any>> | null;
}
globalThis.__lastAOA = null;
globalThis.__mockUploadRows = null;

// ─────────────────────────────────────────────────────────────────────────────
// ExcelJS mock – captures AOA on export; provides csv/xlsx writeBuffer
// ─────────────────────────────────────────────────────────────────────────────
vi.mock('exceljs', () => {
  class MockWorksheet {
    name: string;
    rows: any[][] = [];
    constructor(name: string) { this.name = name; }
    addRows(aoa: any[][]) {
      // Mirror previous behaviour: expose the last AOA for assertions
      (globalThis as any).__lastAOA = aoa;
      this.rows.push(...aoa);
    }
  }

  class Workbook {
    worksheets: MockWorksheet[] = [];

    addWorksheet(name: string) {
      const ws = new MockWorksheet(name);
      this.worksheets.push(ws);
      return ws as unknown as import('exceljs').Worksheet;
    }

    // match the API used in your component:
    // await wb.xlsx.writeBuffer() and await wb.csv.writeBuffer()
    xlsx = {
      writeBuffer: vi.fn(async () => new Uint8Array([0, 1, 2])),
    };
    csv = {
      writeBuffer: vi.fn(async () => new Uint8Array([3, 4, 5])),
    };
  }

  return {
    __esModule: true,
    Workbook,
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// Axios mock (ESM safe; callable default with .get)
// ─────────────────────────────────────────────────────────────────────────────
vi.mock('axios', () => {
  const get = vi.fn();
  const axiosFn = Object.assign(vi.fn(), { get });
  return { default: axiosFn, get };
});

// ─────────────────────────────────────────────────────────────────────────────
// URL & anchor stubs (download flows)
// ─────────────────────────────────────────────────────────────────────────────
beforeAll(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
afterAll(() => {
  (URL.createObjectURL as any).mockRestore?.();
  (URL.revokeObjectURL as any).mockRestore?.();
  (HTMLAnchorElement.prototype.click as any).mockRestore?.();
});

// ─────────────────────────────────────────────────────────────────────────────
// Portal → inline
// ─────────────────────────────────────────────────────────────────────────────
let portalSpy: ReturnType<typeof vi.spyOn> | null = null;
beforeEach(() => {
  portalSpy = vi
    .spyOn(ReactDOM, 'createPortal')
    .mockImplementation((node) => node as unknown as React.ReactPortal);
});
afterEach(() => {
  vi.useRealTimers();
  portalSpy?.mockRestore?.();
});

// ─────────────────────────────────────────────────────────────────────────────
// Worker mock – mirrors your worker’s patch semantics
// ─────────────────────────────────────────────────────────────────────────────
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((err: any) => void) | null = null
  private _terminated = false

  constructor(_url?: string) {}

  postMessage(msg: any) {
    try {
      // ── UPLOAD FLOW: ImportWorker posts { kind: 'xlsx' | 'csv', ... }
      if (msg && (msg.kind === 'xlsx' || msg.kind === 'csv')) {
        const rows = (globalThis as any).__mockUploadRows ?? []
        // simulate async parse → one CHUNK then DONE
        setTimeout(() => {
          if (this._terminated) return
          if (rows.length) {
            this.onmessage?.({ data: { type: 'chunk', chunk: rows } } as MessageEvent)
          }
          this.onmessage?.({ data: { type: 'done' } } as MessageEvent)
        }, 0)
        return
      }

      // ── CELL-EDIT FLOW (existing behaviour)
      const { rowData, accessor, val } = msg
      const currentValue = getDeepValue(rowData, accessor)
      const currentStr = currentValue == null ? '' : String(currentValue)
      const newStr = val == null ? '' : String(val)

      if (currentStr === newStr) {
        this.onmessage?.({ data: { unchanged: true } } as MessageEvent)
      } else {
        const updatedRow = setDeepValue(rowData, accessor, val)
        this.onmessage?.({ data: { updatedRow } } as MessageEvent)
      }
    } catch (error: any) {
      this.onmessage?.({ data: { error: error.message } } as MessageEvent)
    }
  }

  terminate() {
    this._terminated = true
  }
}

// keep these assignments as they were
;(globalThis as any).Worker = MockWorker as any
;(window as any).Worker = MockWorker as any

// ─────────────────────────────────────────────────────────────────────────────
// Misc stubs
// ─────────────────────────────────────────────────────────────────────────────
window.HTMLElement.prototype.scrollIntoView = function () {};
(window as any).scrollTo = vi.fn();

beforeEach(() => {
  globalThis.__lastAOA = null;
  globalThis.__mockUploadRows = [];
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers exported for tests
// ─────────────────────────────────────────────────────────────────────────────
import { screen, waitFor } from '@testing-library/react';

/** Wait until table's data-disabled="false" is present */
export async function waitForTableToBeInteractive(id: string) {
  await waitFor(() => {
    expect(screen.getByTestId(id)).toHaveAttribute('data-disabled', 'false');
  });
}

// Sample data (deep profile)
export const sampleData = [
  {
    id: '0',
    firstName: 'John',
    lastname: 'Doe',
    role: 'Admin',
    userInfo: { profile: { username: 'johndoe', bio: 'Senior Developer at XYZ' } },
  },
  {
    id: '1',
    firstName: 'Jane',
    lastname: 'Smith',
    role: 'User',
    userInfo: { profile: { username: 'janesmith', bio: 'Product Manager at ABC' } },
  },
  {
    id: '2',
    firstName: 'Alice',
    lastname: 'Johnson',
    role: 'User',
    userInfo: { profile: { username: 'alicej', bio: 'UX Designer at DEF' } },
  },
  {
    id: '3',
    firstName: 'Bob',
    lastname: 'Brown',
    role: 'User',
    userInfo: { profile: { username: 'bobb', bio: 'QA Engineer at GHI' } },
  },
  {
    id: '4',
    firstName: 'Carol',
    lastname: 'Williams',
    role: 'Admin',
    userInfo: { profile: { username: 'carolw', bio: 'DevOps Engineer at JKL' } },
  },
  {
    id: '5',
    firstName: 'David',
    lastname: 'Jones',
    role: 'User',
    userInfo: { profile: { username: 'davidj', bio: 'Frontend Developer at MNO' } },
  },
  {
    id: '6',
    firstName: 'Eva',
    lastname: 'Miller',
    role: 'User',
    userInfo: { profile: { username: 'evam', bio: 'Data Scientist at PQR' } },
  },
  {
    id: '7',
    firstName: 'Frank',
    lastname: 'Davis',
    role: 'Admin',
    userInfo: { profile: { username: 'frankd', bio: 'Backend Developer at STU' } },
  },
  {
    id: '8',
    firstName: 'Grace',
    lastname: 'Garcia',
    role: 'User',
    userInfo: { profile: { username: 'graceg', bio: 'Project Manager at VWX' } },
  },
  {
    id: '9',
    firstName: 'Henry',
    lastname: 'Martinez',
    role: 'User',
    userInfo: { profile: { username: 'henrym', bio: 'Full Stack Developer at YZA' } },
  },
];

// Column definitions
export const columnsPinning: ColumnSetting[] = [
  { title: 'ID', column: 'id', pin: 'pin' },
  { title: 'First Name', column: 'firstName', pin: 'unpin' },
  { title: 'Last Name', column: 'lastname', pin: false },
  { title: 'Role', column: 'role' },
];

export const columnsDragging: ColumnSetting[] = [
  { title: 'ID', column: 'id', draggable: true },
  { title: 'First Name', column: 'firstName', draggable: true },
  { title: 'Last Name', column: 'lastname', draggable: false },
  { title: 'Role', column: 'role', draggable: undefined },
];

export const columnsSorting: ColumnSetting[] = [
  { title: 'ID', column: 'id', sort: 'asc' },
  { title: 'First Name', column: 'firstName', sort: 'desc' },
  { title: 'Last Name', column: 'lastname', sort: false },
  { title: 'Role', column: 'role' },
];

export const columnsFiltering: ColumnSetting[] = [
  { title: 'ID', column: 'id', filter: false },
  { title: 'First Name', column: 'firstName', filter: { type: 'text', filterBy: 'includesString' } },
  { title: 'Last Name', column: 'lastname', filter: { type: 'text', filterBy: 'includesStringSensitive' } },
  {
    title: 'Role',
    column: 'role',
    filter: {
      type: 'dropdown',
      options: [
        { value: 'Admin', text: 'Admin' },
        { value: 'User', text: 'User' },
      ],
    },
  },
];

export const combinedColumns: ColumnSetting[] = [
  {
    title: 'ID',
    column: 'id',
    pin: 'pin',
    draggable: true,
  },
  {
    title: 'First Name',
    column: 'firstName',
    pin: 'unpin',
    draggable: true,
    filter: { type: 'text', filterBy: 'includesString' },
    editor: {
      validation: (v: any) =>
        v
          .string()
          .regex(new RegExp('^(?!.*\\s{2,})[A-Za-z]+(?: [A-Za-z]+)*$'), 'Name can only contain letters and single spaces')
          .required()
          .unique(),
    },
  },
  { title: 'Last Name', column: 'lastname', pin: false, sort: false, draggable: false },
  { title: 'Role', column: 'role' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Server mode helpers
// ─────────────────────────────────────────────────────────────────────────────
export type Product = {
  id: number;
  title: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
};

export function makeProducts(count = 50): Product[] {
  const cats = ['beauty', 'furniture', 'groceries'];
  const brands = ['Acme', 'Globex', 'Initech'];
  const rows: Product[] = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      id: i + 1,
      title: `Item ${i + 1}`,
      brand: brands[i % brands.length],
      category: cats[i % cats.length],
      price: 10 + i,
      rating: (i % 5) + 1,
    });
  }
  return rows;
}
export const ALL = makeProducts(50);

function includesCI(h: unknown, n: string) {
  if (!n) return true;
  if (h == null) return false;
  return String(h).toLowerCase().includes(n.toLowerCase());
}

export function applyServerOps(
  data: Product[],
  params: {
    pageIndex: number;
    pageSize: number;
    sorting?: { id: string; desc: boolean }[];
    columnFilters?: { id: string; value: any }[];
    globalFilter?: string;
  }
) {
  const { pageIndex, pageSize, sorting, columnFilters } = params;
  let rows = [...data];

  for (const f of columnFilters ?? []) {
    if (!f?.value && f?.value !== 0) continue;
    if (f.id === 'title') {
      rows = rows.filter((r) => includesCI(r.title, String(f.value)));
    } else if (f.id === 'category') {
      rows = rows.filter((r) => String(r.category) === String(f.value));
    } else if (f.id in rows[0]!) {
      rows = rows.filter((r: any) => includesCI((r as any)[f.id], String(f.value)));
    }
  }

  const s = sorting?.[0];
  if (s?.id) {
    const dir = s.desc ? -1 : 1;
    rows.sort((a: any, b: any) => {
      const va = a[s.id], vb = b[s.id];
      if (va == null && vb == null) return 0;
      if (va == null) return -1 * dir;
      if (vb == null) return 1 * dir;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }

  const total = rows.length;
  const start = pageIndex * pageSize;
  const paged = rows.slice(start, start + pageSize);
  return { rows: paged, total };
}

export function makeFetcherSpy(initialData = ALL) {
  const spy = vi.fn(async (params: any) => {
    await new Promise((r) => setTimeout(r, 1));
    const { rows, total } = applyServerOps(initialData, params);
    return { rows, total };
  });
  return spy;
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload/Download helpers & data
// ─────────────────────────────────────────────────────────────────────────────
export const DL_COLS: ColumnSetting[] = [
  { title: 'ID', column: 'id', width: 80, draggable: false },
  { title: 'Title', column: 'title', width: 180 },
  { title: 'Brand', column: 'brand', width: 140 },
  { title: 'Category', column: 'category', width: 140 },
  { title: 'Price', column: 'price', width: 100, align: 'right' },
  { title: 'Rating', column: 'rating', width: 100, align: 'right', hidden: true },
];

export const PROD_ROWS = [
  { id: 1, title: 'A', brand: 'Acme',    category: 'beauty',    price: 10, rating: 4.7 },
  { id: 2, title: 'B', brand: 'Globex',  category: 'furniture', price: 20, rating: 4.0 },
  { id: 3, title: 'C', brand: 'Initech', category: 'groceries', price: 30, rating: 3.5 },
];

export async function openDownloadMenu() {
  await (await import('@testing-library/user-event')).default.click(
    (await import('@testing-library/dom')).screen.getByTestId('download-icon')
  );
  await (await import('@testing-library/dom')).screen.findByRole('menu', { name: /download options/i });
}

// ----- SAFE PointerEvent polyfill (no Object.assign onto event) -----
class FakePointerEvent extends MouseEvent {
  pointerId: number;
  isPrimary: boolean;
  pointerType: string;
  width: number;
  height: number;
  pressure: number;

  constructor(type: string, init: any = {}) {
    const {
      pointerId = 1,
      isPrimary = true,
      pointerType = 'mouse',
      width = 1,
      height = 1,
      pressure = 0.5,
      ...mouseInit
    } = init as MouseEventInit & {
      pointerId?: number;
      isPrimary?: boolean;
      pointerType?: string;
      width?: number;
      height?: number;
      pressure?: number;
    };

    // Let MouseEvent set all the read-only bits (bubbles, cancelable, clientX, etc.)
    super(type, mouseInit);

    // Define pointer-only fields on the subclass (writable here)
    Object.defineProperties(this, {
      pointerId:   { value: pointerId,   enumerable: true },
      isPrimary:   { value: isPrimary,   enumerable: true },
      pointerType: { value: pointerType, enumerable: true },
      width:       { value: width,       enumerable: true },
      height:      { value: height,      enumerable: true },
      pressure:    { value: pressure,    enumerable: true },
    });
  }
}

if (!('PointerEvent' in window)) {
  (window as any).PointerEvent = FakePointerEvent as any;
}

// requestAnimationFrame → setTimeout shim (some libs schedule on RAF)
if (!window.requestAnimationFrame) {
  (window as any).requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 0) as unknown as number;
  (window as any).cancelAnimationFrame = (id: number) => clearTimeout(id as any);
}

// elementsFromPoint used by sensors; return target top-most element
if (!document.elementsFromPoint) {
  (document as any).elementsFromPoint = (x: number, y: number) => {
    const el = document.elementFromPoint?.(x, y);
    return el ? [el as Element] : [];
  };
}
