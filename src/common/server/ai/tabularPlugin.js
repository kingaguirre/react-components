// src/common/server/ai/tabularPlugin.js 

/**
 * makeTabularPlugin — reusable plugin factory for “table-like” datasets.
 *
 * Fixes added:
 * - Per-chat state (sidKey) so “export it” uses THIS thread’s scope.
 * - Persist uploaded CSV/XLSX per chat (state.lastUpload).
 * - “Export it” uses lastAggregation; “export all” respects upload header template.
 * - Robust export links (download route or data: URL) — never emit broken links.
 */

const __uiPrefs = new Map();           // Map<sidKey, { alwaysTable?: boolean }>
const __sessionState = new Map();      // Map<sidKey, { lastRange?, lastTopN?, lastGrain?, lastAggregation?, lastUpload? }>
const __lastAggregation = new Map();   // Map<sidKey, { columns: string[], rows: Array<string[]>, meta? }>

const getSessionId   = (context, fallback = "default") => String(context?.sessionId || fallback);
const getState       = (sid) => __sessionState.get(sid) || {};
const setState       = (sid, update) => __sessionState.set(sid, { ...getState(sid), ...update });
const setAggregation = (sid, agg) => __lastAggregation.set(sid, agg || null);
const getAggregation = (sid) => __lastAggregation.get(sid) || null;

const slug = (s, max = 48) =>
  (String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max)) || "selection";

// ---------- per-chat scoping ----------
function deriveThreadId(messages) {
  if (Array.isArray(messages)) {
    for (const m of messages) {
      if (m?.role === "user" && typeof m?.id === "string" && m.id.trim()) {
        return `u:${m.id}`;
      }
    }
    if (messages[0]?.id) return `m:${String(messages[0].id)}`;
  }
  return "t0";
}
function makeSidKey(context, messages) {
  const sid = getSessionId(context, "default");
  return `${sid}::${deriveThreadId(messages)}`;
}

// ---------- inline HTML helpers for “Updated” lines ----------
const USE_INLINE_HTML = true;
function escHtml(s) { return String(s).replace(/[&<>]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[c] || c)); }
function chip(label) { if (!USE_INLINE_HTML) return `**${label}**`; return `<span style="background:#fff7d6;color:#7a5d00;padding:0 .30em;border-radius:.25em;white-space:nowrap;font-weight:600">${escHtml(label)}</span>`; }
function oldVal(v) { const t = escHtml(String(v || "")); return USE_INLINE_HTML ? `<span style="color:#b00020;font-weight:600">${t}</span>` : t; }
function newVal(v) { const t = escHtml(String(v || "")); return USE_INLINE_HTML ? `<span style="color:#0b6d00;font-weight:700">${t}</span>` : t; }
function arrow() { return USE_INLINE_HTML ? `<span style="opacity:.85">&rarr;</span>` : `→`; }
function showVal(v) { return String(v || "") === "" ? "(empty)" : String(v); }

