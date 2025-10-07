// src/organisms/ChatWidget/aiUtils/workdesk.js
import { makeTabularPlugin } from "../../../common/server/ai/tabularPlugin.js";

/* ----------------------------- small utils ----------------------------- */
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const lastSeg = (p) => String(p || "").split(".").filter(Boolean).slice(-1)[0] || String(p || "");

function pathTokens(path) {
  const out = [];
  const re = /([^[.\]]+)|\[(\d+)\]/g;
  let m;
  while ((m = re.exec(String(path))) !== null) out.push(m[1] ?? Number(m[2]));
  return out;
}
function getDeep(obj, path) {
  try { return pathTokens(path).reduce((acc, k) => (acc == null ? undefined : acc[k]), obj); }
  catch { return undefined; }
}
const isEmpty = (v) =>
  v === null || v === undefined ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0);

const firstString = (...vals) =>
  vals.find(v => typeof v === "string" && v.trim())?.trim();

/* ------------------------- zod signature “parser” ------------------------- */
function parseZodHints(sig) {
  const s = typeof sig === "string" ? sig : "";
  const H = { type: null, required: null, min: null, max: null, length: null, email: false, uuid: false, url: false, regex: null };
  if (!s) return H;
  const has = (re) => re.test(s);
  const num = (re) => { const m = s.match(re); return m ? Number(m[1]) : null; };

  if (has(/\.string\(\)/)) H.type = "string";
  else if (has(/\.number\(\)/)) H.type = "number";
  else if (has(/\.boolean\(\)/)) H.type = "boolean";
  else if (has(/\.date\(\)/)) H.type = "date";
  else if (has(/\.array\(\)/)) H.type = "array";
  else if (has(/\.object\(\)/)) H.type = "object";

  H.email = has(/\.email\(\)/);
  H.uuid  = has(/\.uuid\(\)/);
  H.url   = has(/\.url\(\)/);

  H.min = num(/\.min\(\s*(\d+)\s*\)/);
  H.max = num(/\.max\(\s*(\d+)\s*\)/);
  H.length = num(/\.length\(\s*(\d+)\s*\)/);

  const rx = s.match(/\.regex\(\s*\/([^/]+)\/([gimuy]*)\s*\)/);
  if (rx) { try { H.regex = new RegExp(rx[1], rx[2] || ""); } catch {} }

  if (has(/\.required\(\)/)) H.required = true;
  if (has(/\.optional\(\)/) && H.required == null) H.required = false;
  if (has(/\.nonempty\(\)/)) H.required = true;
  if (H.required == null && (H.min > 0 || H.length > 0 || H.email || H.uuid || H.url)) H.required = true;
  return H;
}

/* ----------------------- Form settings flatteners ----------------------- */
function typeFromFieldType(ft) {
  const t = String(ft || "").toLowerCase();
  if (t === "number") return "number";
  if (t === "date") return "date";
  if (t === "switch" || t === "checkbox") return "boolean";
  if (t.includes("group")) return "array";
  if (t === "select" || t === "dropdown" || t === "radio") return "string";
  return "string";
}
function optionValue(o) {
  if (!isObj(o)) return o;
  if ("value" in o) return o.value;
  if ("text" in o) return o.text;
  if ("label" in o) return o.label;
  return o;
}

