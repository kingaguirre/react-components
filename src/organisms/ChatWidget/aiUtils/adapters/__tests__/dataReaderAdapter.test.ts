/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { makeDataReaderAdapter } from "../dataReaderAdapter";

// ---- helpers ----
const FIXED_NOW = Date.UTC(2025, 0, 15, 10, 0, 0); // 2025-01-15 10:00:00Z

function parseDeepFetchJSON(content: string): any | null {
  // Looks for the last ```json ... ``` block and parses it
  const blocks = [...content.matchAll(/```json\s*([\s\S]*?)\s*```/g)];
  if (!blocks.length) return null;
  const raw = blocks[blocks.length - 1][1];
  try { return JSON.parse(raw); } catch { return null; }
}
type FetchRoute = {
  matcher: (url: string, init?: RequestInit) => boolean;
  payload: any;
  status?: number;
};

function makeFetchStub(routes: FetchRoute[]) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const match = routes.find(r => r.matcher(url, init));
    if (!match) {
      // Helpful failure
      throw new Error(`Unexpected fetch: ${url}`);
    }
    const { payload, status = 200 } = match;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => payload,
      text: async () => JSON.stringify(payload),
    } as any;
  });
}

// exceljs is dynamically imported by the adapter. We provide a minimal mock.
vi.mock("exceljs", () => {
  class Worksheet {
    columns: any[] = [];
    addRow(_r: any) { /* no-op for tests */ }
  }
  class Workbook {
    addWorksheet(_name: string) { return new Worksheet(); }
    get xlsx() {
      return {
        writeBuffer: async () => new ArrayBuffer(8),
      };
    }
  }
  return { default: Workbook };
});

// ---- test data ----
const rowsAll = [
  // years: 2023, 2024, 2025 (varied statuses)
  { id: "A1", trn: "TRN-A1", receivedAt: "2023-03-10T08:00:00Z", status: "draft",       product: "P1", bookingLocation: "LOC1", workflowStage: "S1" },
  { id: "B2", trn: "TRN-B2", receivedAt: "2024-07-01T01:02:03Z",  status: "registered", product: "P2", bookingLocation: "LOC2", workflowStage: "S2" },
  { id: "C3", trn: "TRN-C3", receivedAt: "2025-01-12T12:00:00Z",  status: "pending",    product: "P3", bookingLocation: "LOC3", workflowStage: "S3" },
  { id: "D4", trn: "TRN-D4", receivedAt: "2025-01-14T09:30:00Z",  status: "registered", product: "P1", bookingLocation: "LOC2", workflowStage: "S1" },
];

const rowsListDesc = [
  { id: "Z9", trn: "TRN-Z9", receivedAt: "2025-01-15T09:55:00Z", status: "pending",    product: "PX", bookingLocation: "LZ", workflowStage: "SZ" },
  { id: "Y8", trn: "TRN-Y8", receivedAt: "2025-01-15T09:00:00Z", status: "registered", product: "PY", bookingLocation: "LY", workflowStage: "SY" },
  { id: "X7", trn: "TRN-X7", receivedAt: "2025-01-14T23:59:59Z", status: "registered", product: "PZ", bookingLocation: "LX", workflowStage: "SX" },
];

const keyPayload = { id: "SPBTR25RFC000123", value: 42, receivedAt: "2025-01-10T00:00:00Z", status: "registered" };

const baseUrl = "https://api.example.test";
const endpoints = {
  list: "/workdesk/list",
  full: "/workdesk/full",
  byKey: (id: string) => `/workdesk/byKey/${id}`,
};

// Minimal shape: time = receivedAt; status from status; key as id/trn
const shape = {
  timestampAccessor: (r: any) => Date.parse(r.receivedAt),
  statusAccessor:    (r: any) => String(r.status || ""),
  keyAccessor:       (r: any) => r.trn || r.id,
};

// Deterministic download link
const makeDownloadLink = vi.fn(async (_bytes, filename, _mime, _ttl) => `https://dl.example.test/${filename}`);

