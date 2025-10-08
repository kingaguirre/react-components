// src/organisms/ChatWidget/aiUtils/__tests__/workdeskPlugin.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
// NOTE: adjust the import to your repo layout.
// If this file lives alongside workdesk.js, use "./workdesk.js".
// If you keep tests in a separate dir, something like:
// import { workdeskPlugin } from "../../src/organisms/ChatWidget/aiUtils/workdesk.js";
import { workdeskPlugin } from "../workdeskPlugin.js";

/* -----------------------------------------------------------------------------
   Shared fixtures & fetch mock (copied/adapted from your tabularPlugin tests)
----------------------------------------------------------------------------- */

const BASE_URL = "http://test.local";

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

let serverFiltersRanges = false;
let lastDownload: null | { filename: string; mime: string; bytes: Buffer } = null;

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
    // server returns all rows; client is expected to filter
    return new Response(JSON.stringify({ rows }), { status: 200 });
  }

  return new Response("Not found", { status: 404 });
});

/* -----------------------------------------------------------------------------
   Workdesk plugin instance + helper
----------------------------------------------------------------------------- */

const plugin = workdeskPlugin({
  baseUrl: BASE_URL,
  cacheTtlMs: 0,
  makeDownloadLink: async (buf: Buffer, filename: string, mime: string) => {
    lastDownload = { filename, mime, bytes: buf };
    return `https://dl.local/${encodeURIComponent(filename)}`;
  },
});

async function run(text: string, context: any = {}, messages: any[] = []) {
  const systems = await plugin.augment({ text, messages, context });
  return systems;
}

beforeEach(() => {
  serverFiltersRanges = false;
  lastDownload = null;
  vi.useRealTimers();
});

/* -----------------------------------------------------------------------------
   Tests
----------------------------------------------------------------------------- */