/** Safely flatten SettingsItem[]; scope to a specific header if provided. */
function flattenSettings(items, acc = [], scopeHeader = null) {
  if (!Array.isArray(items)) return acc;
  for (const it of items) {
    if (!isObj(it)) continue;

    // skip dataTable sections
    if ("dataTable" in it) continue;

    const hasFields = isObj(it) && "fields" in it && Array.isArray(it.fields);
    const hasTabs = isObj(it) && "tabs" in it && Array.isArray(it.tabs);
    const hasAccordion = isObj(it) && "accordion" in it && Array.isArray(it.accordion);
    const header = typeof it.header === "string" ? it.header : null;

    if (hasFields || hasTabs || hasAccordion) {
      const withinScope = !(scopeHeader && header && header !== scopeHeader);

      if (hasFields && withinScope) flattenSettings(it.fields, acc, scopeHeader || header || null);
      if (hasTabs && withinScope) {
        for (const tab of it.tabs) {
          if (isObj(tab) && Array.isArray(tab.fields)) flattenSettings(tab.fields, acc, scopeHeader || header || null);
        }
      }
      if (hasAccordion && withinScope) {
        for (const sec of it.accordion) {
          if (isObj(sec) && Array.isArray(sec.fields)) flattenSettings(sec.fields, acc, scopeHeader || header || null);
        }
      }
      continue;
    }

    // leaf field
    if (typeof it.name === "string" && it.name.trim()) {
      const validationSig = typeof it.validationSig === "string" ? it.validationSig : undefined;
      acc.push({
        name: it.name,
        label: it.label || lastSeg(it.name),
        type: typeFromFieldType(it.type),
        options: Array.isArray(it.options) ? it.options.map(optionValue) : undefined,
        validationSig,
      });
    }
  }
  return acc;
}

