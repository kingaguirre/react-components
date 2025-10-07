import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeTabularPlugin } from "../tabularPlugin.js";

// -------------------------
// Test fixtures
// -------------------------
const BASE_URL = "http://test.local";
const endpoints = {
  list: "/workdesk",
  full: "/workdesk/full",
  byKey: (trn: string) => `/txn/${trn}`,
};

const rows = [
  // Mixed formats across 2018–2025
  { id: "r2018a", receivedAt: "2018-01-15T09:00:00Z", workflowStage: "Registered", trn: "T2018A" },
  { id: "r2018b", valueDate: "15/12/2018", workflowStage: "Initiated", trn: "T2018B" },

  { id: "r2019a", timestamp: 1548979200, workflowStage: "Registered", trn: "T2019A" }, // 2019-02-01 (seconds)
  { id: "r2019b", date: "03/20/2019", workflowStage: "Initiated", trn: "T2019B" },    // mm/dd/yyyy

  { id: "r2020a", base: { __receivedAtMs: Date.UTC(2020, 6, 1) }, workflowStage: "Registered", trn: "T2020A" },
  { id: "r2020b", base: { receivedAt: "2020-11-30 12:34:56" }, workflowStage: "Initiated", trn: "T2020B" },

  { id: "r2021a", processedAt: "2021-03-05T00:00:00Z", workflowStage: "Registered", trn: "T2021A" },
  { id: "r2021b", bookingDate: "05-12-2021", workflowStage: "Initiated", trn: "T2021B" },

  { id: "r2022a", base: { timestamp: 1654041600000 }, workflowStage: "Registered", trn: "T2022A" }, // ms
  { id: "r2022b", base: { valueDate: "31/12/2022" }, workflowStage: "Initiated", trn: "T2022B" },

  { id: "r2023a", receivedAt: "2023-01-01T00:00:00Z", workflowStage: "Registered", trn: "T2023A" },
  { id: "r2023b", updatedAt: "2023-08-15T12:00:00Z", workflowStage: "Initiated", trn: "T2023B" },

  // Feb–Aug 2025 coverage (monthly buckets)
  { id: "r2025-02", receivedAt: "2025-02-10T09:00:00Z", workflowStage: "Registered", trn: "T2025F" },
  { id: "r2025-03", receivedAt: "2025-03-10T09:00:00Z", workflowStage: "Initiated",  trn: "T2025M" },
  { id: "r2025-04", receivedAt: "2025-04-10T09:00:00Z", workflowStage: "Registered", trn: "T2025A" },
  { id: "r2025-05", receivedAt: "2025-05-10T09:00:00Z", workflowStage: "Initiated",  trn: "T2025B" },
  { id: "r2025-06", receivedAt: "2025-06-10T09:00:00Z", workflowStage: "Registered", trn: "T2025C" },
  { id: "r2025-07", receivedAt: "2025-07-10T09:00:00Z", workflowStage: "Initiated",  trn: "T2025D" },
  { id: "r2025-08", receivedAt: "2025-08-10T09:00:00Z", workflowStage: "Registered", trn: "T2025E" },

  // key lookup sample
  { id: "abc", receivedAt: "2024-09-09T09:00:00Z", workflowStage: "Registered", trn: "SPBTR12RFC345678" },
];

// Server-filter behavior toggle (helps test client-side fallback)
let serverFiltersRanges = false;

// spy capture for downloaded file bytes
let lastDownload: null | { filename: string; mime: string; bytes: Buffer } = null;

// -------------------------
// Mock fetch
// -------------------------
function filterRowsByMs(sinceMs?: number, untilMs?: number) {
  const toMs = (r: any) => {
    const candidates = [
      r.__receivedAtMs,
      r?.base?.__receivedAtMs,
      r.timestampMs,
      r?.base?.timestampMs,
      r.timestamp,
      r?.base?.timestamp,
      r.receivedAt,
      r?.base?.receivedAt,
      r.createdAt,
      r?.base?.createdAt,
      r.updatedAt,
      r?.base?.updatedAt,
      r.processedAt,
      r?.base?.processedAt,
      r.ingestedAt,
      r?.base?.ingestedAt,
      r.bookingDate,
      r?.base?.bookingDate,
      r.valueDate,
      r?.base?.valueDate,
      r.date,
      r?.base?.date,
    ];
    let t = NaN;
    for (const v of candidates) {
      if (v == null) continue;
      if (typeof v === "number") {
        t = v >= 1e12 ? v : v >= 1e9 ? v * 1000 : v;
      } else {
        const s = String(v).replace(" ", "T");
        const parsed = Date.parse(s.includes("T") ? s : s);
        if (Number.isFinite(parsed)) t = parsed;
        if (!Number.isFinite(t) && /^\d{2}\/\d{2}\/\d{4}$/.test(String(v))) {
          const [dd, mm, yyyy] = String(v).split("/");
          t = Date.parse(`${yyyy}-${mm}-${dd}T00:00:00Z`);
        }
      }
      if (Number.isFinite(t)) break;
    }
    return t;
  };

  return rows.filter((r) => {
    const ms = toMs(r);
    if (!Number.isFinite(ms)) return false;
    if (Number.isFinite(sinceMs!) && ms < sinceMs!) return false;
    if (Number.isFinite(untilMs!) && ms > untilMs!) return false;
    return true;
  });
}

