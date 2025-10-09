/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeUploadCompareAdapter } from "../uploadCompareAdapter";

// ---------- Test helpers ----------
type FetchRoute = {
  matcher: (url: string, init?: RequestInit) => boolean;
  payload: any;
  status?: number;
};
function makeFetchStub(routes: FetchRoute[]) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const route = routes.find(r => r.matcher(url as string, init));
    if (!route) throw new Error(`Unexpected fetch: ${url}`);
    const { payload, status = 200 } = route;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => payload,
      text: async () => JSON.stringify(payload),
    } as any;
  });
}

const EMIT = "[[EMIT]]";

// Deterministic link maker
const makeDownloadLink = vi.fn(async (_bytes, filename, _mime, _ttl) => `https://dl.test/${filename}`);

// Minimal exceljs mock for dynamic import in export paths
vi.mock("exceljs", () => {
  class Worksheet {
    _rows: any[] = [];
    columns: any[] = [];
    addRow(r: any) { this._rows.push(r); }
    getRow(_n: number) { return { eachCell: (_cb: any) => {} }; }
    eachRow(_cb: any) {}
  }
  class Workbook {
    worksheets: any[] = [new Worksheet()];
    addWorksheet(_name: string) { const ws = new Worksheet(); this.worksheets.push(ws); return ws; }
    get xlsx() {
      return {
        writeBuffer: async () => new ArrayBuffer(8),
        load: async (_buf: Uint8Array) => {},
      };
    }
  }
  return { default: Workbook };
});

// ---------- Fixtures ----------
const baseUrl = "https://api.example.test";
const endpoints = {
  list: "/data/list",
  full: "/data/full",
  byKey: (id: string) => `/data/byKey/${id}`,
};

// Baseline dataset used by /full (includes 2023..2025)
const FULL_ROWS = [
  // id/trn + status/stage + receivedAt; mix across years
  { trn: "T100", stage: "registered", receivedAt: "2023-12-15T10:00:00Z" },
  { trn: "T101", stage: "registered", receivedAt: "2024-01-05T00:00:00Z" },
  { trn: "T102", stage: "pending",    receivedAt: "2024-02-09T12:34:00Z" },
  { trn: "T103", stage: "pending",    receivedAt: "2024-02-20T09:00:00Z" },
  { trn: "T104", stage: "registered", receivedAt: "2024-03-10T09:00:00Z" },
  { trn: "T105", stage: "registered", receivedAt: "2025-03-12T11:00:00Z" },
];

const routesFull = [
  {
    matcher: (url: string) => url.startsWith(`${baseUrl}${endpoints.full}`),
    payload: { rows: FULL_ROWS },
  },
];

// Utility to build adapter with fetch stub
const makeAdapter = (routes: FetchRoute[]) => {
  (globalThis as any).fetch = makeFetchStub(routes);
  return makeUploadCompareAdapter({ baseUrl, endpoints, makeDownloadLink });
};

// Helpers to craft a CSV “attachment” with data URL (base64)
function csvAttachment(name: string, csv: string, mime = "text/csv") {
  const b64 = Buffer.from(csv, "utf8").toString("base64");
  return { name, mime, dataUrl: `data:${mime};base64,${b64}` };
}

// Extract the EMIT’d user-facing content
function getEmitContent(systems: any[]) {
  const msg = systems[0]?.content || "";
  const i = msg.indexOf(EMIT);
  return i >= 0 ? msg.slice(i + EMIT.length).trim() : msg;
}