/* ------------------------ Table (column) helpers ------------------------ */
function normalizeColumns(cols) {
  if (!Array.isArray(cols)) return [];
  const nameKeys = ["column", "field", "accessorKey", "accessor", "dataIndex", "key", "id", "name"];
  const titleKeys = ["title", "header", "label", "text"];

  const pick = (obj, keys) => {
    for (const k of keys) {
      let v = obj?.[k];
      if (Array.isArray(v)) v = v.join("."); // support path arrays
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
  };

  const out = [];
  for (const c of cols) {
    if (!isObj(c)) continue;
    const col = pick(c, nameKeys);
    const title = pick(c, titleKeys) || (col ? lastSeg(col) : null);
    if (col) out.push({ column: col, title: title || lastSeg(col) });
  }
  return out;
}

function coerceToNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function tableCounts(values, normColumns) {
  // rows can live in multiple places depending on the table lib
  const rows =
    (Array.isArray(values?.rows) && values.rows) ||
    (Array.isArray(values?.data) && values.data) ||         // AntD/DataGrid style
    (Array.isArray(values?.items) && values.items) ||
    (Array.isArray(values?.records) && values.records) ||
    (Array.isArray(values?.list) && values.list) ||
    (Array.isArray(values) ? values : []) ;

  // total can be: number | string(key under values/meta/stats/pagination/page)
  const totalRaw = values?.total;
  const moreTotals = [
    values?.pagination?.total,
    values?.page?.total,
    values?.meta?.total,
  ];

  let rowCount = null;
  if (typeof totalRaw === "number") {
    rowCount = coerceToNumber(totalRaw);
  } else if (typeof totalRaw === "string") {
    const candidates = [
      values?.[totalRaw],
      values?.meta?.[totalRaw],
      values?.stats?.[totalRaw],
      values?.pagination?.[totalRaw],
      values?.page?.[totalRaw],
    ];
    for (const c of candidates) {
      const num = coerceToNumber(c);
      if (num != null) { rowCount = num; break; }
    }
  }
  if (rowCount == null) {
    for (const t of moreTotals) {
      const num = coerceToNumber(t);
      if (num != null) { rowCount = num; break; }
    }
  }
  if (rowCount == null) rowCount = rows.length;

  const colCount = normColumns.length;
  return { rows, rowCount, colCount };
}

function makeColumnsTable(normColumns) {
  return {
    columns: ["Column", "Title"],
    rows: normColumns.map(c => [c.column, c.title]),
  };
}

function makePreviewTable(rows, normColumns, limitRows = 10, limitCols = 6) {
  const useCols = normColumns.slice(0, limitCols);
  const header = useCols.map(c => c.title || c.column);
  const data = (rows || []).slice(0, limitRows).map(r => {
    return useCols.map(c => {
      const v = r?.[c.column];
      if (v == null) return "";
      if (typeof v === "string") return v;
      if (Array.isArray(v) || isObj(v)) return JSON.stringify(v);
      return String(v);
    });
  });
  return { columns: header, rows: data };
}

/* --------------------- Normalization & evaluation --------------------- */
function normalizeAiField(fs) {
  const hints = parseZodHints(fs.validationSig);
  const enumVals = Array.isArray(fs.options) ? fs.options : undefined;

  return {
    name: String(fs.name),
    label: fs.label || lastSeg(fs.name),
    type: fs.type || hints.type || null,
    required: hints.required === true,
    min: hints.min, max: hints.max, length: hints.length,
    email: !!hints.email, uuid: !!hints.uuid, url: !!hints.url,
    pattern: hints.regex || null,
    enum: enumVals,
  };
}
function ruleSummary(spec) {
  const bits = [];
  if (spec.required) bits.push("required");
  if (spec.type) bits.push(`type=${spec.type}`);
  if (spec.email) bits.push("email");
  if (spec.uuid) bits.push("uuid");
  if (spec.url) bits.push("url");
  if (spec.length != null) bits.push(`length=${spec.length}`);
  if (spec.min != null) bits.push(`min=${spec.min}`);
  if (spec.max != null) bits.push(`max=${spec.max}`);
  if (spec.pattern) bits.push(`regex=/${spec.pattern.source}/${spec.pattern.flags || ""}`);
  if (Array.isArray(spec.enum) && spec.enum.length) bits.push(`enum=[${spec.enum.join(", ")}]`);
  return bits.join(", ") || "—";
}

function validateValue(v, spec) {
  const issues = [];
  if (spec.required && isEmpty(v)) { issues.push({ kind: "missing", detail: "Required value is empty" }); return issues; }
  if (isEmpty(v)) return issues;

  if (spec.type) {
    const t = Array.isArray(v) ? "array" : (v instanceof Date ? "date" : typeof v);
    if (spec.type === "date") {
      const ok = (v instanceof Date && !isNaN(v.getTime())) || (typeof v === "string" && !isNaN(Date.parse(v)));
      if (!ok) issues.push({ kind: "type", detail: "Expected a date" });
    } else if (t !== spec.type) {
      issues.push({ kind: "type", detail: `Expected ${spec.type}, got ${t}` });
    }
  }
  if (typeof v === "string") {
    if (spec.length != null && v.length !== spec.length) issues.push({ kind: "length", detail: `Length must be ${spec.length}` });
    else {
      if (spec.min != null && v.length < spec.min) issues.push({ kind: "min", detail: `Min length is ${spec.min}` });
      if (spec.max != null && v.length > spec.max) issues.push({ kind: "max", detail: `Max length is ${spec.max}` });
    }
    if (spec.pattern && !spec.pattern.test(v)) issues.push({ kind: "pattern", detail: `Does not match ${String(spec.pattern)}` });
    if (spec.email) { const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!re.test(v)) issues.push({ kind: "email", detail: "Invalid email" }); }
    if (spec.uuid)  { const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i; if (!re.test(v)) issues.push({ kind: "uuid", detail: "Invalid UUID" }); }
    if (spec.url)   { try { new URL(v); } catch { issues.push({ kind: "url", detail: "Invalid URL" }); } }
  }
  if (Array.isArray(spec.enum) && spec.enum.length) {
    const ok = spec.enum.some((ev) => (ev?.value ?? ev) === v);
    if (!ok) issues.push({ kind: "enum", detail: `Allowed: ${spec.enum.map((x) => x?.value ?? x).join(", ")}` });
  }
  return issues;
}

/**
 * Evaluate context: **Form Mode** (fieldSettings) or **Table Mode** (columnSettings).
 * Also carries description/module/screen.
 */