global.fetch = vi.fn(async (url: string) => {
  const u = new URL(String(url));
  const path = u.pathname;
  const sinceMs = u.searchParams.get("sinceMs");
  const untilMs = u.searchParams.get("untilMs");
  const limit = Number(u.searchParams.get("limit") || "50");
  const sortBy = u.searchParams.get("sortBy");
  const order = u.searchParams.get("order");

  // TRN lookup
  if (path.startsWith("/txn/")) {
    const trn = decodeURIComponent(path.split("/txn/")[1]);
    const it = rows.find((r) => r.trn === trn);
    return new Response(JSON.stringify(it ? it : {}), { status: it ? 200 : 404 });
  }

  // /workdesk (list)
  if (path === "/workdesk") {
    let out = [...rows];
    if (sortBy === "receivedAt") {
      out.sort((a: any, b: any) => {
        const ta = Date.parse(a.receivedAt || a?.base?.receivedAt || "2000-01-01");
        const tb = Date.parse(b.receivedAt || b?.base?.receivedAt || "2000-01-01");
        return (order === "asc" ? ta - tb : tb - ta);
      });
    }
    out = out.slice(0, limit);
    return new Response(JSON.stringify({ rows: out }), { status: 200 });
  }

  // /workdesk/full
  if (path === "/workdesk/full") {
    if (serverFiltersRanges && (sinceMs || untilMs)) {
      const filtered = filterRowsByMs(Number(sinceMs), Number(untilMs));
      return new Response(JSON.stringify({ rows: filtered }), { status: 200 });
    }
    // Mode B: server returns all and client filters (plugin must enforce strict filtering)
    return new Response(JSON.stringify({ rows }), { status: 200 });
  }

  return new Response("Not found", { status: 404 });
});

// -------------------------
// Test plugin instance
// -------------------------
const plugin = makeTabularPlugin({
  baseUrl: BASE_URL,
  endpoints,
  memory: {
    datasetName: "Workdesk",
    itemSingular: "transaction",
    itemPlural: "transactions",
    synonyms: ["row", "record", "entry", "txn"],
  },
  shape: {
    statusAccessor: (r) => (/initiated/i.test(r?.workflowStage || "") ? "PENDING" : "REGISTERED"),
    keyAccessor: (r) => r?.trn ?? r?.id,
  },
  facets: [],               // keep simple for tests
  alwaysDeepFetchAll: true, // ensure DEEP_FETCH payload is always present
  brandNames: ["tradexpress helix", "helix"],
  kb: { brand: "TradeXpress Helix", people: [{ role: "Support", name: "King", email: "king@sc.com" }] },
  makeDownloadLink: async (buf: Buffer, filename: string, mime: string) => {
    lastDownload = { filename, mime, bytes: buf };
    return `https://dl.local/${encodeURIComponent(filename)}`;
  },
});

// Helper to call augment quickly
async function run(p: ReturnType<typeof makeTabularPlugin>, text: string, sessionId = "s1", messages: any[] = []) {
  const systems = await p.augment({ text, messages, context: { sessionId } });
  return systems;
}

beforeEach(() => {
  serverFiltersRanges = false;
  lastDownload = null;
  vi.useRealTimers();
});

// -------------------------
// Tests
// -------------------------