describe("workdeskPlugin — NO-FORM prompts (screen/module)", () => {
  it("tells you to connect context when current screen/module is unknown", async () => {
    const sys = await run("what screen am i on?");
    const c = sys.map(s => s.content).join("\n");
    expect(c).toMatch(/I don't have your current screen context yet/i);
    expect(c).toMatch(/Alt \+ \./); // includes tip for module/screen switcher
  });

  it("echoes module/screen with next steps when context is present", async () => {
    const sys = await run("what screen am i on?", { currentModule: "EIF", currentScreen: "General Details" });
    const c = sys.map(s => s.content).join("\n");
    expect(c).toContain("You are currently in **EIF** module and currently viewing **General Details**.");
    expect(c).toMatch(/What I can do next:/);
    expect(c).toMatch(/List columns|Validate fields|Summarize or export/);
  });
});

describe("workdeskPlugin — FORM MODE", () => {
  const formCtxBase = {
    currentModule: "EIF",
    currentScreen: "General Details",
    fieldSettings: [
      {
        header: "General Details",
        fields: [
          { name: "name",  label: "Name",  type: "text",  validationSig: "z.string().min(2)" },
          { name: "code",  label: "Code",  type: "text",  validationSig: "z.string().min(3)" },
          { name: "email", label: "Email", type: "text",  validationSig: "z.string().email()" },
          { name: "uuid",  label: "UUID",  type: "text",  validationSig: "z.string().uuid()" },
          { name: "note",  label: "Note",  type: "text",  validationSig: "z.string().optional()" },
        ],
      },
      {
        header: "Other Section",
        fields: [{ name: "other.foo", label: "Foo", type: "text" }],
      },
    ],
    data: {
      name:  "",            // missing (required by min(2))
      code:  "ab",          // too short (min 3)
      email: "bad@",        // invalid email
      uuid:  "xyz",         // invalid uuid
      // note: omitted (optional)
    },
  };

  it("lists fields scoped to current screen (no note when scope matches)", async () => {
    const sys = await run("list fields", { form: formCtxBase });
    const c = sys.map(s => s.content).join("\n");
    expect(c).toContain("**Fields — EIF / General Details**");
    expect(c).toContain("FIELDS_JSON");
    expect(c).not.toMatch(/No section titled/i);
    // sanity check a column header mention
    expect(c).toMatch(/Field.+Path.+Type.+Required/i);
  });

  it("lists fields+validation (rules) with no-scope note when header not found", async () => {
    const ctx = { form: { ...formCtxBase, currentScreen: "Shipping" } };
    const sys = await run("fields with validation", ctx);
    const c = sys.map(s => s.content).join("\n");
    expect(c).toContain("**Fields & Validation — EIF / Shipping**");
    expect(c).toContain("FIELDS_RULES_JSON");
    expect(c).toMatch(/No section titled "Shipping" found; showing all fields/i);
    // rule hints show up (type, required, min, email, uuid)
    expect(c).toMatch(/Rules/i);
  });

  it("returns required fields table", async () => {
    const sys = await run("which fields are required?", { form: formCtxBase });
    const c = sys.map(s => s.content).join("\n");
    expect(c).toContain("**Required Fields — EIF / General Details**");
    expect(c).toContain("REQUIRED_JSON");
  });

  it("validate → shows counts and issues table (missing + invalid)", async () => {
    const sys = await run("validate", { form: formCtxBase });
    const c = sys.map(s => s.content).join("\n");
    expect(c).toMatch(/Missing:\s*1,\s*Invalid:\s*3/);
    expect(c).toContain("FORM_ISSUES_JSON");
    // includes some field names
    expect(c).toMatch(/Email|UUID|Code|Name/);
  });

  it("show form data dump", async () => {
    const sys = await run("show form data", { form: formCtxBase });
    const c = sys.map(s => s.content).join("\n");
    expect(c).toContain("**EIF / General Details — Current Values**");
    expect(c).toContain("DATA_JSON");
    expect(c).toMatch(/Name|Code|Email|UUID/);
  });

  it("screen/module prompt in form mode includes stats (fields + required count)", async () => {
    const sys = await run("what screen am i on?", { form: formCtxBase });
    const c = sys.map(s => s.content).join("\n");
    expect(c).toMatch(/This screen has \*\*\d+ fields\*\* \(\d+ required\)\./);
  });
});

describe("workdeskPlugin — TABLE MODE", () => {
  const tableCtx = {
    currentModule: "EIF",
    currentScreen: "Workdesk",
    columnSettings: [
      { accessorKey: "trn", header: "TRN" },
      { id: "amount", title: "Amount" },
      { key: "status", label: "Status" },
    ],
    values: {
      data: [
        { trn: "A", amount: 1, status: "New" },
        { trn: "B", amount: 2, status: "Registered" },
        { trn: "C", amount: 3, status: "Pending" },
      ],
      total: 3,
    },
  };

  it("lists columns", async () => {
    const sys = await run("list columns", { form: tableCtx });
    const c = sys.map(s => s.content).join("\n");
    expect(c).toContain("**Columns — EIF / Workdesk**");
    expect(c).toContain("COLUMNS_JSON");
    expect(c).toMatch(/Column.+Title/i);
    expect(c).toMatch(/trn|amount|status/i);
  });

  it("previews up to 10 rows", async () => {
    const sys = await run("preview rows", { form: tableCtx });
    const c = sys.map(s => s.content).join("\n");
    expect(c).toContain("**Preview Rows (up to 10) — EIF / Workdesk**");
    expect(c).toContain("PREVIEW_JSON");
  });

  it("screen/module prompt in table mode includes col/row stats", async () => {
    const sys = await run("what module is this?", { form: tableCtx });
    const c = sys.map(s => s.content).join("\n");
    expect(c).toMatch(/This view contains a table with \*\*\d+ columns\*\* and \*\*\d+ rows\*\*\./);
  });
});

describe("workdeskPlugin — dataset analytics delegation to base tabular plugin", () => {
  it("‘latest transaction’ delegates to base (DEEP_FETCH_JSON present)", async () => {
    const sys = await run("show latest transaction");
    const c = sys.map(s => s.content).join("\n");
    expect(c).toContain("DEEP_FETCH_JSON");
  });

  it("‘oldest txn’ also delegates", async () => {
    const sys = await run("oldest txn");
    const c = sys.map(s => s.content).join("\n");
    expect(c).toContain("DEEP_FETCH_JSON");
  });
});