function evaluateFormOrTable(form, ctx) {
  const moduleName =
    firstString(
      form?.currentModule,
      form?.module,
      form?.current_module,
      form?.moduleName,
      form?.meta?.currentModule,
      ctx?.currentModule,
      ctx?.module,
      ctx?.meta?.currentModule,
      ctx?.form?.currentModule,
      ctx?.form?.module
    ) || "Unknown Module";

  const description =
    firstString(
      form?.description,
      form?.meta?.description,
      ctx?.description,
      ctx?.form?.description
    ) || "";

  const screen = String(form?.currentScreen || "Unknown");

  // IMPORTANT: require >0 length so empty arrays don't force form/table mode
  const hasFieldSettings  = Array.isArray(form?.fieldSettings)  && form.fieldSettings.length  > 0;
  const hasColumnSettings = Array.isArray(form?.columnSettings) && form.columnSettings.length > 0;

  /* ---------- FORM MODE ---------- */
  if (hasFieldSettings) {
    const values = isObj(form?.data) ? form.data : isObj(form?.values) ? form.values : {};

    // Try scoped; fallback to all fields if no matching header
    let flat = flattenSettings(form.fieldSettings || [], [], screen);
    const scopeMatched = flat.length > 0;
    if (!flat.length) flat = flattenSettings(form.fieldSettings || [], [], null);

    const specs = flat.map(normalizeAiField);

    const problems = [];
    for (const s of specs) {
      const v = getDeep(values, s.name);
      const errs = validateValue(v, s);
      if (errs.length) {
        problems.push({
          path: s.name,
          label: s.label,
          valuePreview: typeof v === "string" ? (v.length > 60 ? v.slice(0, 57) + "…" : v) : v,
          issues: errs,
        });
      }
    }

    const empties = specs
      .filter((s) => isEmpty(getDeep(values, s.name)))
      .map((s) => [s.label || lastSeg(s.name), s.name]);
    const emptiesTable = { columns: ["Field", "Path"], rows: empties };

    const counts = {
      missing: problems.filter(p => p.issues.some(i => i.kind === "missing")).length,
      invalid: problems.filter(p => p.issues.some(i => i.kind !== "missing")).length,
      total: problems.length,
      requiredFields: specs.filter(s => s.required).length,
      emptyValues: empties.length,
    };

    const fieldsTable = {
      columns: ["Field", "Path", "Type", "Required"],
      rows: specs.map(s => [s.label, s.name, s.type || "unknown", s.required ? "Yes" : "No"]),
    };
    const fieldsWithRulesTable = {
      columns: ["Field", "Path", "Type", "Required", "Rules"],
      rows: specs.map(s => [s.label, s.name, s.type || "unknown", s.required ? "Yes" : "No", ruleSummary(s)]),
    };
    const dataTable = {
      columns: ["Field", "Path", "Value"],
      rows: specs.map(s => {
        const v = getDeep(values, s.name);
        const show = (vv) =>
          vv == null ? "" :
          typeof vv === "string" ? vv :
          Array.isArray(vv) ? JSON.stringify(vv) :
          typeof vv === "object" ? JSON.stringify(vv) : String(vv);
        return [s.label, s.name, show(v)];
      }),
    };
    const issuesTable = {
      columns: ["Field", "Problem", "Detail", "Value"],
      rows: problems.flatMap(p => p.issues.map(i => [p.label || lastSeg(p.path), i.kind.toUpperCase(), i.detail, String(p.valuePreview ?? "")])),
    };
    const requiredList = specs.filter(s => s.required).map(s => [s.label || lastSeg(s.name), s.name]);

    return {
      mode: "form",
      module: moduleName,
      screen,
      description,
      scopeMatched,
      counts,
      fieldsCount: specs.length,
      requiredList,
      fieldsTable,
      fieldsWithRulesTable,
      dataTable,
      issuesTable,
      emptiesTable,
    };
  }

  /* ---------- TABLE MODE ---------- */
  if (hasColumnSettings) {
    const columnsNorm = normalizeColumns(form.columnSettings);
    const { rows, rowCount, colCount } = tableCounts(form?.values, columnsNorm);
    const columnsTable = makeColumnsTable(columnsNorm);
    const previewTable = makePreviewTable(rows, columnsNorm, 10, 6);

    return {
      mode: "table",
      module: moduleName,
      screen,
      description,
      columns: columnsNorm,
      colCount,
      rowCount,
      columnsTable,
      previewTable,
    };
  }

  /* ---------- UNKNOWN MODE ---------- */
  return {
    mode: "unknown",
    module: moduleName,
    screen,
    description,
  };
}