describe("tabularPlugin — core regressions", () => {
  it("counts per year (no explicit range) → ALL years + cached aggregation for export", async () => {
    const sys1 = await run(plugin, "how many transactions per year?", "year-all");
    const c1 = sys1.map(s => s.content).join("\n");
    expect(c1).toContain("DEEP_FETCH_JSON");
    expect(c1).toContain("ALL available years");

    // export should reuse last aggregation columns (Year,Total)
    const sys2 = await run(plugin, "export", "year-all");
    expect(lastDownload).toBeTruthy();
    const csv = lastDownload!.bytes.toString("utf8");
    const header = csv.split("\n")[0].trim();
    expect(header).toBe("Year,Total");
    expect(csv.length).toBeGreaterThan(10);
  });

  it("‘between Feb–Aug 2025’ monthly buckets add up to range total + export matches rendered columns", async () => {
    const q = "show per month between feb to aug 2025";
    const sys = await run(plugin, q, "m1");
    const body = sys.map(s => s.content).join("\n");

    expect(body).toContain("DEEP_FETCH_JSON");
    expect(body).toMatch(/Month \| Total \| Registered \| Pending|Month — Total:/);

    // Export what was rendered (bucket table)
    await run(plugin, "export csv", "m1");
    const csv = lastDownload!.bytes.toString("utf8");
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("Month,Total,Registered,Pending"); // exact order preserved

    // Our fixture has exactly 7 rows (Feb..Aug)
    expect(lines.length - 1).toBe(7);
  });

  it("client-side filtering fallback (server doesn't filter ranges) still returns correct rows", async () => {
    serverFiltersRanges = false;
    const sys = await run(plugin, "how many between 2023-01-01 and 2023-12-31?", "range1");
    const c = sys.map(s => s.content).join("\n");
    expect(c).toContain("DEEP_FETCH_JSON");
    // 2023 rows in fixture: 2
    expect(c).toMatch(/"count":\s*2/);
  });

  it("server-side range filtering path also works", async () => {
    serverFiltersRanges = true;
    const sys = await run(plugin, "count between 2025-02-01 and 2025-08-31", "range2");
    const c = sys.map(s => s.content).join("\n");
    expect(c).toContain("DEEP_FETCH_JSON");
    // feb..aug 2025 in fixture: 7
    expect(c).toMatch(/"count":\s*7/);
  });

  it("TRN lookup injects item payload", async () => {
    const sys = await run(plugin, "details for SPBTR12RFC345678", "trn");
    const c = sys.map(s => s.content).join("\n");
    expect(c).toContain("DEEP_FETCH_JSON");
    expect(c).toContain("SPBTR12RFC345678");
  });

  it("generic ‘what else can I ask’ yields capabilities (not blocked)", async () => {
    const sys = await run(plugin, "what else can I ask?", "meta");
    expect(sys.length).toBeGreaterThan(1);
    const c = sys.map(s => s.content).join("\n");
    expect(c).toMatch(/present 4–6 example prompts|bullets/);
  });

  it("service-like asks (weather) respond with friendly note and in-scope ideas", async () => {
    const sys = await run(plugin, "what's the weather today?", "svc");
    const c = sys.map(s => s.content).join("\n");
    expect(c).toMatch(/do NOT have live access to weather/i);
  });

  it("export uses last rendered aggregation columns/order exactly", async () => {
    await run(plugin, "show table per month between 2025-02-01 and 2025-08-31", "agg-cols");
    await run(plugin, "export", "agg-cols");
    const csv = lastDownload!.bytes.toString("utf8");
    const header = csv.split("\n")[0].trim();
    expect(header).toBe("Month,Total,Registered,Pending");
  });

  it("history fallback — ‘export it’ after a range question uses that range", async () => {
    await run(plugin, "how many between 2020-01-01 and 2020-12-31?", "hist1");
    await run(plugin, "export it", "hist1");
    const csv = lastDownload!.bytes.toString("utf8");
    const dataLines = csv.trim().split("\n").length - 1;
    // 2020 has 2 rows in the fixture
    expect(dataLines).toBe(2);
  });

  it("zero-byte safeguard: export returns message instead of broken link if data empty", async () => {
    const sys = await run(plugin, "export between 1999-01-01 and 1999-12-31", "empty");
    const c = sys.map(s => s.content).join("\n").toLowerCase();
    expect(c).toContain("export failed (empty data)");
    expect(c).not.toContain("📎 download");
  });

  it("download line uses clickable filename only (URL hidden except in link target)", async () => {
    await run(plugin, "export between 2025-02-01 and 2025-03-31", "dl1");
    const c = (await run(plugin, "export between 2025-02-01 and 2025-03-31", "dl1"))
      .map(s => s.content).join("\n");

    expect(lastDownload).toBeTruthy();
    const { filename } = lastDownload!;

    // "[filename](https://...)" appears; raw URL not shown elsewhere
    expect(c).toContain(`📎 Download: [${filename}](`);

    // Strip link targets and verify no naked URLs are visible
    const visible = c.replace(/\([^)]+\)/g, "()");
    expect(visible).not.toMatch(/https?:\/\/\S+/);
  });
});

