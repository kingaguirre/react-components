/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { makeUiScreenAdapter } from "../uiScreenAdapter";

// Small helpers
const run = async (adapter: any, text: string, context?: any) =>
  adapter.augment({ text, context });

const hasCodeBlockJson = (s: string) => /```json[\s\S]*```/i.test(s);
const extractLastJsonBlock = (s: string) => {
  const m = Array.from(s.matchAll(/```json\s*([\s\S]*?)\s*```/gi));
  return m.length ? m[m.length - 1][1] : null;
};
const parseLastJsonBlock = (s: string) => {
  const raw = extractLastJsonBlock(s);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
};

describe("UI Screen Adapter", () => {
  // ---- Fixtures ----
  const FORM_FIXTURE = {
    currentModule: "Txn Workdesk",
    currentScreen: "General Details",
    description: "Primary details for transaction capture.",
    fieldSettings: [
      // flat fields
      { name: "reference", label: "Reference", type: "text", validationSig: ".string().min(3).required()" },
      { name: "email", label: "Email", type: "text", validationSig: ".string().email().required()" },
      { name: "amount", label: "Amount", type: "number", validationSig: ".number().min(1)" },
      // nested tab with fields
      {
        tabs: [
          {
            title: "More",
            fields: [
              { name: "meta.notes", label: "Notes", type: "text", validationSig: ".string().max(10)" },
              { name: "meta.tag", label: "Tag", type: "select", options: ["A", "B", "C"], validationSig: ".string().optional()" },
            ],
          },
        ],
      },
    ],
    values: {
      reference: "AB", // invalid: min(3)
      email: "not-an-email", // invalid: email
      amount: "", // empty (not strictly required)
      meta: {
        notes: "this note is longer than ten", // invalid: max(10)
        tag: "Z", // invalid: enum
      },
    },
  };

  const FORM_FIXTURE_NO_ISSUES = {
    currentModule: "Txn Workdesk",
    currentScreen: "General Details",
    fieldSettings: [
      { name: "reference", label: "Reference", type: "text", validationSig: ".string().min(3).required()" },
      { name: "email", label: "Email", type: "text", validationSig: ".string().email().required()" },
    ],
    values: { reference: "ABCDE", email: "ok@example.com" },
  };

  const TABLE_FIXTURE = {
    currentModule: "Txn Workdesk",
    currentScreen: "List",
    columnSettings: [
      { accessorKey: "trn", header: "TRN" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "amount", header: "Amount" },
    ],
    values: {
      total: 3,
      rows: [
        { trn: "T1", status: "pending", amount: 10 },
        { trn: "T2", status: "registered", amount: 20 },
        { trn: "T3", status: "registered", amount: 30 },
      ],
    },
  };

  // ---- Deferral (should return []) ----
  it("defers dataset analytics intents to Data Reader (compare / latest / oldest)", async () => {
    const adapter = makeUiScreenAdapter();
    expect(await run(adapter, "compare rows", { form: FORM_FIXTURE })).toEqual([]);
    expect(await run(adapter, "latest 5 transactions", { form: FORM_FIXTURE })).toEqual([]);
    expect(await run(adapter, "oldest transaction", { form: FORM_FIXTURE })).toEqual([]);
  });

  // ---- No-form fallback ----
  it("no form: answers where am I / which module with canned Markdown (no JSON)", async () => {
    const adapter = makeUiScreenAdapter();
    const res = await run(adapter, "where am i?", {
      currentModule: "Home",
      currentScreen: "Dashboard",
    });
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(1);
    expect(res[0].role).toBe("system");
    expect(res[0].content).toContain("Return exactly the following Markdown");
    expect(res[0].content).toContain("You are currently in **Home** module");
    expect(hasCodeBlockJson(res[0].content)).toBe(false);
  });

  it("no form & missing context: shows setup tip", async () => {
    const adapter = makeUiScreenAdapter();
    const res = await run(adapter, "which screen?");
    expect(res.length).toBe(1);
    expect(res[0].content).toContain("I don't have your current screen context yet.");
    expect(res[0].content).toContain("Alt + .");
  });

  // ---- where am i with form context ----
  it("with form context: where am i includes module/screen, description and stats", async () => {
    const adapter = makeUiScreenAdapter();
    const res = await run(adapter, "where am i", { form: FORM_FIXTURE });
    expect(res.length).toBe(1);
    const c = res[0].content;
    expect(c).toContain("Return exactly the following Markdown");
    expect(c).toContain("**Txn Workdesk**");
    expect(c).toContain("**General Details**");
    expect(c).toContain("This screen has **"); // fields count
  });

  // ---- Form mode: fields list ----
  it("form: list fields (hidden JSON via token FIELDS_JSON)", async () => {
    const adapter = makeUiScreenAdapter();
    const res = await run(adapter, "list fields", { form: FORM_FIXTURE });
    expect(res.length).toBe(2);
    expect(res[0].content).toContain("Render a compact table");
    expect(res[0].content).toContain("FIELDS_JSON");
    expect(res[1].content).toContain("FIELDS_JSON:");
    expect(res[1].content).toContain('"columns"');
    expect(hasCodeBlockJson(res[0].content)).toBe(false);
  });

  it("form: fields with validation (raw json) returns a single code-fenced TOKEN per design", async () => {
    const adapter = makeUiScreenAdapter();
    const res = await run(adapter, "fields with validation as json", { form: FORM_FIXTURE });
    expect(res.length).toBe(1);
    expect(res[0].content).toContain("Fields & Validation");
    expect(hasCodeBlockJson(res[0].content)).toBe(true);
    // Adapter returns the actual JSON in the fenced block
    const parsed = parseLastJsonBlock(res[0].content);
    expect(parsed).toBeTruthy();
    expect(parsed.columns).toEqual(["Field","Path","Type","Required","Rules"]);
    expect(Array.isArray(parsed.rows)).toBe(true);
  });

  // ---- Required list ----
  it("form: required fields list (hidden JSON)", async () => {
    const adapter = makeUiScreenAdapter();
    const res = await run(adapter, "which fields are required", { form: FORM_FIXTURE });
    expect(res.length).toBe(2);
    expect(res[0].content).toContain("Required Fields");
    expect(res[0].content).toContain("REQUIRED_JSON");
    expect(res[1].content).toContain("REQUIRED_JSON:");
  });

  it("form: required fields as json returns code-fenced TOKEN", async () => {
    const adapter = makeUiScreenAdapter();
    const res = await run(adapter, "required fields as json", { form: FORM_FIXTURE });
    expect(res.length).toBe(1);
    expect(hasCodeBlockJson(res[0].content)).toBe(true);
    const parsed = parseLastJsonBlock(res[0].content);
    expect(Array.isArray(parsed)).toBe(true);       // requiredList is an array of [Field, Path]
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0]).toEqual(["Reference","reference"]);
  });

  // ---- Form data (values) ----
  it("form: show current values (hidden JSON)", async () => {
    const adapter = makeUiScreenAdapter();
    const res = await run(adapter, "show form data", { form: FORM_FIXTURE });
    expect(res.length).toBe(2);
    expect(res[0].content).toContain("Current Values");
    expect(res[0].content).toContain("DATA_JSON");
    expect(res[1].content).toContain("DATA_JSON:");
  });

  it("form: show current values as json (code-fenced)", async () => {
    const adapter = makeUiScreenAdapter();
    const res = await run(adapter, "show form data as json", { form: FORM_FIXTURE });
    expect(res.length).toBe(1);
    expect(hasCodeBlockJson(res[0].content)).toBe(true);
  });

  // ---- Analyze / validate ----
  it("form: analyze/validate emits issues table (hidden JSON) with counts in first line", async () => {
    const adapter = makeUiScreenAdapter();
    const res = await run(adapter, "validate this", { form: FORM_FIXTURE });
    expect(res.length).toBeGreaterThanOrEqual(1);
    expect(res[0].content).toMatch(/\*\*Txn Workdesk \/ General Details\*\* — Missing: \d+, Invalid: \d+/);
    if (res.length === 2) {
      // when issues exist, first is instruction, second is FORM_ISSUES_JSON payload
      expect(res[0].content).toContain("FORM_ISSUES_JSON");
      expect(res[1].content).toContain("FORM_ISSUES_JSON:");
    }
  });

  it("form: analyze with no issues returns 'All checks passed'", async () => {
    const adapter = makeUiScreenAdapter();
    const res = await run(adapter, "analyze", { form: FORM_FIXTURE_NO_ISSUES });
    expect(res.length).toBe(1);
    expect(res[0].content).toContain("All checks passed. Ready to submit.");
  });

  // ---- Table mode ----
  it("table: list columns (hidden JSON)", async () => {
    const adapter = makeUiScreenAdapter();
    const res = await run(adapter, "list columns", { form: TABLE_FIXTURE });
    expect(res.length).toBe(2);
    expect(res[0].content).toContain("Columns — Txn Workdesk / List");
    expect(res[0].content).toContain("COLUMNS_JSON");
    expect(res[1].content).toContain("COLUMNS_JSON:");
  });

  it("table: list columns as json (code-fenced token)", async () => {
    const adapter = makeUiScreenAdapter();
    // must include a leading verb to satisfy wantsColumns()
    const res = await run(adapter, "show columns raw json", { form: TABLE_FIXTURE });
    expect(res.length).toBe(1); // sysShowJsonVerbatim()
    expect(hasCodeBlockJson(res[0].content)).toBe(true);
    const parsed = parseLastJsonBlock(res[0].content);
    expect(parsed).toBeTruthy();
    expect(parsed.columns).toEqual(["Column","Title"]);
    expect(parsed.rows).toContainEqual(["trn","TRN"]);
  });

  it("table: preview rows (hidden JSON)", async () => {
    const adapter = makeUiScreenAdapter();
    const res = await run(adapter, "preview rows", { form: TABLE_FIXTURE });
    expect(res.length).toBe(2);
    expect(res[0].content).toContain("Preview Rows (up to 10)");
    expect(res[0].content).toContain("PREVIEW_JSON");
    expect(res[1].content).toContain("PREVIEW_JSON:");
  });

  it("table: preview rows as json (code-fenced token)", async () => {
    const adapter = makeUiScreenAdapter();
    const res = await run(adapter, "preview rows as json", { form: TABLE_FIXTURE });
    expect(res.length).toBe(1);
    expect(hasCodeBlockJson(res[0].content)).toBe(true);
    const parsed = parseLastJsonBlock(res[0].content);
    expect(parsed).toBeTruthy();
    expect(parsed.columns).toEqual(["TRN","Status","Amount"]);
    expect(parsed.rows[0]).toEqual(["T1","pending","10"]);
  });
});