/* -------------------------- intent detectors -------------------------- */
const wantsScreen   = (q="") => /\b(where am i|what screen|current screen|which screen)\b/i.test(q);
const wantsModule   = (q="") => /\b(current\s+module|which\s+module|what\s+module)\b/i.test(q);
const wantsAnalyze  = (q="") => /\b(analy[sz]e|validate|validation|what'?s missing|missing fields?|invalid|errors?)\b/i.test(q);
const wantsRequired = (q="") => /\b(required fields?|which fields are required|list required)\b/i.test(q);

// --- dataset analytics intents → must delegate to tabularPlugin ---
const wantsOldest = (q = "") =>
  /\b(oldest|earliest|first)\b/.test(q) &&
  /\b(transactions?|txns?|rows?|records?)\b/i.test(q);

const wantsLatest = (q = "") =>
  /\b(latest|newest|most\s+recent|last)\b/i.test(q) &&
  /\b(transactions?|txns?|rows?|records?)\b/i.test(q);

// broadened fields/data asks (form mode)
const wantsFieldsList = (q="") =>
  /\b(show|see|list|view)\b.*\bfields?\b/i.test(q) ||
  /\b(what\s+fields?\s+(?:do\s+we\s+)?have)\b/i.test(q) ||
  /\b(general\s+details\s+fields?)\b/i.test(q) ||
  /\b(what\s+are\s+the\s+(?:general\s+details\s+)?fields?)\b/i.test(q);

const wantsFieldsWithValidation = (q="") =>
  /\b(fields?).*(validation|rules|constraints)\b/i.test(q) ||
  /\b(validation|rules|constraints)\b.*\b(fields?)\b/i.test(q) ||
  /\b(fields?\s+with\s+validation)\b/i.test(q);

const wantsFormData = (q="") =>
  /\b(show|see|view|print|dump|display)\b.*\b(data|values?|form|general details)\b/i.test(q) ||
  /\b(general\s+details\s+data|current\s+values?)\b/i.test(q);

// table intents
const wantsColumns = (q="") =>
  /\b(list|show|view|what)\b.*\b(columns?)\b/i.test(q) ||
  /\b(what\s+columns?)\b/i.test(q);

const wantsPreview = (q="") =>
  /\b(show|view|see|print|sample|preview|show data|show table)\b/i.test(q) && /\b(rows?|data|table)\b/i.test(q);

/* ------------------------------ plugin ------------------------------ */
export function workdeskPlugin({ baseUrl, cacheTtlMs = 0, makeDownloadLink }) {
  const base = makeTabularPlugin({
    baseUrl,
    cacheTtlMs,
    endpoints: { list: "/workdesk", full: "/workdesk/full", byKey: (trn) => `/txn/${trn}` },
    memory: {
      datasetName: "Workdesk",
      itemSingular: "transaction",
      itemPlural: "transactions",
      synonyms: ["row", "record", "entry", "txn"],
    },
    shape: {
      timestampAccessor: (row) =>
        typeof row?.__receivedAtMs === "number" ? row.__receivedAtMs
        : typeof row?.base?.__receivedAtMs === "number" ? row.base.__receivedAtMs
        : Date.parse(row?.receivedAt || row?.base?.receivedAt || ""),
      statusAccessor: (row) => {
        const ws = row?.workflowStage ?? row?.base?.workflowStage ?? row?.status ?? row?.base?.status ?? "";
        return /pending|initiated|in[-\s]?progress|awaiting|on[-\s]?hold|review|draft/i.test(ws) ? "PENDING" : "REGISTERED";
      },
      keyAccessor: (row) => row?.trn ?? row?.base?.trn ?? row?.id ?? row?.base?.id,
    },
    facets: [
      (r) => (r?.product ?? r?.base?.product),
      (r) => (r?.bookingLocation ?? r?.base?.bookingLocation),
      (r) => (r?.workflowStage ?? r?.base?.workflowStage),
      (r) => {
        const ms =
          typeof r?.__receivedAtMs === "number" ? r.__receivedAtMs
          : typeof r?.base?.__receivedAtMs === "number" ? r.base.__receivedAtMs
          : Date.parse(r?.receivedAt || r?.base?.receivedAt || "");
        if (!Number.isFinite(ms)) return undefined;
        return new Date(ms).getUTCFullYear();
      },
    ],
    alwaysDeepFetchAll: true,
    brandNames: ["tradexpress helix", "trade express helix", "helix", "tradeexpress"],
    kb: {
      brand: "TradeXpress Helix",
      title: "About TradeXpress Helix",
      tagline: "A modern, AI-assisted workdesk for trade operations.",
      about: `
        Event-driven, global platform for Trade Finance, simplified.
        TradeXpress is next generation state of the art application developed using event driven
        architecture to support trade finance transaction processing. TradeXpress is a global
        Business, Technology and Operations initiative that will revolutionise the Trade Finance
        world for the Bank. The key objectives of Trade Port are to provide our clients with a
        complete suite of products across all our markets; to become number one Trade Finance
        bank globally. We will re-align our operations model to address market and economic
        pressures implementing a standard global target operating model. And we will deliver a
        fully integrated back end operating platform that will enable greater efficiencies and
        provide comprehensive product offerings across all our markets.

        TradeXpress will drive extensive benefits for our clients as well as our staff. Clients
        will be able to access broader trade product offering delivered consistently in all our
        markets. New products or capabilities will be available sooner across the network. Using
        a single global system with integrated workflow and imaging, processing of clients
        transactions will be completed faster, eliminating the need for cut off times and
        introducing a true 24/7 operating environment. Workflow management will ensure
        transactions will be accurately tracked, traced, monitored and routed based on various
        predefined parameters to different teams for better control and efficiency. With the
        Bank&apos;s global footprint, exporters and importers across all client segments — from
        SME to Global Corporates — will benefit. TradeXpress will enable one-step processing for
        transactions where clients at both ends of the transaction bank with SCB.
      `,
      keyCapabilities: [
        "Unified transaction workdesk (EIF/IIF/SUF and more)",
        "AI summaries and date-range analytics over historical data",
        "Exception visibility and status tracking",
        "Lightweight retrieval APIs for dashboards and bots",
      ],
      whoItServes: ["Trade Operations", "Middle Office", "Risk/Compliance", "Business Ops"],
      dataModelNotes: { itemTerminology: "Each row is a transaction", latestDefinition: "Latest = highest __receivedAtMs / most recent receivedAt" },
      contact: { general: "helix-support@tradexpress.example", security: "security@tradexpress.example", website: "https://example.com/helix" },
      ownership: { productOwnerTeam: "Helix Platform", engineeringTeam: "Helix Engineering", maintainerGroup: "Helix Core Services" },
      people: [
        { role: "Head, Platform and AI Engineering", name: "Nox", email: "nox@sc.com" },
        { role: "Engineering Lead, Application Frameworks", name: "Neil", email: "neil@sc.com" },
        { role: "Engineering Lead, Strategic Foundation Services", name: "Krishna", email: "krishna@sc.com" },
        { role: "Developer", name: "King", email: "king@sc.com" },
        { role: "Developer", name: "Clem", email: "clem@sc.com" },
      ],
    },
    makeDownloadLink
  });

  return {
    ...base,
    augment: async ({ text, messages, context }) => {
      const q = String(text || "").trim();
      const rawForm = context?.form;

      // Always delegate dataset analytics to the base tabular plugin
      if (wantsLatest(q) || wantsOldest(q)) {
        return base.augment({ text, messages, context });
      }

      // Intercept when we actually have form or column settings
      const hasForm =
        isObj(rawForm) &&
        (
          (Array.isArray(rawForm.fieldSettings)  && rawForm.fieldSettings.length  > 0) ||
          (Array.isArray(rawForm.columnSettings) && rawForm.columnSettings.length > 0)
        );

      // ---------- NO-FORM FALLBACK ----------
      if (!hasForm) {
        if (wantsScreen(q) || wantsModule(q)) {
          const mod = firstString(context?.currentModule, context?.form?.currentModule);
          const scr = firstString(context?.currentScreen, context?.form?.currentScreen);

          if (!mod || !scr) {
            const msg =
`I don't have your current screen context yet.
To set it, open a module via the side menu or press **Alt + .** to launch the module/screen switcher.

What I can do next:
- Help with generic analytics (e.g., "status mix this month")
- Export or summarize historical data
- Validate form/table once you connect this chat to your UI context`;
            return [{ role: "system", content: `Return exactly the following Markdown (verbatim):\n\n${msg}` }];
          }

          const msg =
`You are currently in **${mod}** module and currently viewing **${scr}**.

What I can do next:
- List columns or preview rows (once table context is connected)
- Validate fields (once form context is connected)
- Summarize or export data`;
          return [{ role: "system", content: `Return exactly the following Markdown (verbatim):\n\n${msg}` }];
        }

        // Anything else → fall back to dataset behavior
        return base.augment({ text, messages, context });
      }

      // ---------- FORM/TABLE INTENTS ----------
      const evalRes = evaluateFormOrTable(rawForm, context);
      const title = `${evalRes.module} / ${evalRes.screen}`;

      // where am i / which module — description + stats + fallback tip
      if (wantsScreen(q) || wantsModule(q)) {
        const bulletsForm =
          `- Validate this\n` +
          `- Which fields are required?\n` +
          `- Show empty fields\n` +
          `- Show form data`;

        const bulletsTable =
          `- List columns\n` +
          `- Preview first 10 rows\n` +
          `- Summarize columns`;

        const descPart = evalRes.description ? ` ${evalRes.description.trim()}` : "";

        let statsPart = "";
        if (evalRes.mode === "table") {
          statsPart = ` This view contains a table with **${evalRes.colCount} columns** and **${evalRes.rowCount} rows**.`;
        } else if (evalRes.mode === "form") {
          statsPart = ` This screen has **${evalRes.fieldsCount} fields** (${evalRes.counts.requiredFields} required).`;
        }

        const isUnknown = evalRes.module === "Unknown Module" || evalRes.screen === "Unknown";
        const tip = isUnknown ? `\n\nTip: Press **Alt + .** to open the module/screen switcher.` : "";

        const finalText =
          `You are currently in **${evalRes.module}** module and currently viewing **${evalRes.screen}**.` +
          `${descPart}${statsPart}\n\n` +
          `What I can do next:\n${evalRes.mode === "table" ? bulletsTable : bulletsForm}` +
          tip;

        return [{
          role: "system",
          content: `Return exactly the following Markdown as the full answer (verbatim):\n\n${finalText}`
        }];
      }

      /* ---------- FORM MODE paths ---------- */
      if (evalRes.mode === "form") {
        if (wantsFieldsWithValidation(q)) {
          const note = evalRes.scopeMatched ? "" : `\n_Note: No section titled "${evalRes.screen}" found; showing all fields._\n`;
          return [{
            role: "system",
            content:
              `**Fields & Validation — ${title}**.${note}\n` +
              `Render a compact table with headers: ${evalRes.fieldsWithRulesTable.columns.join(" | ")} using FIELDS_RULES_JSON.\n\n` +
              `FIELDS_RULES_JSON:\n\`\`\`json\n${JSON.stringify(evalRes.fieldsWithRulesTable)}\n\`\`\``,
          }];
        }

        if (wantsFieldsList(q)) {
          const note = evalRes.scopeMatched ? "" : `\n_Note: No section titled "${evalRes.screen}" found; showing all fields._\n`;
          return [{
            role: "system",
            content:
              `**Fields — ${title}**.${note}\n` +
              `Render a compact table with headers: ${evalRes.fieldsTable.columns.join(" | ")} using FIELDS_JSON.\n\n` +
              `FIELDS_JSON:\n\`\`\`json\n${JSON.stringify(evalRes.fieldsTable)}\n\`\`\``,
          }];
        }

        if (wantsFormData(q)) {
          const note = evalRes.scopeMatched ? "" : `\n_Note: No section titled "${evalRes.screen}" found; showing all fields._\n`;
          return [{
            role: "system",
            content:
              `**${title} — Current Values**.${note}\n` +
              `Render a compact table with headers: ${evalRes.dataTable.columns.join(" | ")} using DATA_JSON.\n\n` +
              `DATA_JSON:\n\`\`\`json\n${JSON.stringify(evalRes.dataTable)}\n\`\`\``,
          }];
        }

        if (wantsRequired(q)) {
          if (!evalRes.requiredList.length) {
            return [{ role: "system", content: `No required fields are defined for ${title}.` }];
          }
          return [{
            role: "system",
            content:
              `**Required Fields — ${title}**\n` +
              `Render a compact table "Field | Path" using REQUIRED_JSON.\n\n` +
              `REQUIRED_JSON:\n\`\`\`json\n${JSON.stringify(evalRes.requiredList)}\n\`\`\``,
          }];
        }

        if (wantsAnalyze(q)) {
          return [{
            role: "system",
            content:
              `First line: "**${title}** — Missing: ${evalRes.counts.missing}, Invalid: ${evalRes.counts.invalid}".\n` +
              (evalRes.issuesTable.rows.length
                ? `Then render a compact table with headers: ${evalRes.issuesTable.columns.join(" | ")} using FORM_ISSUES_JSON.`
                : `Then say "All checks passed. Ready to submit."`) +
              `\n\nFORM_ISSUES_JSON:\n\`\`\`json\n${JSON.stringify(evalRes.issuesTable)}\n\`\`\``,
          }];
        }

        // No form-specific intent → let tabularPlugin handle dataset Qs like "oldest tx", "per year"
        return base.augment({ text, messages, context });
      }

      /* ---------- TABLE MODE paths ---------- */
      if (evalRes.mode === "table") {
        if (wantsColumns(q)) {
          return [{
            role: "system",
            content:
              `**Columns — ${title}**\n` +
              `Render a compact table with headers: ${evalRes.columnsTable.columns.join(" | ")} using COLUMNS_JSON.\n\n` +
              `COLUMNS_JSON:\n\`\`\`json\n${JSON.stringify(evalRes.columnsTable)}\n\`\`\``,
          }];
        }

        if (wantsPreview(q)) {
          return [{
            role: "system",
            content:
              `**Preview Rows (up to 10) — ${title}**\n` +
              `Render a compact table using PREVIEW_JSON.\n\n` +
              `PREVIEW_JSON:\n\`\`\`json\n${JSON.stringify(evalRes.previewTable)}\n\`\`\``,
          }];
        }

        // No table-specific intent → let tabularPlugin handle analytics questions
        return base.augment({ text, messages, context });
      }

      // Unknown mode → fall through
      return base.augment({ text, messages, context });
    }
  };
}