describe("tabularPlugin — compare output (chips + quick take + export)", () => {
  function b64(s: string) {
    return Buffer.from(s, "utf8").toString("base64");
  }

  it("shows Updated with chip + red→green values, counts newly populated fields, and prints Quick take", async () => {
    // Upload two rows:
    // - T2025A exists in baseline → change STAGE, add PRODUCT (newly-populated field)
    // - T9999NEW does not exist in baseline → should appear under New
    const csv = [
      'TRN #,STAGE,PRODUCT',
      'T2025A,PRINP - Processing In-Progress,IIFxx',
      'T9999NEW,Registered,IIF',
    ].join("\n");

    const systems = await plugin.augment({
      text: "compare this to current data",
      messages: [],
      context: {
        sessionId: "cmp1",
        attachments: [
          {
            name: "txn_work_desk.csv",
            mime: "text/csv",
            bytesB64: b64(csv),
          },
        ],
      },
    });

    const out = systems.map(s => s.content).join("\n");

    // Header + filename
    expect(out).toContain("**Comparison — txn_work_desk.csv**");
    expect(out).toContain("Uploaded rows: 2");
    expect(out).toContain("Baseline rows: 20 (our current data)");

    // Updated section: TRN bullet with yellow chip and STAGE change line
    expect(out).toContain("**Updated**");
    expect(out).toMatch(/- 🟨 \*\*T2025A\*\*/);

    // Field chip and colored old/new values (red old, green new) with → arrow
    expect(out).toMatch(/<span[^>]*>STAGE<\/span>/);               // chip(label)
    expect(out).toMatch(/\s*Registered/);                       // oldVal
    expect(out).toMatch(/\s*PRINP - Processing In-Progress/);   // newVal
    expect(out).toContain("&rarr;");                              // arrow entity

    // Newly-populated field summary (PRODUCT present only in upload for this TRN)
    expect(out).toMatch(/\+\s*1 newly populated field\(s\)/);

    // New section includes the new TRN
    expect(out).toContain("**New**");
    expect(out).toContain("🟩 **T9999NEW**");

    // Deleted section exists (baseline has many TRNs not in this upload)
    expect(out).toContain("**Deleted**");
    expect(out).toMatch(/- 🟥 \*\*[A-Z0-9]+/);

    // Quick take includes counts (updated TRN, field change, newly populated field)
    expect(out).toMatch(/\*Quick take:\*/i);
    expect(out).toMatch(/\b1 updated TRN\b/i);
    expect(out).toMatch(/\b1 field change\b/i);
    expect(out).toMatch(/\b1 newly populated field\b/i);

    // No “(no update)” noise lines
    expect(out.toLowerCase()).not.toContain("(no update)");
  });

  it("exports the last compare aggregation with exact columns", async () => {
    // Reuse same session so compare aggregation is cached
    await plugin.augment({
      text: "export",
      messages: [],
      context: { sessionId: "cmp1" },
    });

    expect(lastDownload).toBeTruthy();
    const csv = lastDownload!.bytes.toString("utf8");
    const header = csv.split("\n")[0].trim();
    expect(header).toBe("ChangeType,TRN,Field,Before (baseline),After (upload)");
    expect(csv.length).toBeGreaterThan(header.length + 5);
  });

  it("suppresses unchanged fields and only shows true diffs", async () => {
    // Upload with same STAGE as baseline (Registered) → no change should be printed for STAGE
    // but add PRODUCT (newly populated) to verify it's counted, not listed as a diff
    const csvSame = [
      'TRN #,STAGE,PRODUCT',
      'T2025A,Registered,IIFxx',
    ].join("\n");

    const systems2 = await plugin.augment({
      text: "compare this to current data",
      messages: [],
      context: {
        sessionId: "cmp2",
        attachments: [
          {
            name: "one_row.csv",
            mime: "text/csv",
            bytesB64: Buffer.from(csvSame, "utf8").toString("base64"),
          },
        ],
      },
    });

    const out2 = systems2.map(s => s.content).join("\n");

    // Should list the TRN under Updated (because a field was newly populated),
    // but NOT show a STAGE change line (since it's identical to baseline)
    expect(out2).toContain("**Updated**");
    expect(out2).toMatch(/- 🟨 \*\*T2025A\*\*/);
    expect(out2).not.toMatch(/STAGE.*Registered/); // no change row printed
    expect(out2).toMatch(/\+\s*1 newly populated field\(s\)/);
  });
});