function makeAdapter(routes: FetchRoute[]) {
  (globalThis as any).fetch = makeFetchStub(routes);
  return makeDataReaderAdapter({
    baseUrl,
    endpoints,
    memory: { datasetName: "Workdesk", itemSingular: "transaction", itemPlural: "transactions" },
    shape,
    alwaysDeepFetchAll: true,
    hotsetLimit: 3,
    kb: { title: "KB", brand: "Giftlyph" },
    brandNames: ["Giftlyph"],
    makeDownloadLink,
  });
}

describe("DataReaderAdapter (vitest)", () => {
  const realNow = Date.now;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    vi.restoreAllMocks(); // clear any prior stubs/mocks between tests
  });

  afterEach(() => {
    vi.useRealTimers();
    Date.now = realNow;
  });

  it("buildMemory(): returns a single system message embedding MEMORY_JSON snapshot/hotset", async () => {
    const routes: FetchRoute[] = [
      // Hotset comes from the list endpoint (limit=N, sort desc)
      {
        matcher: (url) => url.startsWith(`${baseUrl}${endpoints.list}`),
        payload: { rows: rowsListDesc },
      },
    ];
    const adapter = makeAdapter(routes);

    const msg = await adapter.buildMemory();
    expect(msg.role).toBe("system");
    expect(msg.content).toContain("MEMORY_JSON");
    expect(msg.content).toContain('"datasetName":"Workdesk"');
    // snapshot counts (today/last7/last30) should be present
    expect(msg.content).toMatch(/"snapshot":\s*\{[^}]*"last30":\d+/);
    // hotset keys
    expect(msg.content).toContain("TRN-Z9");
    expect(msg.content).toContain("TRN-Y8");
  });

  it('augment("per year"): aggregates all rows and returns a system message with DEEP_FETCH_JSON + table instruction if asked to "use table"', async () => {
    const routes: FetchRoute[] = [
      { matcher: (url) => url.startsWith(`${baseUrl}${endpoints.full}`), payload: { rows: rowsAll } },
    ];
    const adapter = makeAdapter(routes);

    const systems = await adapter.augment({
      text: "Show totals per year and use table",
      messages: [],
      context: { sessionId: "s1" },
    } as any);

    // Returns multiple system prompts; last one should contain DEEP_FETCH_JSON
    const last = systems[systems.length - 1];
    expect(last.role).toBe("system");
    expect(last.content).toContain("DEEP_FETCH_JSON");
    // Should mention rendering as a table for yearly bucket
    expect(last.content).toMatch(/Render a compact table:\s*Year \| Total \| Registered \| Pending/i);
    // Verify years are present
    expect(last.content).toContain("2023");
    expect(last.content).toContain("2024");
    expect(last.content).toContain("2025");
  });

  it('augment("latest 2"): deepFetchLatestN uses /list, persists selection aggregation, and returns DEEP_FETCH_JSON', async () => {
    const routes: FetchRoute[] = [
      { matcher: (url) => url.startsWith(`${baseUrl}${endpoints.list}`), payload: { rows: rowsListDesc } },
    ];
    const adapter = makeAdapter(routes);

    const systems = await adapter.augment({
      text: "Give me the latest 2 transactions",
      messages: [],
      context: { sessionId: "s2" },
    } as any);

    const last = systems[systems.length - 1];
    expect(last.role).toBe("system");
    expect(last.content).toContain("DEEP_FETCH_JSON");
    const deep = parseDeepFetchJSON(last.content);
    expect(deep).toBeTruthy();
    expect(deep.intent).toBe("latestN");
    expect(deep?.request?.n).toBe(2);
    // And include some of the list rows (Z9/Y8) in latestSample
    const keys = (deep.latestSample ?? []).map((r: any) => r.key);
    expect(keys).toContain("TRN-Z9");
    expect(keys).toContain("TRN-Y8");
  });

  it('augment("by key"): fetches single item by key and returns DEEP_FETCH_JSON with that record', async () => {
    const KEY = "SPBTR25RFC000123";
    const routes: FetchRoute[] = [
      { matcher: (url) => url.endsWith(endpoints.byKey(KEY)), payload: keyPayload },
    ];
    const adapter = makeAdapter(routes);

    const systems = await adapter.augment({
      text: `Open ${KEY}`,
      messages: [],
      context: { sessionId: "s3" },
    } as any);

    const last = systems[systems.length - 1];
    expect(last.role).toBe("system");
    expect(last.content).toContain("DEEP_FETCH_JSON");
    const deep = parseDeepFetchJSON(last.content);
    expect(deep).toBeTruthy();
    expect(deep.intent).toBe("byKey");
    expect(deep.key).toBe(KEY);
    expect(deep.item?.value).toBe(42);
  });

  it('augment(): remembers last aggregation and on "export it as xlsx" returns a single Markdown download line', async () => {
    // 1) First call causes a per-year aggregation (stores lastAggregation)
    const routes1: FetchRoute[] = [
      { matcher: (url) => url.startsWith(`${baseUrl}${endpoints.full}`), payload: { rows: rowsAll } },
    ];
    const adapter1 = makeAdapter(routes1);

    const sys1 = await adapter1.augment({
      text: "per year", // triggers grain=year path
      messages: [],
      context: { sessionId: "s4" },
    } as any);
    expect(sys1[sys1.length - 1].content).toContain("DEEP_FETCH_JSON");

    // 2) Same adapter/session, now ask to export as xlsx
    // No network needed for export from lastAggregation, but linkMaker will be called
    const sys2 = await adapter1.augment({
      text: "export it as xlsx",
      messages: [],
      context: { sessionId: "s4" },
    } as any);

    // Should return exactly one Markdown line instruction
    const last = sys2[sys2.length - 1];
    expect(last.role).toBe("system");
    expect(last.content.trim()).toMatch(/^Output exactly ONE line of Markdown:\n\n📎 Download: \[[^\]]+\.xlsx]\(https:\/\/dl\.example\.test\/[^\)]+\.xlsx\)$/);
    expect(makeDownloadLink).toHaveBeenCalledOnce();
  });

  it('augment("weather"): replies with scoped service disclaimer and suggestions (no data calls)', async () => {
    // No routes needed; should not call fetch for this ask
    const adapter = makeAdapter([]);
    const systems = await adapter.augment({
      text: "what's the weather in KL today?",
      messages: [],
      context: { sessionId: "s5" },
    } as any);

    const last = systems[systems.length - 1];
    expect(last.role).toBe("system");
    expect(last.content).toMatch(/You do NOT have live access to external services/i);
  });

  it('augment("brand ask"): when brand token appears, uses KB_JSON and does not fetch data', async () => {
    const adapter = makeAdapter([]);
    const systems = await adapter.augment({
      text: "What does Giftlyph say about refunds?",
      messages: [],
      context: { sessionId: "s6" },
    } as any);

    const last = systems[systems.length - 1];
    expect(last.role).toBe("system");
    expect(last.content).toContain("KB_JSON");
    expect(last.content).toContain('"brand":"Giftlyph"');
  });

  it('augment(fallback all): when no specific ask, fetches full and returns DEEP_FETCH_JSON (alwaysDeepFetchAll=true)', async () => {
    const routes: FetchRoute[] = [
      { matcher: (url) => url.startsWith(`${baseUrl}${endpoints.full}`), payload: { rows: rowsAll } },
    ];
    const adapter = makeAdapter(routes);

    const systems = await adapter.augment({
      text: "hello", // no range/top/key/export/etc.
      messages: [],
      context: { sessionId: "s7" },
    } as any);

    const last = systems[systems.length - 1];
    expect(last.role).toBe("system");
    expect(last.content).toContain("DEEP_FETCH_JSON");
    expect(last.content).toContain('"totals":{"count":4}');
  });
});