export function makeTabularPlugin(options) {
  const {
    baseUrl,
    endpoints,              // { list: "/workdesk", full: "/workdesk/full", byKey: (id) => `/txn/${id}` }
    memory,                 // { datasetName, itemSingular, itemPlural, synonyms, hotsetLimit? }
    shape,                  // { timestampAccessor(row), statusAccessor(row), keyAccessor(row) }
    facets = [],
    alwaysDeepFetchAll = true,
    hotsetLimit,
    kb = null,
    brandNames = [],
    makeDownloadLink = null, // (buffer, filename, mime, ttlMs?) => string|Promise<string>
  } = options;

  const HOTSET_LIMIT =
    Number.isFinite(hotsetLimit) ? hotsetLimit
    : Number.isFinite(memory?.hotsetLimit) ? memory.hotsetLimit
    : 0;

  // -------------------- generic/help detector --------------------
  const BASE_HELP_RE = new RegExp(
    [
      String.raw`\bwhat (?:can|do) you (?:do|answer)\b`,
      String.raw`\bcapabilities\b`,
      String.raw`\bcommands?\b`,
      String.raw`\bexamples?\b`,
      String.raw`\bsample prompts?\b`,
      String.raw`\bhelp\b`,
      String.raw`\bhow (?:do i|to) (?:use|ask)\b`,
      String.raw`\bwho are you\b`,
      String.raw`\bshow (?:me )?(?:examples?|samples?)\b`,
      String.raw`\bwhat else (?:can )?i (?:ask|do)\b`,
      String.raw`\bwhat should i ask\b`,
      String.raw`\bsuggest(?: some)? (?:queries|questions|prompts)\b`,
    ].join("|"),
    "i"
  );
  function isGenericAssistantQuery(q) {
    q = String(q || "").toLowerCase().trim();
    if (!q) return false;
    return BASE_HELP_RE.test(q);
  }

  // -------------------- brand matching --------------------
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const includesToken = (hay, tok) => norm(hay).includes(norm(tok));
  const RAW_BRAND_TOKENS = (brandNames || []);
  const BRAND_TOKENS = RAW_BRAND_TOKENS.map(norm);
  function mentionedBrandInHistory(messages) {
    if (!Array.isArray(messages) || !BRAND_TOKENS.length) return false;
    for (let i = messages.length - 1; i >= 0; i--) {
      const c = String(messages[i]?.content || "");
      if (BRAND_TOKENS.some((t) => includesToken(c, t))) return true;
    }
    return false;
  }
  function brandIntent(qRaw, messages) {
    const s = String(qRaw || "");
    if (!BRAND_TOKENS.length) return false;
    const mentionsBrandNow = RAW_BRAND_TOKENS.some((t) => includesToken(s, t));
    const mentionsBrandRecently = mentionedBrandInHistory(messages);
    const referencesBrand = mentionsBrandNow || mentionsBrandRecently;
    const aboutVerbs = /\b(what is|about|overview|explain|describe|tell me about|docs?|documentation)\b/i;
    const teamVerbs  = /\b(who (?:built|made|developed|created)|team\s+(?:behind|that built)|who\s+(?:is|’s|'s)\s+behind)\b/i;
    const worksVerbs = /\bwho\s+(?:works|is working)\s+(?:in|on|at)\b/i;
    const contactVerbs =
      /\b(who\s+(?:can|should)\s+i\s+(?:ask|contact)|contact(?:\s+(?:person|point|poc))?|point of contact|owner|product owner|maintainer|escalation|reach out to|email|support|helpdesk)\b/i;
    return referencesBrand && (aboutVerbs.test(s) || teamVerbs.test(s) || worksVerbs.test(s) || contactVerbs.test(s));
  }

  // -------------------- service-like asks --------------------
  function serviceIntent(qRaw) {
    const s = String(qRaw || "").toLowerCase();
    if (/\b(weather|forecast|temperature)\b/.test(s)) return { kind: "weather" };
    if (/\btime\b/.test(s) && !/processing|lifetime|lead[\s-]?time/.test(s)) return { kind: "time" };
    if (/\bmap|direction|traffic\b/.test(s)) return { kind: "maps" };
    return null;
  }

  // -------------------- “table please” detectors --------------------
  function formatDirectiveIntent(qRaw) {
    const s = String(qRaw || "").toLowerCase();
    const mentionsTable = /\b(table|tabular|markdown table|grid)\b/.test(s);
    const mentionsSummary = /\bsummary|summaries|list|listing|show\b/.test(s);
    const wantsFormat = /\b(use|show|render|format|make|ensure|force|always|default|as)\b/.test(s);
    if (mentionsTable && (mentionsSummary || wantsFormat)) {
      return {
        kind: "table",
        always: /\b(always|by default|default)\b/.test(s),
        oneShot: /\b(as|this turn|for now|just)\b/.test(s) && !/\b(always|by default|default)\b/.test(s),
      };
    }
    return null;
  }
  const wantsTableNow = (qRaw) => /\b(table|tabular|markdown table|grid)\b/i.test(String(qRaw || ""));

  // -------------------- export detectors --------------------
  function exportIntent(qRaw) {
    const s = String(qRaw || "").toLowerCase();
    const ask = /\b(export|download|save|dump|extract)\b/.test(s);
    const wantCsv = /\b(csv|comma[-\s]?separated)\b/.test(s);
    const wantXlsx = /\b(xlsx|excel|spreadsheet)\b/.test(s);
    if (!(ask || wantCsv || wantXlsx)) return null;
    return { kind: wantXlsx ? "xlsx" : "csv" };
  }

  // -------------------- compare detectors --------------------
  function compareIntent(qRaw) {
    const s = String(qRaw || "").toLowerCase();
    return /\b(compare|diff(?:erence)?|what'?s new|what changed|changes?)\b/i.test(s);
  }

  // -------------------- data helpers --------------------
  function flatten(row) { return row && row.base ? { ...row.base, ...row.derived } : (row || {}); }
  function flattenRowForExport(row) { return flatten(row); }

  function collectHeaders(rows) {
    const keys = new Set();
    for (const r of rows) Object.keys(r || {}).forEach(k => keys.add(k));
    const preferred = ["trn","id","receivedAt","__receivedAtMs","workflowStage","status","product","bookingLocation"];
    const rest = [...keys].filter(k => !preferred.includes(k));
    return preferred.filter(k => keys.has(k)).concat(rest);
  }

  function collectHeadersWithTemplate(rows, canonOrder = []) {
    const all = collectHeaders(rows);
    if (!canonOrder?.length) return all;
    const canonSet = new Set(canonOrder);
    const canonFirst = all.filter(h => canonSet.has(canonicalKeyName(h)));
    const rest = all.filter(h => !canonSet.has(canonicalKeyName(h)));
    return [...canonFirst, ...rest];
  }

  function toCSVBuffer(rows, headersOverride) {
    const flat = rows.map(flattenRowForExport);
    const headers = Array.isArray(headersOverride) && headersOverride.length ? headersOverride : collectHeaders(flat);
    const esc = (v) => {
      if (v == null) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    };
    const lines = [headers.join(",")];
    for (const r of flat) lines.push(headers.map(h => esc(r[h])).join(","));
    return Buffer.from(lines.join("\n"), "utf8");
  }

  async function toXLSXBuffer(rows, headersOverride) {
    try {
      const mod = await import("exceljs");
      const ExcelJS = mod?.default ?? mod;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("data");
      const flat = rows.map(flattenRowForExport);
      const headers = Array.isArray(headersOverride) && headersOverride.length ? headersOverride : collectHeaders(flat);
      ws.columns = headers.map(h => ({ header: h, key: h }));
      flat.forEach(r => ws.addRow(headers.reduce((o,h)=> (o[h]=r[h], o), {})));
      const buf = await wb.xlsx.writeBuffer();
      return Buffer.from(buf);
    } catch {
      return toCSVBuffer(rows, headersOverride);
    }
  }

  function toDataUrl(mime, buf, maxBytes = 750 * 1024) {
    if (!buf || buf.length > maxBytes) return null;
    const b64 = buf.toString("base64");
    return `data:${mime};base64,${b64}`;
  }

  // -------------------- scope rubric (soft, advisory) --------------------
  function scopeRubricSystem({ datasetName = "Workdesk", itemPlural = "items", brandTokens = [] } = {}) {
    const brandList = brandTokens.length ? brandTokens.join(", ") : "your brand";
    return {
      role: "system",
      content:
`Scope Rubric (self-judge, then act):
- PRIMARY SCOPE: ${datasetName} ${itemPlural} — counts, date ranges, latest/oldest, status mixes, TRN lookups.
- META (capabilities/help/how to ask): answer friendly + 4–6 example prompts (bullets; NOT a table unless user asked).
- BRAND (${brandList}): when asked, answer using KB_JSON only; if unknown, say you don’t know.
- SERVICE (weather/time/maps/external tools): one sentence that this chat has no live access, then offer 3–5 in-scope ideas (bullets; NOT a table unless user asked).
- OUT-OF-SCOPE TRIVIA/DEFINITIONS: decline briefly and show 4–6 in-scope examples (bullets; NOT a table unless user asked).
- IN-SCOPE: proceed; use DEEP_FETCH_JSON if present. Never claim “no access” when DEEP_FETCH_JSON is provided.

Formatting default: concise sentences or bullets. Only use a table if the user explicitly asks or a persistent “always table” preference is set.
`
    };
  }

  // -------------------- date helpers --------------------
  const DAY = 24 * 60 * 60 * 1000;
  const startOfDay = (ms) => { const d = new Date(ms); d.setHours(0,0,0,0); return d.getTime(); };

  function defaultRangeForGrain(grain) {
    const now = Date.now();
    const untilMs = now;
    let sinceMs;
    switch (grain?.kind) {
      case "year":    sinceMs = now - 3 * 365 * DAY; break;
      case "quarter": sinceMs = now - 12 * 30 * DAY; break;
      case "month":   sinceMs = now - 12 * 30 * DAY; break;
      case "week":    sinceMs = now - 12 * 7 * DAY; break;
      case "day":     sinceMs = now - 30 * DAY; break;
      case "nweek":   sinceMs = now - Math.max(12 * (grain.n || 1) * 7 * DAY, 8 * 7 * DAY); break;
      case "nday":    sinceMs = now - Math.max(12 * (grain.n || 1) * DAY, 30 * DAY); break;
      default:        sinceMs = now - 30 * DAY;
    }
    return { sinceMs, untilMs, label: "recent period" };
  }

  function getPath(obj, path) {
    if (!obj) return undefined;
    const parts = String(path).split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in cur) cur = cur[p];
      else return undefined;
    }
    return cur;
  }

  function parseAnyDate(val) {
    if (val == null) return NaN;
    if (typeof val === "number") {
      if (!Number.isFinite(val)) return NaN;
      if (val >= 1e12) return val;      // ms
      if (val >= 1e9)  return val * 1000; // seconds
      return val;
    }
    const s = String(val).trim();
    if (!s) return NaN;

    if (/^\d{10,13}$/.test(s)) {
      const n = Number(s);
      return s.length === 13 ? n : n * 1000;
    }
    if (/\d{4}-\d{2}-\d{2}T/.test(s) || /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(s)) {
      const t = Date.parse(s.replace(" ", "T"));
      return Number.isFinite(t) ? t : NaN;
    }
    let m = s.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})$/);
    if (m) {
      const [_, Y, M, D] = m.map(Number);
      const t = Date.parse(`${Y}-${String(M).padStart(2, "0")}-${String(D).padStart(2, "0")}T00:00:00Z`);
      return Number.isFinite(t) ? t : NaN;
    }
    m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (m) {
      const D = Number(m[1]), M = Number(m[2]), Y = Number(m[3]);
      const hh = Number(m[4] ?? 0), mm = Number(m[5] ?? 0), ss = Number(m[6] ?? 0);
      const month = String(M).padStart(2, "0");
      const day   = String(D).padStart(2, "0");
      const time  = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
      const t = Date.parse(`${Y}-${month}-${day}T${time}Z`);
      return Number.isFinite(t) ? t : NaN;
    }
    m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (m) {
      const a = Number(m[1]), b = Number(m[2]), Y = Number(m[3]);
      const hh = Number(m[4] ?? 0), mm = Number(m[5] ?? 0), ss = Number(m[6] ?? 0);
      if (b > 12) {
        const month = String(a).padStart(2, "0");
        const day   = String(b).padStart(2, "0");
        const time  = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
        const t = Date.parse(`${Y}-${month}-${day}T${time}Z`);
        return Number.isFinite(t) ? t : NaN;
      }
    }
    const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","sept","oct","nov","dec"];
    if (MONTHS.some(mn => s.toLowerCase().includes(mn))) {
      const t = Date.parse(s);
      if (Number.isFinite(t)) return t;
    }
    const t = Date.parse(s);
    return Number.isFinite(t) ? t : NaN;
  }

  const CANDIDATE_DATE_FIELDS = [
    "__receivedAtMs", "base.__receivedAtMs",
    "timestampMs", "base.timestampMs",
    "timestamp", "base.timestamp",
    "receivedAt", "base.receivedAt",
    "createdAt", "base.createdAt",
    "updatedAt", "base.updatedAt",
    "processedAt", "base.processedAt",
    "ingestedAt", "base.ingestedAt",
    "bookingDate", "base.bookingDate",
    "valueDate", "base.valueDate",
    "date", "base.date",
    "workflow.receivedAt", "base.workflow.receivedAt",
  ];

  function smartTimestampMs(row) {
    for (const path of CANDIDATE_DATE_FIELDS) {
      const v = getPath(row, path);
      if (v == null) continue;
      const t = parseAnyDate(v);
      if (Number.isFinite(t)) return t;
    }
    const r = row && row.base ? { ...row.base, ...row.derived } : (row || {});
    for (const [k, v] of Object.entries(r)) {
      if (!/date|time|at|received|created|updated|processed/i.test(k)) continue;
      const t = parseAnyDate(v);
      if (Number.isFinite(t)) return t;
    }
    return NaN;
  }

  const timestampAccessor = (row) => {
    try {
      if (shape?.timestampAccessor) {
        const t = shape.timestampAccessor(row && row.base ? { ...row.base, ...row.derived } : row);
        if (Number.isFinite(t)) return t;
      }
    } catch {}
    return smartTimestampMs(row);
  };

  const computeStatus = (row) => {
    const f = flatten(row);
    if (shape?.statusAccessor) return shape.statusAccessor(f);
    const raw = String(
      f?.status ?? f?.workflowStatus ?? f?.workflowStage ?? f?.stage ?? ""
    );
    return /\b(pending|initiated|in[-\s]?progress|awaiting|on[-\s]?hold|review|draft)\b/i.test(raw)
      ? "PENDING" : "REGISTERED";
  };

  const keyAccessor = (row) => shape?.keyAccessor ? shape.keyAccessor(flatten(row)) : (row?.id ?? row?.base?.id);

  async function fetchJson(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url} -> ${r.status}`);
    return await r.json();
  }

  async function fetchHotset(limit = HOTSET_LIMIT) {
    if (!limit || limit <= 0) return [];
    const url = `${baseUrl}${endpoints.list}?limit=${limit}&sortBy=receivedAt&order=desc`;
    const payload = await fetchJson(url);
    return Array.isArray(payload?.rows) ? payload.rows : [];
  }

  async function fetchAll() {
    const fullBase = `${baseUrl}${endpoints.full}`;
    const sep = fullBase.includes("?") ? "&" : "?";
    const url = `${fullBase}${sep}limit=0`;
    const payload = await fetchJson(url);
    return Array.isArray(payload?.rows) ? payload.rows : [];
  }

  async function deepFetchLatestN(n) {
    try {
      const url = `${baseUrl}${endpoints.list}?limit=${n}&sortBy=receivedAt&order=desc`;
      const payload = await fetchJson(url);
      const rows = Array.isArray(payload?.rows) ? payload.rows : [];
      if (rows.length) return present("latestN", rows, { request: { n } });
    } catch {}
    // Fallback: get all and sort locally
    try {
      const all = await fetchAll();
      const sorted = [...all].sort(
        (a, b) => (timestampAccessor(b) || 0) - (timestampAccessor(a) || 0)
      );
      return present("latestN", sorted.slice(0, n), { request: { n }, fallback: "sorted_local" });
    } catch {
      return present("latestN", [], { request: { n }, error: "fetch_failed" });
    }
  }

  async function deepFetchOldest() {
    // Primary: ask the list endpoint for the oldest row
    try {
      const url = `${baseUrl}${endpoints.list}?limit=1&sortBy=receivedAt&order=asc`;
      const payload = await fetchJson(url);
      const rows = Array.isArray(payload?.rows) ? payload.rows : [];
      if (rows.length) return present("oldest", rows);
    } catch {}

    // Fallback: fetch all, sort locally by timestamp, and take the first
    try {
      const all = await fetchAll();
      const sorted = [...all].sort(
        (a, b) => (timestampAccessor(a) || Infinity) - (timestampAccessor(b) || Infinity)
      );
      const oldest = sorted.length ? [sorted[0]] : [];
      return present("oldest", oldest, { fallback: "sorted_local" });
    } catch {
      // Still return a DEEP_FETCH-shaped payload so the UI never claims “no access”
      return present("oldest", [], { error: "fetch_failed" });
    }
  }

  async function deepFetchByKey(key) {
    try {
      const url = `${baseUrl}${endpoints.byKey(key)}`;
      const payload = await fetchJson(url);
      return { kind: "DEEP_FETCH", intent: "byKey", key, item: payload, DEEP_FETCH_READY: true };
    } catch {
      return { kind: "DEEP_FETCH", intent: "byKey", key, error: "not_found", DEEP_FETCH_READY: true };
    }
  }

  async function fetchRowsForRangeStrict(range) {
    const fullBase = `${baseUrl}${endpoints.full}`;
    const sep = fullBase.includes("?") ? "&" : "?";
    const url = `${fullBase}${sep}limit=0&sinceMs=${range.sinceMs ?? ""}&untilMs=${range.untilMs ?? ""}`;
    let rows = [];
    try {
      const payload = await fetchJson(url);
      rows = Array.isArray(payload?.rows) ? payload.rows : [];
    } catch {
      rows = [];
    }
    rows = rows.filter((r) => {
      const ms = timestampAccessor(r);
      if (!Number.isFinite(ms)) return false;
      if (Number.isFinite(range.sinceMs) && ms < range.sinceMs) return false;
      if (Number.isFinite(range.untilMs) && ms > range.untilMs) return false;
      return true;
    });
    return rows;
  }

  async function deepFetchRange(range = {}) {
    const rows = await fetchRowsForRangeStrict(range);
    const sorted = [...rows].sort(
      (a, b) => (timestampAccessor(b) || 0) - (timestampAccessor(a) || 0),
    );
    return present("range", sorted, { range });
  }

  // -------------------- bucketing & time math --------------------
  const pad2 = (n) => String(n).padStart(2, "0");
  function dayKeyFromMs(ms) { const d = new Date(ms); return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth()+1)}-${pad2(d.getUTCDate())}`; }
  function quarterLabel(ms) { const d = new Date(ms); const q = Math.floor(d.getUTCMonth()/3)+1; return `${d.getUTCFullYear()}-Q${q}`; }
  function addMonths(ms, delta) { const d = new Date(ms); d.setUTCMonth(d.getUTCMonth()+delta); return d.getTime(); }
  function isoWeekStart(ms) { const d = new Date(new Date(ms).setUTCHours(0,0,0,0)); const wd = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() - (wd - 1)); return d.getTime(); }
  function isoWeekInfo(ms) {
    const start = isoWeekStart(ms);
    const thurs = start + 3 * DAY;
    const y = new Date(thurs).getUTCFullYear();
    const first = isoWeekStart(Date.UTC(y, 0, 4));
    const weekNo = Math.round((start - first) / (7 * DAY)) + 1;
    return { year: y, week: weekNo, start };
  }
  function isoWeekLabel(ms) { const { year, week } = isoWeekInfo(ms); return `${year}-W${String(week).padStart(2,"0")}`; }

  function bucketIterators(grain) {
    if (!grain) return null;
    const kind = grain.kind;
    if (kind === "year") {
      const align = (ms) => { const d = new Date(ms); d.setUTCMonth(0,1); d.setUTCHours(0,0,0,0); return d.getTime(); };
      const step  = (t) => Date.UTC(new Date(t).getUTCFullYear()+1,0,1);
      const next  = (t) => { const y = new Date(t).getUTCFullYear(); return { key: String(y), startMs: t, endMsExclusive: step(t), label: String(y) }; };
      return { align, step, next };
    }
    if (kind === "quarter") {
      const align = (ms) => { const d = new Date(ms); const q = Math.floor(d.getUTCMonth()/3)*3; d.setUTCMonth(q,1); d.setUTCHours(0,0,0,0); return d.getTime(); };
      const step  = (t) => addMonths(t, 3);
      const next  = (t) => ({ key: quarterLabel(t), startMs: t, endMsExclusive: step(t), label: quarterLabel(t) });
      return { align, step, next };
    }
    if (kind === "month") {
      const align = (ms) => { const d = new Date(ms); d.setUTCDate(1); d.setUTCHours(0,0,0,0); return d.getTime(); };
      const step  = (t) => addMonths(t, 1);
      const next  = (t) => { const d = new Date(t); const label = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth()+1)}`; return { key: label, startMs: t, endMsExclusive: step(t), label }; };
      return { align, step, next };
    }
    if (kind === "week") {
      const align = (ms) => isoWeekStart(ms);
      const step  = (t) => t + 7 * DAY;
      const next  = (t) => ({ key: isoWeekLabel(t), startMs: t, endMsExclusive: step(t), label: isoWeekLabel(t) });
      return { align, step, next };
    }
    if (kind === "day") {
      const align = (ms) => new Date(new Date(ms).setUTCHours(0,0,0,0)).getTime();
      const step  = (t) => t + DAY;
      const next  = (t) => ({ key: dayKeyFromMs(t), startMs: t, endMsExclusive: step(t), label: dayKeyFromMs(t) });
      return { align, step, next };
    }
    return null;
  }

  function computeBucketSeries(rows, sinceMs, untilMs, grain) {
    if (!grain) return null;
    const it = bucketIterators(grain);
    if (!it) return null;

    const map = new Map();
    for (const r of rows) {
      const ms = timestampAccessor(r);
      if (!Number.isFinite(ms)) continue;
      if (Number.isFinite(sinceMs) && ms < sinceMs) continue;
      if (Number.isFinite(untilMs) && ms > untilMs) continue;

      let t = it.align(ms);
      while (it.step(t) <= ms) t = it.step(t);
      while (t > ms) t = it.align(t - 1);
      const meta = it.next(t);

      const st = computeStatus(r) || "UNKNOWN";
      const cur = map.get(meta.key) || { total: 0, byStatus: {} };
      cur.total++;
      cur.byStatus[st] = (cur.byStatus[st] || 0) + 1;
      map.set(meta.key, cur);
    }

    const series = [];
    const startAligned = it.align(sinceMs);
    const endAligned   = it.align(untilMs);
    for (let tt = startAligned; tt <= endAligned; tt = it.step(tt)) {
      const meta = it.next(tt);
      const v = map.get(meta.key) || { total: 0, byStatus: {} };
      series.push([
        meta.label,
        { total: v.total || 0, registered: v.byStatus?.REGISTERED || 0, pending: v.byStatus?.PENDING || 0 },
      ]);
    }
    return series;
  }

  function present(intent, rows, extra = {}) {
    const flatRows = rows.map(flatten);
    const getYear = (r) => {
      const ms = timestampAccessor(r);
      return Number.isFinite(ms) ? new Date(ms).getUTCFullYear() : undefined;
    };

    const tally = (pick) => {
      const map = new Map();
      for (const r of flatRows) {
        const k = pick(r);
        if (!k && k !== 0) continue;
        map.set(k, (map.get(k) || 0) + 1);
      }
      return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    };

    const perYear = tally(getYear);
    const statusMix = tally((r) => computeStatus(r));

    const perYearByStatus = {};
    for (const r of flatRows) {
      const ms = timestampAccessor(r);
      if (!Number.isFinite(ms)) continue;
      const y = new Date(ms).getUTCFullYear();
      const st = computeStatus(r) || "UNKNOWN";
      if (!perYearByStatus[y]) perYearByStatus[y] = { total: 0, byStatus: {} };
      perYearByStatus[y].total++;
      perYearByStatus[y].byStatus[st] = (perYearByStatus[y].byStatus[st] || 0) + 1;
    }

    const pendingByYear = Object.entries(perYearByStatus)
      .map(([y, v]) => [Number(y), v.byStatus.PENDING || 0])
      .sort((a, b) => b[0] - a[0]);

    const pendingTotal = pendingByYear.reduce((acc, [, n]) => acc + n, 0);
    const sumPerYear = perYear.reduce((a, [, n]) => a + n, 0);
    const sumStatusMix = statusMix.reduce((a, [, n]) => a + n, 0);
    const pendingFromStatusMix = (statusMix.find(([k]) => k === "PENDING")?.[1]) || 0;

    const facetResults = {};
    for (let i = 0; i < facets.length; i++) {
      const f = facets[i];
      const name = typeof f === "function" ? `facet_${i + 1}` : String(f);
      const pick = typeof f === "function" ? f : (r) => r?.[f];
      facetResults[name] = tally(pick).slice(0, 12);
    }

    const latestSample = flatRows.slice(0, 50).map((r) => ({
      key: keyAccessor(r),
      status: computeStatus(r),
      timestampMs: timestampAccessor(r),
      receivedAt: r?.receivedAt,
      trn: r?.trn,
      product: r?.product,
      bookingLocation: r?.bookingLocation,
      workflowStage: r?.workflowStage,
    }));

    let perBucketSeries = null;
    if (extra?.bucket && Number.isFinite(extra?.range?.sinceMs) && Number.isFinite(extra?.range?.untilMs)) {
      perBucketSeries = computeBucketSeries(flatRows, extra.range.sinceMs, extra.range.untilMs, extra.bucket);
    }

    return {
      kind: "DEEP_FETCH",
      intent,
      totals: { count: flatRows.length },
      perYear,
      statusMix,
      perYearByStatus,
      pendingByYear,
      pendingTotal,
      consistency: {
        totalsCount: flatRows.length,
        sumPerYear,
        sumStatusMix,
        pendingTotal,
        pendingFromStatusMix,
        ok: flatRows.length === sumPerYear && flatRows.length === sumStatusMix && pendingTotal === pendingFromStatusMix,
      },
      perBucketSeries,
      facets: facetResults,
      latestSample,
      ...extra,
      DEEP_FETCH_READY: true,
    };
  }

  // -------------------- parsing --------------------
  const toUserText = (messages) => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m?.role === "user" && typeof m?.content === "string") return m.content;
    }
    return "";
  };

  function parseTopN(q) {
    const s = String(q || "");

    // top/latest/newest/most-recent 4,934
    let m = s.match(/\b(top|latest|newest|most\s+recent)\s+(\d{1,3}(?:[,\s]?\d{3})*|\d{1,4})\b/i);
    
    if (m) {
      const n = Number(m[2].replace(/[,\s]/g, ""));
      return { n: Math.max(1, Math.min(2000, n)) };
    }

    // 4,934 transactions|rows|records|entries|txns
    m = s.match(/\b(\d{1,3}(?:[,\s]?\d{3})*|\d{1,4})\s+(transactions?|rows|records|entries|txns?)\b/i);
    if (m) {
      const n = Number(m[1].replace(/[,\s]/g, ""));
      return { n: Math.max(1, Math.min(2000, n)) };
    }

    // latest/newest/most recent single item
    if (/\b(latest|newest|most\s+recent)\s+(transaction|row|record|entry|txn)\b/i.test(s)) {
     
      return { n: 1 };
    }
    return null;
  }

  function wantsOldestSingle(q) {
    const s = String(q || "").toLowerCase();
    // “oldest/earliest/first transaction/row/record/entry/txn”
    if (/\b(oldest|earliest|first)\s+(transaction|row|record|entry|txn)\b/i.test(s)) return true;
    // short forms like “oldest txn” or simply “oldest” (fallback to treat as oldest item)
    if (/\b(oldest|earliest|first)\b/.test(s) && /\b(txns?|transactions?|rows?|records?|entries?)\b/i.test(s)) return true;
    return false;
  }

  function parseAbsoluteDateRange(q) {
    const m = q.match(/\b(between|from)\s+(\d{4}-\d{2}-\d{2})\s+(?:and|to|-)\s+(\d{4}-\d{2}-\d{2})\b/i);
    if (m) {
      const sinceMs = Date.parse(`${m[2]}T00:00:00Z`);
      const untilMs = Date.parse(`${m[3]}T23:59:59.999Z`);
      if (Number.isFinite(sinceMs) && Number.isFinite(untilMs)) {
        return { sinceMs, untilMs, label: `${m[2]} to ${m[3]}` };
      }
    }
    const m2 = q.match(/\bon\s+(\d{4}-\d{2}-\d{2})\b/i);
    if (m2) {
      const d0 = startOfDay(Date.parse(`${m2[1]}T00:00:00Z`));
      if (Number.isFinite(d0)) {
        return { sinceMs: d0, untilMs: d0 + DAY - 1, label: `on ${m2[1]}` };
      }
    }
    return null;
  }

  function parseYearSpan(q) {
    const dash = "[-–—]";
    const m = q.match(new RegExp(`\\b(?:between\\s+)?(19|20)\\d{2}\\s*(?:${dash}|to|and)\\s*(\\d{2,4})\\b`, "i"));
    if (!m) return null;
    const first = Number(q.match(/\b(19|20)\d{2}\b/)?.[0]);
    const tail = m[2];
    let last;
    if (tail.length === 4) last = Number(tail);
    else if (tail.length === 2) last = Number(String(first).slice(0, 2) + tail);
    else return null;
    if (!Number.isFinite(first) || !Number.isFinite(last)) return null;
    const a = Math.min(first, last);
    const b = Math.max(first, last);
    const sinceMs = Date.parse(`${a}-01-01T00:00:00Z`);
    const untilMs = Date.parse(`${b}-12-31T23:59:59Z`);
    return { sinceMs, untilMs, label: `${a}-${b}` };
  }

  function parseYearOnly(q) {
    const y = q.match(/\b(?:in|for)\s+(20\d{2}|19\d{2})\b/i);
    if (!y) return null;
    const yr = Number(y[1]);
    const sinceMs = Date.parse(`${yr}-01-01T00:00:00Z`);
    const untilMs = Date.parse(`${yr}-12-31T23:59:59Z`);
    return { sinceMs, untilMs, label: `year ${yr}` };
  }

  function parseMonthNameRange(q) {
    const dash = "[-–—]";
    const month = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
    const re = new RegExp(`\\b(?:between|from)\\s+${month}\\s*(?:${dash}|to|and)\\s*${month}(?:\\s+(20\\d{2}|19\\d{2}))?\\b`, "i");
    const m = q.match(re);
    if (!m) return null;
    const yr = m[3] ? Number(m[3]) : new Date().getUTCFullYear();
    const startIdx = monthIndex(m[1]);
    const endIdx = monthIndex(m[2]);
    if (startIdx == null || endIdx == null) return null;
    const sinceMs = Date.parse(`${yr}-${pad2(startIdx + 1)}-01T00:00:00Z`);
    const lastDay = new Date(Date.UTC(yr, endIdx + 1, 0)).getUTCDate();
    const untilMs = Date.parse(`${yr}-${pad2(endIdx + 1)}-${pad2(lastDay)}T23:59:59.999Z`);
    return { sinceMs, untilMs, label: `${cap(m[1])}-${cap(m[2])} ${yr}` };
  }

  function parseMonthNameSingle(q) {
    const m = q.match(/\b(?:last|in)?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(20\d{2}|19\d{2})?\b/i);
    if (!m) return null;
    const monthIdx = monthIndex(m[1]);
    if (monthIdx == null) return null;

    const now = new Date();
    let yr = m[2] ? Number(m[2]) : now.getUTCFullYear();
    if (!m[2] && /\blast\b/i.test(m[0])) {
      const nowMonth = now.getUTCMonth();
      if (monthIdx >= nowMonth) yr = yr - 1;
    }

    const sinceMs = Date.parse(`${yr}-${pad2(monthIdx + 1)}-01T00:00:00Z`);
    const lastDay = new Date(Date.UTC(yr, monthIdx + 1, 0)).getUTCDate();
    const untilMs = Date.parse(`${yr}-${pad2(monthIdx + 1)}-${pad2(lastDay)}T23:59:59.999Z`);
    return { sinceMs, untilMs, label: `${cap(m[1])} ${yr}` };
  }

  function parseRelativeRange(q) {
    const nowMs = Date.now();
    const m = q.match(/\b(last|past)\s+(\d+)\s*(day|days|week|weeks|month|months|year|years)\b/i);
    if (m) {
      const n = Number(m[2]);
      const unit = m[3].toLowerCase();
      const span =
        unit.startsWith("day") ? DAY :
        unit.startsWith("week") ? 7 * DAY :
        unit.startsWith("month") ? 30 * DAY :
        365 * DAY;
      return { sinceMs: nowMs - n * span, untilMs: nowMs, label: `last ${n} ${unit}` };
    }
    const m2 = q.match(/\b(previous|last)\s+(week|month|year)\b/i);
    if (m2) {
      const unit = m2[2].toLowerCase();
      const span = unit === "week" ? 7 * DAY : unit === "month" ? 30 * DAY : 365 * DAY;
      return { sinceMs: nowMs - span, untilMs: nowMs, label: `last ${unit}` };
    }
    if (/\b(last\s+2\s+weeks|last\s+two\s+weeks|fortnight)\b/i.test(q)) {
      return { sinceMs: nowMs - 14 * DAY, untilMs: nowMs, label: "last 2 weeks" };
    }
    return null;
  }

  function monthIndex(name) {
    const n = name.toLowerCase();
    const map = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    };
    const keys = Object.keys(map);
    for (const k of keys) if (k.startsWith(n.slice(0, 3))) return map[k];
    return null;
  }
  const cap = (s) => s[0].toUpperCase() + s.slice(1).toLowerCase();

  function previousScopeFromHistory(messages) {
    if (!Array.isArray(messages)) return null;

    // Only look at the user's last few messages to avoid picking numbers from assistant text
    let seenUser = 0;
    for (let i = messages.length - 1; i >= 0 && seenUser < 8; i--) {
      const m = messages[i];
      if (m?.role !== "user") continue; // <-- IMPORTANT: ignore assistant/system
      seenUser++;

      const text = typeof m?.content === "string" ? m.content : "";
      if (!text) continue;

      const abs       = parseAbsoluteDateRange(text);
      const span      = parseYearSpan(text);
      const yearOnly  = parseYearOnly(text);
      const monRange  = parseMonthNameRange(text);
      const monSingle = parseMonthNameSingle(text);
      const rel       = parseRelativeRange(text);
      const picked    = abs || span || yearOnly || monRange || monSingle || rel;
      if (picked) return { range: picked, label: picked.label };

      const top = parseTopN(text);
      if (top) return { topN: top };
    }
    return null;
  }

  // -------- attachments (CSV/XLSX) parsing helpers --------
  function b64ToBuffer(b64) { try { return Buffer.from(String(b64 || ""), "base64"); } catch { return null; } }
  function isCsvName(name = "") { return /\.csv$/i.test(String(name)); }
  function isXlsxName(name = "") { return /\.xlsx$/i.test(String(name)); }
  function isCsvMime(m = "") { return /(^text\/csv|\bcsv\b)/i.test(String(m)); }
  function isXlsxMime(m = "") { return /(sheet|excel|spreadsheetml)/i.test(String(m)); }

  async function rowsFromCSVBuffer(buf) {
    const text = buf.toString("utf8");
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];
    const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, ""));
    const out = [];
    for (let i = 1; i < lines.length; i++) {
      const row = [];
      const s = lines[i];
      let cur = "", inQ = false;
      for (let j = 0; j < s.length; j++) {
        const ch = s[j];
        if (ch === '"') {
          if (inQ && s[j + 1] === '"') { cur += '"'; j++; }
          else inQ = !inQ;
        } else if (ch === "," && !inQ) {
          row.push(cur); cur = "";
        } else {
          cur += ch;
        }
      }
      row.push(cur);
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = row[idx] ?? ""; });
      out.push(obj);
    }
    return out;
  }

  async function rowsFromXLSXBuffer(buf) {
    try {
      const mod = await import("exceljs");
      const ExcelJS = mod?.default ?? mod;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buf);
      const ws = wb.worksheets[0];
      if (!ws) return [];
      const rows = [];
      const headers = [];
      ws.getRow(1).eachCell((cell, col) => { headers[col - 1] = String(cell.value ?? "").trim(); });
      ws.eachRow((row, rowNum) => {
        if (rowNum === 1) return;
        const obj = {};
        headers.forEach((h, idx) => {
          const cell = row.getCell(idx + 1);
          let v = cell?.value;
          if (v && typeof v === "object" && "text" in v) v = v.text;
          obj[h] = v == null ? "" : v;
        });
        rows.push(obj);
      });
      return rows;
    } catch {
      return [];
    }
  }

  async function parseFirstTabularAttachment(attachments = []) {
    if (!Array.isArray(attachments) || attachments.length === 0) return null;
    const cand = attachments.find(a => isCsvName(a?.name) || isXlsxName(a?.name) || isCsvMime(a?.mime) || isXlsxMime(a?.mime));
    if (!cand?.bytesB64) return null;
    const buf = b64ToBuffer(cand.bytesB64);
    if (!buf || !buf.length) return null;

    if (isCsvName(cand.name) || isCsvMime(cand.mime)) {
      const rows = await rowsFromCSVBuffer(buf);
      return { kind: "csv", name: cand.name || "upload.csv", rows };
    }
    if (isXlsxName(cand.name) || isXlsxMime(cand.mime)) {
      const rows = await rowsFromXLSXBuffer(buf);
      return { kind: "xlsx", name: cand.name || "upload.xlsx", rows };
    }
    return null;
  }

  // ---- Canonicalization helpers for compare ----
  function canonicalKeyName(name) {
    const raw = String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
    const ALIAS = {
      "trn": "trn", "trnnumber": "trn", "transactionnumber": "trn", "trnno": "trn", "trnnum": "trn", "trn#": "trn",
      "id": "id",
      "arn": "arn", "arnnumber": "arn", "arn#": "arn",
      "workflowstage": "stage", "stage": "stage",
      "product": "product",
      "bookinglocation": "bookinglocation",
      "customerreference": "customerref", "customerref": "customerref",
      "submissionmode": "submissionmode",
      "regdate": "regdate", "reldate": "reldate",
      "segment": "segment", "subsegment": "subsegment",
      "splitid": "splitid",
      "lockedby": "lockedby",
      "lli": "lli", "aml": "aml", "snc": "snc", "clbk": "clbk", "cocoa": "cocoa",
      "tdopsapproval": "tdopsapproval",
      "customer": "customer",
      "counterparty": "counterparty",
      "step": "step", "substep": "substep",
      "receivedat": "receivedat", "__receivedatms": "__receivedatms",
    };
    return ALIAS[raw] || raw;
  }

  function valueNorm(v) {
    if (v == null) return "";
    if (typeof v === "object") return "";
    let s = String(v).trim();
    if (/^(null|undefined|n\/a|na|nan)$/i.test(s)) s = "";
    return s;
  }

  const TRACK_EMPTY = new Set([
    "arn","trn","id",
    "customer","counterparty","product",
    "step","substep","lockedby","stage",
    "lli","aml","snc","clbk","cocoa",
    "tdopsapproval","customerref","submissionmode",
    "regdate","reldate","segment","subsegment","splitid",
    "bookinglocation","receivedat","__receivedatms"
  ]);

  function canonicalizeRowForDiff(row) {
    const flat = row && row.base ? { ...row.base, ...row.derived } : (row || {});
    const out = {};
    for (const [k, v] of Object.entries(flat)) {
      const key = canonicalKeyName(k);
      const val = valueNorm(v);
      if (!key) continue;
      if (val === "" && !TRACK_EMPTY.has(key)) continue;
      out[key] = val;
    }
    return out;
  }

  function canonicalizeUploadRowForDiff(row) {
    const canon = {};
    const headerByCanon = {};
    for (const [k, v] of Object.entries(row || {})) {
      const key = canonicalKeyName(k);
      const val = valueNorm(v);
      if (!key) continue;
      if (val === "" && !(key === "trn" || key === "id")) continue;
      if (!(key in canon) || canon[key] === "") {
        canon[key] = val;
        headerByCanon[key] = String(k).trim();
      }
    }
    return { canon, headerByCanon };
  }

  function computeCanonKeyForRow(row) {
    const c = canonicalizeRowForDiff(row);
    return c.trn || c.id || "";
  }

  // -------------------- public surface --------------------
  return {
    async buildMemory() {
      const ds = memory?.datasetName ?? "Dataset";
      const singular = memory?.itemSingular ?? "item";
      const plural = memory?.itemPlural ?? "items";
      const synonyms = memory?.synonyms ?? [];

      const hotset = await fetchHotset(HOTSET_LIMIT);

      const nowMs = Date.now();
      const todayStart = startOfDay(nowMs);
      const last7Start = nowMs - 7 * DAY;
      const last30Start = nowMs - 30 * DAY;
      let today = 0, last7 = 0, last30 = 0;
      for (const r of hotset) {
        const ms = timestampAccessor(r);
        if (!Number.isFinite(ms)) continue;
        if (ms >= last30Start) last30++;
        if (ms >= last7Start) last7++;
        if (ms >= todayStart) today++;
      }

      const payload = {
        terminology: { datasetName: ds, singular, plural, synonyms },
        snapshot: { last30, last7, today },
        hotset: hotset.slice(0, HOTSET_LIMIT).map((r) => ({
          key: keyAccessor(r),
          receivedAt: r?.receivedAt ?? r?.base?.receivedAt,
          timestampMs: timestampAccessor(r),
          status: computeStatus(r),
          trn: r?.trn ?? r?.base?.trn,
          product: r?.product ?? r?.base?.product,
          bookingLocation: r?.bookingLocation ?? r?.base?.bookingLocation,
          workflowStage: r?.workflowStage ?? r?.base?.workflowStage,
        })),
        notes: { latestDefinition: "Latest = max timestampMs (most recent receivedAt)", hotsetLimit: HOTSET_LIMIT },
        kb: kb ? { available: true, title: kb.title || kb.brand || "Knowledge Base" } : undefined,
      };

      return {
        role: "system",
        content:
          `You are the ${ds} Assistant. Treat each ${singular} synonymously with ${[plural, ...synonyms].join(", ")}.\n` +
          `Use MEMORY_JSON for context. For counts/ranges/top-N the server will provide DEEP_FETCH_JSON.\n\n` +
          `MEMORY_JSON:\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``,
      };
    },

    async augment({ text, messages, context }) {
      const qRaw = (text || toUserText(messages) || "").trim();
      const q = qRaw.toLowerCase();
      const systems = [];

      // per-chat key
      const sidKey = makeSidKey(context, messages);
      const pref = __uiPrefs.get(sidKey) || {};
      const state = getState(sidKey);

      function minMaxMs(rows) {
        let min = Infinity, max = -Infinity;
        for (const r of rows) {
          const t = timestampAccessor(r);
          if (!Number.isFinite(t)) continue;
          if (t < min) min = t;
          if (t > max) max = t;
        }
        return {
          sinceMs: Number.isFinite(min) ? min : undefined,
          untilMs: Number.isFinite(max) ? max : undefined,
        };
      }

      function tableToCSVBuffer(columns, dataRows) {
        const esc = (v) => {
          if (v == null) return "";
          const s = String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const lines = [columns.join(",")];
        for (const row of dataRows) lines.push(row.map(esc).join(","));
        return Buffer.from(lines.join("\n"), "utf8");
      }

      // 0) Soft rubric
      systems.push(
        scopeRubricSystem({
          datasetName: memory?.datasetName ?? "Workdesk",
          itemPlural: memory?.itemPlural ?? "items",
          brandTokens: (brandNames || []),
        })
      );

      let forceTableThisTurn = false;

      // 1) “Use table …” directive
      const fmt = formatDirectiveIntent(qRaw);
      if (fmt?.kind === "table") {
        if (fmt.always) {
          __uiPrefs.set(sidKey, { ...(pref || {}), alwaysTable: true });
          systems.push({ role: "system", content: "Acknowledge in one short line that you will use tables by default for this session." });
        } else {
          forceTableThisTurn = true;
          systems.push({ role: "system", content: "Acknowledge briefly and use a table for THIS reply only." });
        }
      }
      const useTable = !!(pref.alwaysTable || forceTableThisTurn || (wantsTableNow(qRaw)));

      // 2) Export (CSV/XLSX)
      const exp = exportIntent(qRaw);
      if (exp) {
        const grain = parseGranularity(qRaw);
        const abs = parseAbsoluteDateRange(qRaw);
        const span = parseYearSpan(qRaw);
        const yearOnly = parseYearOnly(qRaw);
        const monRange = parseMonthNameRange(qRaw);
        const monSingle = parseMonthNameSingle(qRaw);
        const rel = parseRelativeRange(qRaw);
        const topInline = parseTopN(qRaw.toLowerCase());

        const explicitAll = /\b(all|entire|full|everything)\b/i.test(qRaw);
        const exportUploaded = /\b(uploaded file|last upload|the upload|previous upload)\b/i.test(qRaw);

        // 2A) “export it” → lastAggregation (this chat only)
        const lastAggFromState = state?.lastAggregation || getAggregation(sidKey);
        if (!explicitAll && !exportUploaded && !abs && !span && !yearOnly && !monRange && !monSingle && !rel && !topInline && lastAggFromState && Array.isArray(lastAggFromState.columns) && Array.isArray(lastAggFromState.rows)) {
          const ts = new Date().toISOString().replace(/[:.]/g, "");
          const inferred =
            lastAggFromState?.meta?.name ||
            (lastAggFromState.columns[0]?.toLowerCase() === "year" ? "grouped-by-year" : "aggregation");
          const baseName = (memory?.datasetName || "workdesk").toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const filename = `${baseName}-${inferred}-${ts}.${exp.kind === "xlsx" ? "xlsx" : "csv"}`;

          const buf = exp.kind === "xlsx"
            ? await (async () => {
                try {
                  const mod = await import("exceljs");
                  const ExcelJS = mod?.default ?? mod;
                  const wb = new ExcelJS.Workbook();
                  const ws = wb.addWorksheet("aggregation");
                  ws.addRow(lastAggFromState.columns);
                  for (const row of lastAggFromState.rows) ws.addRow(row);
                  const out = await wb.xlsx.writeBuffer();
                  return Buffer.from(out);
                } catch {
                  return tableToCSVBuffer(lastAggFromState.columns, lastAggFromState.rows);
                }
              })()
            : tableToCSVBuffer(lastAggFromState.columns, lastAggFromState.rows);

          const mime = exp.kind === "xlsx"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "text/csv;charset=utf-8";

          let link = null;
          if (typeof makeDownloadLink === "function") {
            try { link = await makeDownloadLink(buf, filename, mime, 10 * 60 * 1000); } catch {}
          }
          const dataUrl = !link ? toDataUrl(mime, buf, 2_000_000) : null;

          if (link || dataUrl) {
            const href = link || dataUrl;
            systems.push({
              role: "system",
              content: `Output exactly ONE line of Markdown:\n\n📎 Download: [${filename}](${href})\n\nNo extra commentary, no code fences, and do NOT echo the URL anywhere else.`,
            });
          } else {
            systems.push({
              role: "system",
              content: "File too large to inline. Ask the user to narrow the export; give exactly 3 concrete examples.",
            });
          }
          return systems;
        }

        // 2B) Export the uploaded file itself if asked
        if (exportUploaded && state?.lastUpload?.rows?.length) {
          const lastUpload = state.lastUpload;
          const headersOrder = (lastUpload.headersOriginal || []).length
            ? lastUpload.headersOriginal
            : collectHeaders(lastUpload.rows.map(flatten));
          const ts = new Date().toISOString().replace(/[:.]/g, "");
          const filenameBase = (lastUpload.name || "upload").replace(/\.(csv|xlsx)$/i, "");
          const filename = `uploaded-${slug(filenameBase)}-${ts}.${exp.kind === "xlsx" ? "xlsx" : "csv"}`;
          const mime = exp.kind === "xlsx"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "text/csv;charset=utf-8";
          const flat = lastUpload.rows.map(flatten);
          const buf = exp.kind === "xlsx" ? await toXLSXBuffer(flat, headersOrder) : toCSVBuffer(flat, headersOrder);

          let link = null;
          if (typeof makeDownloadLink === "function") {
            try { link = await makeDownloadLink(buf, filename, mime, 10 * 60 * 1000); } catch {}
          }
          const dataUrl = !link ? toDataUrl(mime, buf, 2_000_000) : null;

          if (link || dataUrl) {
            const href = link || dataUrl;
            systems.push({
              role: "system",
              content: `Output exactly ONE line of Markdown:\n\n📎 Download: [${filename}](${href})\n\nNo extra commentary, no code fences, and do NOT echo the URL anywhere else.`,
            });
          } else {
            systems.push({
              role: "system",
              content: "File too large to inline. Ask the user to narrow; give exactly 3 examples.",
            });
          }
          return systems;
        }

        // Parse range/topN for other explicit exports
        let picked = abs || span || yearOnly || monRange || monSingle || rel;

        // 2C) “export all …”
        if (explicitAll && !picked && !topInline) {
          let rows = await fetchAll();
          if (!rows?.length) {
            systems.push({ role: "system", content: "No rows found. Say one brief line and offer 3 ways to adjust scope." });
            return systems;
          }

          const templateCanon = state?.lastUpload?.headersCanon;
          const headers = templateCanon?.length
            ? collectHeadersWithTemplate(rows.map(flatten), templateCanon)
            : collectHeaders(rows.map(flatten));

          const ts = new Date().toISOString().replace(/[:.]/g, "");
          const baseName = (memory?.datasetName || "workdesk").toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const filename = `${baseName}-all-${ts}.${exp.kind === "xlsx" ? "xlsx" : "csv"}`;
          const mime = exp.kind === "xlsx"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "text/csv;charset=utf-8";

          const HARD = 250_000;
          if (rows.length > HARD) rows = rows.slice(0, HARD);

          const flat = rows.map(flatten);
          const buf = exp.kind === "xlsx" ? await toXLSXBuffer(flat, headers) : toCSVBuffer(flat, headers);

          let link = null;
          if (typeof makeDownloadLink === "function") {
            try { link = await makeDownloadLink(buf, filename, mime, 10 * 60 * 1000); } catch {}
          }
          const dataUrl = !link ? toDataUrl(mime, buf, 2_000_000) : null;

          if (link || dataUrl) {
            const href = link || dataUrl;
            systems.push({
              role: "system",
              content: `Output exactly ONE line of Markdown:\n\n📎 Download: [${filename}](${href})\n\nNo extra commentary, no code fences, and do NOT echo the URL anywhere else.`,
            });
          } else {
            systems.push({
              role: "system",
              content: "File too large to inline. Ask the user to narrow the export; give exactly 3 concrete examples.",
            });
          }
          return systems;
        }

        // 2D) Otherwise, fall back to your existing scoped export logic
        let rows, selectionLabel = null;

        if (picked) {
          rows = await fetchRowsForRangeStrict(picked);
          selectionLabel = picked.label;
          setState(sidKey, { lastRange: picked, lastTopN: null, lastGrain: grain || null });
        } else if (topInline) {
          const url = `${baseUrl}${endpoints.list}?limit=${topInline.n}&sortBy=receivedAt&order=desc`;
          rows = (await fetchJson(url))?.rows ?? [];
          selectionLabel = `latest-${topInline.n}`;
          setState(sidKey, { lastTopN: topInline, lastRange: null, lastGrain: null });
        } else if (state.lastRange) {
          rows = await fetchRowsForRangeStrict(state.lastRange);
          selectionLabel = state.lastRange.label || "range";
        } else {
          const prev = previousScopeFromHistory(messages);
          if (prev?.range) {
            rows = await fetchRowsForRangeStrict(prev.range);
            selectionLabel = prev.range.label || "range";
            setState(sidKey, { lastRange: prev.range, lastTopN: null, lastGrain: null });
          } else if (prev?.topN) {
            const url = `${baseUrl}${endpoints.list}?limit=${prev.topN.n}&sortBy=receivedAt&order=desc`;
            rows = (await fetchJson(url))?.rows ?? [];
            selectionLabel = `latest-${prev.topN.n}`;
            setState(sidKey, { lastTopN: prev.topN, lastRange: null, lastGrain: null });
          } else {
            rows = await fetchAll();
            selectionLabel = "all";
          }
        }

        if (!rows || rows.length === 0) {
          systems.push({
            role: "system",
            content: "Export failed (empty data). Say one brief line explaining there were no rows for that scope, then offer 3 ways to narrow/adjust.",
          });
          return systems;
        }

        const HARD = 250_000;
        if (rows.length > HARD) rows = rows.slice(0, HARD);

        function safeSlug(s) {
          return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
        }

        const ts = new Date().toISOString().replace(/[:.]/g, "");
        const baseName = memory?.datasetName ? safeSlug(memory.datasetName) : "dataset";
        const scopePart = selectionLabel ? `-${safeSlug(selectionLabel)}` : "";
        let filename, mime, buf;

        if (exp.kind === "xlsx") {
          filename = `${baseName}${scopePart}-${ts}.xlsx`;
          mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
          try {
            const mod = await import("exceljs");
            const ExcelJS = mod?.default ?? mod;
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet("data");
            const headers = collectHeaders(rows.map(flattenRowForExport));
            ws.addRow(headers);
            for (const r of rows) ws.addRow(headers.map(h => flattenRowForExport(r)[h]));
            const out = await wb.xlsx.writeBuffer();
            buf = Buffer.from(out);
          } catch {
            buf = toCSVBuffer(rows);
            mime = "text/csv;charset=utf-8";
            filename = `${baseName}${scopePart}-${ts}.csv`;
          }
        } else {
          filename = `${baseName}${scopePart}-${ts}.csv`;
          mime = "text/csv;charset=utf-8";
          buf = toCSVBuffer(rows);
        }

        let link = null;
        if (typeof makeDownloadLink === "function") {
          try { link = await makeDownloadLink(buf, filename, mime, 10 * 60 * 1000); } catch {}
        }
        const dataUrl = !link ? toDataUrl(mime, buf, 2_000_000) : null;

        if (link || dataUrl) {
          const href = link || dataUrl;
          systems.push({ role: "system", content: `Output exactly ONE line of Markdown:\n\n📎 Download: [${filename}](${href})\n\nNo extra commentary, no code fences, and do NOT echo the URL anywhere else.` });
        } else {
          systems.push({ role: "system", content: "Say one short line asking the user to narrow the range (too large to embed). Give exactly 3 concrete examples." });
        }
        return systems;
      }

      // 2.5) Compare intent + attachment-driven diff (persist upload)
      if (compareIntent(qRaw)) {
        const upload = await parseFirstTabularAttachment(context?.attachments || []);
        if (!upload || !Array.isArray(upload.rows) || upload.rows.length === 0) {
          systems.push({
            role: "system",
            content:
              "Please attach a CSV/XLSX to compare.\n- compare this to last month\n- diff this file vs 2024\n- show what’s new by TRN",
          });
          return systems;
        }

        // Persist upload for this chat
        const headersOriginal = Array.isArray(upload.rows) && upload.rows[0]
          ? Object.keys(upload.rows[0])
          : [];
        const headersCanon = headersOriginal.map(canonicalKeyName);
        setState(sidKey, {
          ...getState(sidKey),
          lastUpload: { name: upload.name, kind: upload.kind, rows: upload.rows, headersOriginal, headersCanon },
        });

        // Range override if user typed a scope; else ALL
        const explicitRange =
          parseAbsoluteDateRange(qRaw) ||
          parseYearSpan(qRaw) ||
          parseYearOnly(qRaw) ||
          parseMonthNameRange(qRaw) ||
          parseMonthNameSingle(qRaw) ||
          parseRelativeRange(qRaw);

        let baseRows = [];
        if (explicitRange?.sinceMs && explicitRange?.untilMs) {
          baseRows = await fetchRowsForRangeStrict(explicitRange);
          setState(sidKey, { lastRange: explicitRange, lastTopN: null });
        } else {
          try { baseRows = await fetchAll(); } catch { baseRows = []; }
        }

        const baseCanonMap = new Map();
        for (const r of baseRows) {
          const k = computeCanonKeyForRow(r);
          if (!k) continue;
          baseCanonMap.set(String(k), canonicalizeRowForDiff(r));
        }

        const upCanonMap = new Map();
        const upHeaderByCanon = new Map();
        for (const r of upload.rows) {
          const { canon, headerByCanon } = canonicalizeUploadRowForDiff(r);
          const k = canon.trn || canon.id || "";
          if (!k) continue;
          upCanonMap.set(String(k), canon);
          upHeaderByCanon.set(String(k), headerByCanon);
        }

        const newKeys = [];
        const removedKeys = [];
        const commonKeys = [];
        for (const k of upCanonMap.keys()) (baseCanonMap.has(k) ? commonKeys : newKeys).push(k);
        for (const k of baseCanonMap.keys()) if (!upCanonMap.has(k)) removedKeys.push(k);

        const byKeyUpdates = new Map();
        for (const k of commonKeys) {
          const base = baseCanonMap.get(k) || {};
          const up   = upCanonMap.get(k)   || {};
          const hdrs = upHeaderByCanon.get(k) || {};
          const a = new Set(Object.keys(base).filter(f => f !== "trn" && f !== "id"));
          const b = new Set(Object.keys(up).filter(f => f !== "trn" && f !== "id"));
          const changes = [];
          let newColCount = 0;

          for (const f of a) {
            if (!b.has(f)) continue;
            const before = valueNorm(base[f]);
            const after  = valueNorm(up[f]);
            if (before === after) continue;

            const label = hdrs[f] || (
              f === "customerref"    ? "CUSTOMER REFERENCE" :
              f === "submissionmode" ? "SUBMISSION MODE"   :
              f === "bookinglocation"? "BOOKING LOCATION"  :
              f === "regdate"        ? "REG. DATE"         :
              f === "reldate"        ? "REL. DATE"         :
              f === "stage"          ? "STAGE"             :
              f.toUpperCase()
            );
            changes.push({ label, before, after });
          }

          for (const f of b) {
            if (a.has(f)) continue;
            const after = valueNorm(up[f]);
            if (after === "") continue;
            newColCount++;
          }

          if (changes.length || newColCount) byKeyUpdates.set(k, { changes, newColCount });
        }

        function plural(n, s, p = s + "s") { return n === 1 ? s : p; }

        const filename = upload.name || (upload.kind === "csv" ? "upload.csv" : "upload.xlsx");
        const headerLines = [
          `Uploaded rows: ${upload.rows.length}`,
          `Baseline rows: ${baseRows.length} (our current data)`,
        ].join("\n");

        const MAX_UPDATED_KEYS = 5;
        const updatedKeys = Array.from(byKeyUpdates.keys());
        const showUpdatedKeys = updatedKeys.slice(0, MAX_UPDATED_KEYS);
        const leftUpdatedKeys = Math.max(0, updatedKeys.length - showUpdatedKeys.length);

        const updatedSection = showUpdatedKeys.length
          ? [
              `**Updated**`,
              ...showUpdatedKeys.map(k => {
                const entry = byKeyUpdates.get(k) || { changes: [], newColCount: 0 };
                const lines = [`- 🟨 **${k}**`];
                entry.changes.forEach(it => lines.push(`  - ${chip(it.label)}: ${oldVal(showVal(it.before))} ${arrow()} ${newVal(showVal(it.after))}`));
                if (entry.newColCount > 0) lines.push(`  - + ${entry.newColCount} newly populated field(s)`);
                return lines.join("\n");
              }),
              leftUpdatedKeys ? `…**${leftUpdatedKeys}** more transaction(s) with updates` : ``,
            ].filter(Boolean).join("\n")
          : ``;

        const MAX_NEWS = 10;
        const newSection = newKeys.length
          ? [
              `**New**`,
              ...newKeys.slice(0, MAX_NEWS).map(k => `- 🟩 **${k}**`),
              Math.max(0, newKeys.length - MAX_NEWS) ? `…${Math.max(0, newKeys.length - MAX_NEWS)} more` : ``,
            ].join("\n")
          : ``;

        const MAX_DELETED = 10;
        const deletedSection = removedKeys.length
          ? [
              `**Deleted**`,
              ...removedKeys.slice(0, MAX_DELETED).map(k => `- 🟥 **${k}**`),
              Math.max(0, removedKeys.length - MAX_DELETED) ? `…${Math.max(0, removedKeys.length - MAX_DELETED)} more` : ``,
            ].join("\n")
          : ``;

        const totalUpdatedTrns    = updatedKeys.length;
        const totalNewTrns        = newKeys.length;
        const totalDeletedTrns    = removedKeys.length;
        const totalFieldChanges   = updatedKeys.reduce((acc, k) => acc + ((byKeyUpdates.get(k)?.changes || []).length), 0);
        const totalNewlyPopulated = updatedKeys.reduce((acc, k) => acc + (byKeyUpdates.get(k)?.newColCount || 0), 0);

        const fieldCounts = new Map();
        for (const k of updatedKeys) {
          for (const ch of (byKeyUpdates.get(k)?.changes || [])) {
            const cur = fieldCounts.get(ch.label) || 0;
            fieldCounts.set(ch.label, cur + 1);
          }
        }
        const topFields = Array.from(fieldCounts.entries())
          .sort((a,b) => b[1]-a[1])
          .slice(0, 3)
          .map(([label, n]) => `${label} (${n})`)
          .join(", ");

        const quickBits = [];
        quickBits.push(`${totalUpdatedTrns} ${plural(totalUpdatedTrns, "updated TRN")}`);
        if (totalFieldChanges) quickBits.push(`${totalFieldChanges} ${plural(totalFieldChanges, "field change")}`);
        if (totalNewlyPopulated) quickBits.push(`${totalNewlyPopulated} newly populated ${plural(totalNewlyPopulated, "field")}`);
        if (totalNewTrns) quickBits.push(`${totalNewTrns} ${plural(totalNewTrns, "new TRN")}`);
        if (totalDeletedTrns) quickBits.push(`${totalDeletedTrns} ${plural(totalDeletedTrns, "deleted TRN")}`);
        const quickTake = `**Quick take:** ${quickBits.join(" • ")}.`;

        if (!showUpdatedKeys.length && newKeys.length === 0 && removedKeys.length === 0) {
          const finalMd = `**Comparison — ${filename}**\n${headerLines}\n\nNo differences detected for matching TRNs.`;
          systems.push({ role: "system", content: `Output exactly the following Markdown and nothing else:\n\n${finalMd}` });
          return systems;
        }

        const aggRows = [];
        for (const k of updatedKeys) {
          const entry = byKeyUpdates.get(k) || { changes: [], newColCount: 0 };
          entry.changes.forEach(it => {
            aggRows.push(["UPDATED", k, it.label, String(it.before ?? ""), String(it.after ?? "")]);
          });
          if (entry.newColCount > 0) {
            aggRows.push(["NEW_COLUMNS_SUMMARY", k, "Count", "", String(entry.newColCount)]);
          }
        }
        for (const k of newKeys)     aggRows.push(["NEW", k, "", "", ""]);
        for (const k of removedKeys) aggRows.push(["DELETED", k, "", "", ""]);
        setState(sidKey, { lastAggregation: { columns: ["ChangeType","TRN","Field","Before (baseline)","After (upload)"], rows: aggRows } });
        setAggregation(sidKey,   { columns: ["ChangeType","TRN","Field","Before (baseline)","After (upload)"], rows: aggRows });

        const parts = [
          `**Comparison — ${filename}**`,
          headerLines,
          updatedSection,
          newSection,
          deletedSection,
          quickTake,
        ].filter(Boolean);

        const finalMd = parts.join("\n\n");
        systems.push({ role: "system", content: `Output exactly the following Markdown and nothing else:\n\n${finalMd}` });
        return systems;
      }

      // 3) Generic/help
      if (isGenericAssistantQuery(qRaw)) {
        systems.push({
          role: "system",
          content:
            useTable
              ? "User asked scope/capabilities. Be friendly and concise, then present 4–6 example prompts as a small Markdown table with columns: Example | What you’ll get."
              : "User asked scope/capabilities. Be friendly and concise, then list 4–6 example prompts as bullet points (no table)."
        });
        return systems;
      }

      // 4) Service-like asks
      const svc = serviceIntent(qRaw);
      if (svc) {
        systems.push({
          role: "system",
          content:
            useTable
              ? `You do NOT have live access to ${svc.kind} here. Say that in one sentence, then present 3–5 in-scope ideas in a Markdown table (“Try this” | “Purpose”).`
              : `You do NOT have live access to ${svc.kind} here. Say that in one sentence, then present 3–5 in-scope ideas as bullet points (no table).`
        });
        return systems;
      }

      // 5) Brand/KB
      if (kb && brandIntent(qRaw, messages)) {
        const brand = kb.brand || "this product";
        systems.push({
          role: "system",
          content:
            `Answer using KB_JSON only. Be concise and factual. If a field is missing, say you don't know.\n\n` +
            `Mapping hints:\n` +
            `- If the user asks “who is behind ${brand}”, “who developed/built ${brand}”, or similar: ` +
            `  mention ownership.productOwnerTeam, ownership.engineeringTeam, and ownership.maintainerGroup. If present, include contact.website.\n` +
            `- If the user asks “who should I ask”, “who to contact”, “PoC/support”, etc.: ` +
            `  list contact.general and contact.security (with labels), then 2–6 key people (role • name — email).\n` +
            `- If the user asks “who works in/at ${brand}”: list people[] as role • name — email (short list; group by role if needed).\n` +
            `- If ambiguous: give a 1–2 line overview (ownership teams) + a “Contacts” line (general/security) + 3–5 named people.\n` +
            `- Do NOT invent names or emails beyond KB_JSON.\n\n` +
            `KB_JSON:\n\`\`\`json\n${JSON.stringify(kb)}\n\`\`\``,
        });
        return systems;
      }

      // 6) TRN-like key
      const keyMatch = qRaw.match(/\b(SPBTR\d{2}RFC\d{6})\b/i);
      if (keyMatch) {
        const deep = await deepFetchByKey(keyMatch[1]);
        systems.push({
          role: "system",
          content:
            `You have details for key ${keyMatch[1]}. Answer from DEEP_FETCH_JSON. NEVER claim missing access while DEEP_FETCH_JSON is present.\n\n` +
            `DEEP_FETCH_JSON:\n\`\`\`json\n${JSON.stringify(deep)}\n\`\`\``,
        });
        return systems;
      }

      // 7) Range / grain
      const grain = parseGranularity(qRaw);
      const abs = parseAbsoluteDateRange(q);
      const span = parseYearSpan(q);
      const yearOnly = parseYearOnly(q);
      const monRange = parseMonthNameRange(q);
      const monSingle = parseMonthNameSingle(q);
      const rel = parseRelativeRange(q);

      let picked = abs || span || yearOnly || monRange || monSingle || rel;

      // Special: “per year” with no range → aggregate ALL years
      if (!picked && grain && grain.kind === "year") {
        const allRows = await fetchAll();

        const deepAll = present("all", allRows, { bucket: { kind: "year" } });
        const { sinceMs, untilMs } = minMaxMs(allRows);
        const series = computeBucketSeries(allRows, sinceMs, untilMs, { kind: "year" }) || [];

        const aggRows = series.map(([label, v]) => [label, v.total]);
        setState(sidKey, {
          lastAggregation: { columns: ["Year", "Total"], rows: aggRows, meta: { name: "grouped-by-year" } },
          lastRange: null,
          lastTopN: null,
          lastGrain: { kind: "year" },
        });
        setAggregation(sidKey, { columns: ["Year", "Total"], rows: aggRows, meta: { name: "grouped-by-year" } });

        const renderInstr = useTable
          ? "Render a compact Markdown table with headers: Year | Total."
          : "List one line per year like: \"YEAR — Total: X\" (no table).";

        systems.push({
          role: "system",
          content:
            `You have ALL available years. Use DEEP_FETCH_JSON for totals and year buckets. ` +
            `NEVER say you lack access while DEEP_FETCH_JSON is present. ${renderInstr}\n\n` +
            `DEEP_FETCH_JSON:\n\`\`\`json\n${JSON.stringify({ ...deepAll, perBucketSeries: series })}\n\`\`\``,
        });
        return systems;
      }

      if (picked || grain) {
        if (!picked && grain) picked = defaultRangeForGrain(grain);

        setState(sidKey, { lastRange: picked || null, lastGrain: grain || null, lastTopN: null });

        const deep = await deepFetchRange(picked);

        let deepWithBucket = deep;
        if (grain) {
          const rowsForRange = await fetchRowsForRangeStrict(picked);
          const series = computeBucketSeries(rowsForRange, picked.sinceMs, picked.untilMs, grain) || [];
          const sumBuckets = series.reduce((acc, [, v]) => acc + (v?.total || 0), 0);

          deepWithBucket = {
            ...deep,
            perBucketSeries: series,
            consistency: {
              ...(deep.consistency || {}),
              sumBuckets,
              bucketsMatchTotal: sumBuckets === deep.totals.count,
            },
          };

          const bucketHeader =
            grain.kind === "year" ? "Year" :
            grain.kind === "quarter" ? "Quarter" :
            grain.kind === "month" ? "Month" :
            grain.kind === "week" ? "Week" : "Bucket";

          const cols = [bucketHeader, "Total", "Registered", "Pending"];
          const rowsAgg = series.map(([label, v]) => [label, v.total, v.registered, v.pending]);

          setState(sidKey, { lastAggregation: { columns: cols, rows: rowsAgg } });
          setAggregation(sidKey, { columns: cols, rows: rowsAgg });
        }

        const bucketHeader =
          !grain ? "Bucket"
          : grain.kind === "year" ? "Year"
          : grain.kind === "quarter" ? "Quarter"
          : grain.kind === "month" ? "Month"
          : grain.kind === "week" ? "Week" : "Bucket";

        const seriesInstr = useTable
          ? `If perBucketSeries is present, render a compact table: ${bucketHeader} | Total | Registered | Pending.`
          : `If perBucketSeries is present, list one line per bucket like: "${bucketHeader} — Total: X (Registered: Y, Pending: Z)". No table unless asked.`;

        systems.push({
          role: "system",
          content:
            `You have exact data for ${picked.label}. Use DEEP_FETCH_JSON totals/mix/perYear and perYearByStatus/pendingByYear. ` +
            `NEVER say you lack access while DEEP_FETCH_JSON is present. ${seriesInstr}\n\n` +
            `DEEP_FETCH_JSON:\n\`\`\`json\n${JSON.stringify(deepWithBucket)}\n\`\`\``,
        });
        return systems;
      }

      // 7.9) Oldest single item
      if (wantsOldestSingle(qRaw)) {
        const deep = await deepFetchOldest();
        systems.push({
          role: "system",
          content:
            `You have the oldest ${memory?.itemSingular ?? "item"} from backend. ` +
            `Use DEEP_FETCH_JSON directly. If DEEP_FETCH_JSON.totals.count === 0, say "No transactions found for this scope." ` +
            `Otherwise, show a short single-item summary (TRN/ID • ReceivedAt • Status). ` +
            `If a field is missing, say "unknown". NEVER claim missing access while DEEP_FETCH_JSON is present.\n\n` +
            `DEEP_FETCH_JSON:\n\`\`\`json\n${JSON.stringify(deep)}\n\`\`\``,
        });
        return systems;
      }

      // 8) Top / latest N
      const top = parseTopN(q);
      if (top) {
        setState(sidKey, { lastTopN: top, lastRange: null, lastGrain: null });
        setAggregation(sidKey, null);
        const deep = await deepFetchLatestN(top.n);
        systems.push({
          role: "system",
          content:
            `You have the latest ${deep.totals.count} ${memory?.itemPlural ?? "items"} from backend. ` +
            `Use DEEP_FETCH_JSON directly; if fields are missing, say "unknown". NEVER claim missing access while DEEP_FETCH_JSON is present.` +
            `\n\nDEEP_FETCH_JSON:\n\`\`\`json\n${JSON.stringify(deep)}\n\`\`\``,
        });
        return systems;
      }

      // 9) Fallback: ALL
      if (alwaysDeepFetchAll) {
        const rows = await fetchAll();
        const deep = present("all", rows);
        systems.push({
          role: "system",
          content:
            `You have the full dataset. Use DEEP_FETCH_JSON for totals and mixes. NEVER say you lack access when DEEP_FETCH_JSON is present.\n\n` +
            `DEEP_FETCH_JSON:\n\`\`\`json\n${JSON.stringify(deep)}\n\`\`\``,
        });
      }

      return systems;
    },
  };
}

// ---------- small helpers ----------
function parseGranularity(qRaw) {
  const s = String(qRaw || "").toLowerCase();
  if (/\b(yearly|per\s+year|by\s+year|annual(?:ly)?)\b/.test(s)) return { kind: "year" };
  if (/\b(quarterly|per\s+quarter|by\s+quarter)\b/.test(s)) return { kind: "quarter" };
  if (/\b(monthly|per\s+month|by\s+month)\b/.test(s)) return { kind: "month" };
  if (/\b(weekly|per\s+week|by\s+week|iso\s*week)\b/.test(s)) return { kind: "week" };
  if (/\b(daily|per\s+day|by\s+day)\b/.test(s)) return { kind: "day" };
  return null;
}