describe("uploadCompareAdapter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    makeDownloadLink.mockClear();
  });

  it("export all (CSV): returns a single download line with a CSV file", async () => {
    const adapter = makeAdapter(routesFull);
    const res = await adapter.augment({
      text: "export all transactions",
      messages: [],
      context: { sessionId: "s1" },
    } as any);
    const out = getEmitContent(res);
    expect(out).toMatch(/^📎 Download: \[all-transactions-.*\.csv]\(https:\/\/dl\.test\/all-transactions-.*\.csv\)$/);
    expect(makeDownloadLink).toHaveBeenCalledOnce();
  });

  it("export all (XLSX): returns a single download line with an XLSX file", async () => {
    const adapter = makeAdapter(routesFull);
    const res = await adapter.augment({
      text: "export all data as xlsx",
      messages: [],
      context: { sessionId: "s1b" },
    } as any);
    const out = getEmitContent(res);
    expect(out).toMatch(/^📎 Download: \[all-transactions-.*\.xlsx]\(https:\/\/dl\.test\/all-transactions-.*\.xlsx\)$/);
    expect(makeDownloadLink).toHaveBeenCalledOnce();
  });

  it("status per month for a year → emits month table and then “export it” uses persisted aggregation", async () => {
    const adapter = makeAdapter(routesFull);
    // Ask for monthly status (implicitly 2024 from text)
    const res1 = await adapter.augment({
      text: "status per month for 2024 (registered/pending table)",
      messages: [],
      context: { sessionId: "s2" },
    } as any);
    const out1 = getEmitContent(res1);
    expect(out1).toContain("**Status per Month — 2024**");
    // Should list months from baseline rows (Jan/Feb/Mar 2024 present)
    expect(out1).toMatch(/January 2024/);
    expect(out1).toMatch(/February 2024/);
    expect(out1).toMatch(/March 2024/);

    // Now “export it” (should export lastAggregation)
    const res2 = await adapter.augment({
      text: "export it as xlsx",
      messages: [],
      context: { sessionId: "s2" },
    } as any);
    const out2 = getEmitContent(res2);
    expect(out2).toMatch(/📎 Download: \[[^\]]+status-monthly[^\]]*\.xlsx\]\(https:\/\/dl\.test\/.*status-monthly.*\.xlsx\)/);
  });

  it("YoY compare: lists yearly counts and YoY % changes", async () => {
    const adapter = makeAdapter(routesFull);
    const res = await adapter.augment({
      text: "Show year-over-year change vs previous year",
      messages: [],
      context: { sessionId: "s3" },
    } as any);
    const out = getEmitContent(res);
    expect(out).toContain("**Year-over-Year change (all data)**");
    // Has at least two years (2023, 2024, 2025)
    expect(out).toMatch(/- \*\*2023\*\* —/);
    expect(out).toMatch(/- \*\*2024\*\* —/);
    expect(out).toMatch(/YoY:/); // contains YoY percentages
  });

  it("compare with attachment CSV: shows Updated/New/Deleted sections and quick take, then 'export it'", async () => {
    // Baseline includes T101, T102, T103, T104, T100, T105
    // Upload: T101 with changed stage, T999 new, T102 unchanged, T103 removed in upload perspective is irrelevant, but 'removed' computed vs baseline (we show removed keys that baseline has but upload doesn't)
    const adapter = makeAdapter(routesFull);
    const csv = [
      "trn,stage,receivedAt",
      "T101,pending,2024-01-05T00:00:00Z",  // updated (was registered)
      "T102,pending,2024-02-09T12:34:00Z", // unchanged stage pending
      "T999,registered,2024-03-15T00:00:00Z" // new
    ].join("\n");
    const attachment = csvAttachment("upload.csv", csv);

    const res = await adapter.augment({
      text: "compare this file to our data",
      messages: [],
      context: { sessionId: "s4", attachments: [attachment] },
    } as any);

    const out = getEmitContent(res);
    expect(out).toContain("**Comparison —** **upload.csv**");
    expect(out).toContain("Uploaded rows: 3");
    expect(out).toContain("Baseline rows: 6");

    // Updated section should mention T101
    expect(out).toMatch(/\*\*Updated\*\*/);
    expect(out).toMatch(/T101/);

    // New section should list T999
    expect(out).toMatch(/\*\*New\*\*/);
    expect(out).toMatch(/T999/);

    // Deleted section should list rows present in baseline but not in upload (e.g., T100, T103, T104, T105)
    expect(out).toMatch(/\*\*Deleted\*\*/);
    expect(out).toMatch(/T100/);

    // Quick take present
    expect(out).toMatch(/\*\*Quick take:\*\*/);

    // “export it” persists and exports the diff aggregation
    const res2 = await adapter.augment({
      text: "export it",
      messages: [],
      context: { sessionId: "s4" },
    } as any);
    const out2 = getEmitContent(res2);
    // Filename base comes from meta.filename (upload name), so it's "upload-diff-*.csv"
    expect(out2).toMatch(/📎 Download: \[upload-diff-.*\.csv]\(https:\/\/dl\.test\/upload-diff-.*\.csv\)/);
  });

  it("export uploaded file (xlsx) after compare remembers lastUpload and exports raw upload", async () => {
    const adapter = makeAdapter(routesFull);
    const csv = [
      "trn,stage,receivedAt,bookingLocation",
      "T201,registered,2024-06-01T00:00:00Z,KL",
      "T202,pending,2024-06-02T00:00:00Z,SG",
    ].join("\n");
    const attachment = csvAttachment("my dump.csv", csv);

    // First, perform a compare to store lastUpload
    await adapter.augment({
      text: "compare file",
      messages: [],
      context: { sessionId: "s5", attachments: [attachment] },
    } as any);

    // Then, request export of the uploaded file
    const res = await adapter.augment({
      text: "export uploaded file as xlsx",
      messages: [],
      context: { sessionId: "s5" },
    } as any);

    const out = getEmitContent(res);
    expect(out).toMatch(/📎 Download: \[uploaded-my-dump-.*\.xlsx]\(https:\/\/dl\.test\/uploaded-my-dump-.*\.xlsx\)/);
  });

  it("compare intent with implied file but no attachment and no memory → asks to attach", async () => {
    const adapter = makeAdapter(routesFull);
    const res = await adapter.augment({
      text: "compare this file",
      messages: [],
      context: { sessionId: "s6" }, // no attachments & no prior lastUpload
    } as any);

    const out = getEmitContent(res);
    expect(out).toContain("Please attach a CSV/XLSX to compare.");
    expect(out).toContain("compare this to last month");
  });
});
