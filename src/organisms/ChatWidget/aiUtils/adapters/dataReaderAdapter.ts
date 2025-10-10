// src/organisms/ChatWidget/aiUtils/adapters/dataReaderAdapter.ts

import {
  AdapterAugmentArgs,
  AIAdapter,
  MakeDownloadLinkFn,
  Msg,
} from "./interfaces";
import { utf8Encode, toDataUrl } from "./shared/bytes";
import { DAY, startOfDay, pad2, parseAnyDate } from "./shared/dates";

/**
 * DataReaderAdapter
 * - reads list/full/byKey
 * - range/topN/oldest, per-bucket aggregation
 * - CSV/XLSX export (inline data:URL or via server /__ai-register → /__ai-download/:token)
 * - per-chat "always table" preference + last aggregation memory
 *
 * NOTE: Upload-compare is now handled by uploadCompareAdapter.ts.
 */

// ---------------------- types ----------------------
type Endpoints = {
  list: string;
  full: string;
  byKey: (id: string) => string;
};

type MemoryDef = {
  datasetName?: string;
  itemSingular?: string;
  itemPlural?: string;
  synonyms?: string[];
  hotsetLimit?: number;
};

type Shape = {
  timestampAccessor?: (row: any) => number;
  statusAccessor?: (row: any) => string;
  keyAccessor?: (row: any) => string;
};

type Options = {
  baseUrl: string;
  endpoints: Endpoints;
  memory: MemoryDef;
  shape?: Shape;
  facets?: (string | ((row: Record<string, any>) => any))[];
  alwaysDeepFetchAll?: boolean;
  hotsetLimit?: number;
  kb?: any;
  brandNames?: string[];
  makeDownloadLink?: MakeDownloadLinkFn;
};

type Range = { sinceMs?: number; untilMs?: number; label?: string };
type BucketKind = "year" | "quarter" | "month" | "week" | "day";

/* ---------------- session memory ---------------- */
const __uiPrefs = new Map<string, { alwaysTable?: boolean }>();
const __sessionState = new Map<
  string,
  {
    lastRange?: Range | null;
    lastTopN?: { n: number } | null;
    lastGrain?: { kind: BucketKind } | null;
    lastAggregation?: {
      columns: string[];
      rows: Array<string[]>;
      meta?: any;
    } | null;
    // lastUpload removed — now owned by uploadCompareAdapter
  }
>();
const __lastAggregation = new Map<
  string,
  { columns: string[]; rows: Array<string[]>; meta?: any } | null
>();

const getSessionId = (context: any, fallback = "default") =>
  String(context?.sessionId || fallback);
const getState = (sid: string) => __sessionState.get(sid) || {};
const setState = (sid: string, update: any) =>
  __sessionState.set(sid, { ...getState(sid), ...update });
const setAggregation = (sid: string, agg: any) =>
  __lastAggregation.set(sid, agg || null);
const getAggregation = (sid: string) => __lastAggregation.get(sid) || null;

function deriveThreadId(messages: any[]): string {
  if (Array.isArray(messages)) {
    for (const m of messages) {
      if (m?.role === "user" && typeof m?.id === "string" && m.id.trim())
        return `u:${m.id}`;
    }
    if (messages[0]?.id) return `m:${String(messages[0].id)}`;
  }
  return "t0";
}
function makeSidKey(context: any, messages: any[]) {
  const sid = getSessionId(context, "default");
  return `${sid}::${deriveThreadId(messages)}`;
}

/* ---------------- helpers ---------------- */
const flatten = (row: any) =>
  row && row.base ? { ...row.base, ...row.derived } : row || {};
const toUserText = (messages: any[]) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role === "user" && typeof m?.content === "string") return m.content;
  }
  return "";
};

const fetchJson = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return await r.json();
};

const joinUrl = (base: string, p: string) => {
  const left = (base || "").replace(/\/+$/, "");
  const right = (p || "/").replace(/^\/+/, "");
  return `${left}/${right}`;
};

// Convert bytes → base64 safely (browser/SSR safe)
function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)),
    );
  }

  return typeof btoa !== "undefined"
    ? btoa(binary)
    : Buffer.from(binary, "binary").toString("base64");
}

// Resolve server origin for /__ai-register
function resolveServerOrigin(baseUrl: string): string {
  try {
    const u = new URL(baseUrl);
    return `${u.protocol}//${u.host}`;
  } catch {
    try {
      return typeof window !== "undefined" ? window.location.origin : "";
    } catch {
      return "";
    }
  }
}

// Default link maker
function makeDefaultServerLinkFactory(baseUrl: string): MakeDownloadLinkFn {
  const origin = resolveServerOrigin(baseUrl);
  return async (bytes, filename, mime, ttlMs) => {
    if (!origin)
      throw new Error("Cannot resolve server origin for __ai-register");
    const url = joinUrl(origin, "/__ai-register");
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: filename,
        mime,
        ttlMs: ttlMs ?? 10 * 60 * 1000,
        bytesB64: bytesToBase64(
          bytes instanceof Uint8Array
            ? bytes
            : new Uint8Array(bytes as ArrayBuffer),
        ),
      }),
    });
    if (!r.ok) throw new Error(`register failed: ${r.status}`);
    const j = await r.json().catch(() => ({}) as any);
    if (!j?.url) throw new Error("register returned no url");
    return j.url as string;
  };
}

/* ---------------- shape accessors ---------------- */
function smartTimestampMs(shape: Shape | undefined, row: any): number {
  try {
    if (shape?.timestampAccessor) {
      const t = shape.timestampAccessor(
        row && row.base ? { ...row.base, ...row.derived } : row,
      );
      if (Number.isFinite(t)) return t;
    }
  } catch {}
  const r = flatten(row);
  for (const [k, v] of Object.entries(r)) {
    if (!/date|time|at|received|created|updated|processed/i.test(k)) continue;
    const t = parseAnyDate(v);
    if (Number.isFinite(t)) return t;
  }
  return NaN;
}

function computeStatus(shape: Shape | undefined, row: any): string {
  const f = flatten(row);

  // Always normalize into the two buckets the adapter uses everywhere else.
  const raw = shape?.statusAccessor
    ? String(shape.statusAccessor(f) || "")
    : String(f?.status ?? f?.workflowStatus ?? f?.workflowStage ?? f?.stage ?? "");

  return /\b(pending|initiated|in[-\s]?progress|awaiting|on[-\s]?hold|review|draft)\b/i.test(raw)
    ? "PENDING"
    : "REGISTERED";
}

function keyAccessor(shape: Shape | undefined, row: any): string {
  return shape?.keyAccessor
    ? shape.keyAccessor(flatten(row))
    : (row?.id ?? row?.base?.id ?? row?.trn ?? row?.base?.trn);
}

/* ---------------- fetchers ---------------- */
async function fetchHotset(
  baseUrl: string,
  endpoints: Endpoints,
  shape: Shape | undefined,
  limit: number,
) {
  if (!limit || limit <= 0) return [];
  const url = `${baseUrl}${endpoints.list}?limit=${limit}&sortBy=receivedAt&order=desc`;
  const payload = await fetchJson(url);
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  rows.sort(
    (a: any, b: any) =>
      (smartTimestampMs(shape, b) || 0) - (smartTimestampMs(shape, a) || 0),
  );
  return rows;
}
async function fetchAll(
  baseUrl: string,
  endpoints: Endpoints,
  opts?: { forceAll?: boolean },
) {
  const fullBase = `${baseUrl}${endpoints.full}`;
  const sep = fullBase.includes("?") ? "&" : "?";
  const forceAll = opts?.forceAll;
  const since = forceAll ? `&sinceMs=0` : "";
  const until = forceAll ? `&untilMs=${Date.now()}` : "";
  const url = `${fullBase}${sep}limit=0${since}${until}`;
  const payload = await fetchJson(url);
  return Array.isArray(payload?.rows) ? payload.rows : [];
}
async function fetchRowsForRangeStrict(
  baseUrl: string,
  endpoints: Endpoints,
  shape: Shape | undefined,
  range: Range,
) {
  const fullBase = `${baseUrl}${endpoints.full}`;
  const sep = fullBase.includes("?") ? "&" : "?";
  const url = `${fullBase}${sep}limit=0&sinceMs=${range.sinceMs ?? ""}&untilMs=${range.untilMs ?? ""}`;
  let rows: any[] = [];
  try {
    const payload = await fetchJson(url);
    rows = Array.isArray(payload?.rows) ? payload.rows : [];
  } catch {
    rows = [];
  }
  rows = rows.filter((r) => {
    const ms = smartTimestampMs(shape, r);
    if (!Number.isFinite(ms)) return false;
    if (Number.isFinite(range.sinceMs!) && ms < (range.sinceMs as number))
      return false;
    if (Number.isFinite(range.untilMs!) && ms > (range.untilMs as number))
      return false;
    return true;
  });
  return rows;
}
async function deepFetchLatestN(
  baseUrl: string,
  endpoints: Endpoints,
  n: number,
  shape: Shape | undefined,
) {
  try {
    const url = `${baseUrl}${endpoints.list}?limit=${n}&sortBy=receivedAt&order=desc`;
    const payload = await fetchJson(url);
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    if (rows.length) return rows;
  } catch {}
  const all = await fetchAll(baseUrl, endpoints);
  const sorted = [...all].sort(
    (a, b) =>
      (smartTimestampMs(shape, b) || 0) - (smartTimestampMs(shape, a) || 0),
  );
  return sorted.slice(0, n);
}
async function deepFetchOldest(
  baseUrl: string,
  endpoints: Endpoints,
  shape: Shape | undefined,
) {
  try {
    const url = `${baseUrl}${endpoints.list}?limit=1&sortBy=receivedAt&order=asc`;
    const payload = await fetchJson(url);
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    if (rows.length) return rows[0];
  } catch {}
  const all = await fetchAll(baseUrl, endpoints);
  const sorted = [...all].sort(
    (a, b) =>
      (smartTimestampMs(shape, a) || Infinity) -
      (smartTimestampMs(shape, b) || Infinity),
  );
  return sorted[0] ?? null;
}
async function deepFetchByKey(
  baseUrl: string,
  endpoints: Endpoints,
  key: string,
) {
  try {
    const url = `${baseUrl}${endpoints.byKey(key)}`;
    const payload = await fetchJson(url);
    return payload;
  } catch {
    return null;
  }
}

/* ---------------- aggregation + present ---------------- */
function collectHeaders(rows: any[]) {
  const keys = new Set<string>();
  for (const r of rows) Object.keys(r || {}).forEach((k) => keys.add(k));
  const preferred = [
    "trn",
    "id",
    "receivedAt",
    "__receivedAtMs",
    "workflowStage",
    "status",
    "product",
    "bookingLocation",
  ];
  const rest = [...keys].filter((k) => !preferred.includes(k));
  return preferred.filter((k) => keys.has(k)).concat(rest);
}
function toCSVBytes(rows: any[], headersOverride?: string[]): Uint8Array {
  const headers = headersOverride?.length
    ? headersOverride
    : collectHeaders(rows);
  const esc = (v: unknown) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(","));
  return utf8Encode(lines.join("\n"));
}
async function toXLSXBytes(
  rows: any[],
  headersOverride?: string[],
): Promise<Uint8Array> {
  try {
    const mod = await import("exceljs");
    const ExcelJS: any = (mod as any)?.default ?? mod;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("data");
    const headers = headersOverride?.length
      ? headersOverride
      : collectHeaders(rows);
    ws.columns = headers.map((h: string) => ({ header: h, key: h }));
    rows.forEach((r) =>
      ws.addRow(headers.reduce((o: any, h: string) => ((o[h] = r[h]), o), {})),
    );
    const buf: ArrayBuffer = await wb.xlsx.writeBuffer();
    return new Uint8Array(buf);
  } catch {
    return toCSVBytes(rows, headersOverride);
  }
}
// simple table export helpers
function tableToCSVBytes(columns: string[], rows: string[][]): Uint8Array {
  const esc = (v: unknown) =>
    v == null
      ? ""
      : /[",\n]/.test(String(v))
        ? `"${String(v).replace(/"/g, '""')}"`
        : String(v);
  const lines = [columns.join(",")].concat(
    rows.map((r) => r.map(esc).join(",")),
  );
  return utf8Encode(lines.join("\n"));
}
async function tableToXLSXBytes(columns: string[], rows: string[][]) {
  try {
    const mod = await import("exceljs");
    const ExcelJS: any = (mod as any)?.default ?? mod;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("aggregation");
    ws.addRow(columns);
    for (const r of rows) ws.addRow(r);
    const buf: ArrayBuffer = await wb.xlsx.writeBuffer();
    return new Uint8Array(buf);
  } catch {
    return tableToCSVBytes(columns, rows);
  }
}

function present(
  intent: string,
  shape: Shape | undefined,
  rows: any[],
  extra: any = {},
) {
  const flatRows = rows.map(flatten);
  const getYear = (r: any) => {
    const ms = smartTimestampMs(shape, r);
    return Number.isFinite(ms) ? new Date(ms).getUTCFullYear() : undefined;
  };

  const tally = (pick: (r: any) => any) => {
    const map = new Map<any, number>();
    for (const r of flatRows) {
      const k = pick(r);
      if (!k && k !== 0) continue;
      map.set(k, (map.get(k) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  };

  const perYear = tally(getYear);
  const statusMix = tally((r) => computeStatus(shape, r));

  const perYearByStatus: any = {};
  for (const r of flatRows) {
    const ms = smartTimestampMs(shape, r);
    if (!Number.isFinite(ms)) continue;
    const y = new Date(ms).getUTCFullYear();
    const st = computeStatus(shape, r) || "UNKNOWN";
    if (!perYearByStatus[y])
      perYearByStatus[y] = { total: 0, byStatus: {} as Record<string, number> };
    perYearByStatus[y].total++;
    perYearByStatus[y].byStatus[st] =
      (perYearByStatus[y].byStatus[st] || 0) + 1;
  }

  const latestSample = flatRows.slice(0, 50).map((r) => ({
    key: keyAccessor(shape, r),
    status: computeStatus(shape, r),
    timestampMs: smartTimestampMs(shape, r),
    receivedAt: r?.receivedAt,
    trn: r?.trn,
    product: r?.product,
    bookingLocation: r?.bookingLocation,
    workflowStage: r?.workflowStage,
  }));

  return {
    kind: "DEEP_FETCH",
    intent,
    totals: { count: flatRows.length },
    perYear,
    statusMix,
    perYearByStatus,
    latestSample,
    ...extra,
    DEEP_FETCH_READY: true,
  };
}

/* ---------------- parsing helpers ---------------- */
const norm = (s: string) => String(s || "").toLowerCase();
const wantsTableNow = (q: string) =>
  /\b(table|tabular|markdown table|grid)\b/i.test(q);

function detectStatusFilter(q: string): "PENDING" | "REGISTERED" | null {
  const s = q.toLowerCase();
  if (/\bpending\b/.test(s)) return "PENDING";
  if (/\bregistered\b/.test(s)) return "REGISTERED";
  return null;
}

function parseTopN(q: string) {
  let m = q.match(
    /\b(top|latest|newest|most\s+recent)\s+(\d{1,4}(?:[,\s]?\d{3})*)\b/i,
  );
  if (m)
    return {
      n: Math.max(1, Math.min(2000, Number(m[2].replace(/[,\s]/g, "")))),
    };
  m = q.match(
    /\b(\d{1,4}(?:[,\s]?\d{3})*)\s+(transactions?|rows|records|entries|txns?)\b/i,
  );
  if (m)
    return {
      n: Math.max(1, Math.min(2000, Number(m[1].replace(/[,\s]/g, "")))),
    };
  if (
    /\b(latest|newest|most\s+recent)\s+(transaction|row|record|entry|txn)\b/i.test(
      q,
    )
  )
    return { n: 1 };
  return null;
}
function wantsOldestSingle(q: string) {
  const s = norm(q);
  return (
    /\b(oldest|earliest|first)\s+(transaction|row|record|entry|txn)\b/i.test(
      s,
    ) ||
    (/\b(oldest|earliest|first)\b/.test(s) &&
      /\b(txns?|transactions?|rows?|records?|entries?)\b/i.test(s))
  );
}
function parseAbsoluteDateRange(q: string): Range | null {
  let m = q.match(
    /\b(between|from)\s+(\d{4}-\d{2}-\d{2})\s+(?:and|to|-)\s+(\d{4}-\d{2}-\d{2})\b/i,
  );
  if (m) {
    const sinceMs = Date.parse(`${m[2]}T00:00:00Z`);
    const untilMs = Date.parse(`${m[3]}T23:59:59.999Z`);
    if (Number.isFinite(sinceMs) && Number.isFinite(untilMs))
      return { sinceMs, untilMs, label: `${m[2]} to ${m[3]}` };
  }
  m = q.match(/\bon\s+(\d{4}-\d{2}-\d{2})\b/i);
  if (m) {
    const d0 = startOfDay(Date.parse(`${m[1]}T00:00:00Z`));
    if (Number.isFinite(d0))
      return { sinceMs: d0, untilMs: d0 + DAY - 1, label: `on ${m[1]}` };
  }
  return null;
}
function parseYearSpan(q: string): Range | null {
  const dash = "[-–—]";
  const re = new RegExp(
    `\\b(?:between\\s+)?(19|20)\\d{2}\\s*(?:${dash}|to|and)\\s*(\\d{2,4})\\b`,
    "i",
  );
  const m = q.match(re);
  if (!m) return null;
  const first = Number(q.match(/\b(19|20)\d{2}\b/)?.[0]);
  const tail = m[2];
  const last =
    tail.length === 4 ? Number(tail) : Number(String(first).slice(0, 2) + tail);
  if (!Number.isFinite(first) || !Number.isFinite(last)) return null;
  const a = Math.min(first, last),
    b = Math.max(first, last);
  return {
    sinceMs: Date.parse(`${a}-01-01T00:00:00Z`),
    untilMs: Date.parse(`${b}-12-31T23:59:59Z`),
    label: `${a}-${b}`,
  };
}
function parseYearOnly(q: string): Range | null {
  const y = q.match(/\b(?:in|for)\s+(20\d{2}|19\d{2})\b/i);
  if (!y) return null;
  const yr = Number(y[1]);
  return {
    sinceMs: Date.parse(`${yr}-01-01T00:00:00Z`),
    untilMs: Date.parse(`${yr}-12-31T23:59:59Z`),
    label: `year ${yr}`,
  };
}
function monthIndex(name: string) {
  const map: Record<string, number> = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };
  const n = name.toLowerCase();
  for (const k of Object.keys(map))
    if (k.startsWith(n.slice(0, 3))) return map[k];
  return null;
}
function parseMonthNameRange(q: string): Range | null {
  const dash = "[-–—]";
  const month =
    "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
  const re = new RegExp(
    `\\b(?:between|from)\\s+${month}\\s*(?:${dash}|to|and)\\s*${month}(?:\\s+(20\\d{2}|19\\d{2}))?\\b`,
    "i",
  );
  const m = q.match(re);
  if (!m) return null;
  const yr = m[3] ? Number(m[3]) : new Date().getUTCFullYear();
  const startIdx = monthIndex(m[1]!);
  const endIdx = monthIndex(m[2]!);
  if (startIdx == null || endIdx == null) return null;
  const sinceMs = Date.parse(`${yr}-${pad2(startIdx + 1)}-01T00:00:00Z`);
  const lastDay = new Date(Date.UTC(yr, endIdx + 1, 0)).getUTCDate();
  const untilMs = Date.parse(
    `${yr}-${pad2(endIdx + 1)}-${pad2(lastDay)}T23:59:59.999Z`,
  );
  return { sinceMs, untilMs, label: `${m[1]}-${m[2]} ${yr}` };
}
function parseMonthNameSingle(q: string): Range | null {
  const m = q.match(
    /\b(?:last|in)?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(20\d{2}|19\d{2})?\b/i,
  );
  if (!m) return null;
  const monthIdx = monthIndex(m[1]!);
  if (monthIdx == null) return null;
  const now = new Date();
  let yr = m[2] ? Number(m[2]) : now.getUTCFullYear();
  if (!m[2] && /\blast\b/i.test(m[0]!)) {
    const nowMonth = now.getUTCMonth();
    if (monthIdx >= nowMonth) yr = yr - 1;
  }
  const sinceMs = Date.parse(`${yr}-${pad2(monthIdx + 1)}-01T00:00:00Z`);
  const lastDay = new Date(Date.UTC(yr, monthIdx + 1, 0)).getUTCDate();
  const untilMs = Date.parse(
    `${yr}-${pad2(monthIdx + 1)}-${pad2(lastDay)}T23:59:59.999Z`,
  );
  return { sinceMs, untilMs, label: `${m[1]} ${yr}` };
}
function parseRelativeRange(q: string): Range | null {
  const nowMs = Date.now();
  const m = q.match(
    /\b(last|past)\s+(\d+)\s*(day|days|week|weeks|month|months|year|years)\b/i,
  );
  if (m) {
    const n = Number(m[2]);
    const unit = m[3].toLowerCase();
    const span = unit.startsWith("day")
      ? DAY
      : unit.startsWith("week")
        ? 7 * DAY
        : unit.startsWith("month")
          ? 30 * DAY
          : 365 * DAY;
    return {
      sinceMs: nowMs - n * span,
      untilMs: nowMs,
      label: `last ${n} ${unit}`,
    };
  }
  const m2 = q.match(/\b(previous|last)\s+(week|month|year)\b/i);
  if (m2) {
    const unit = m2[2].toLowerCase();
    const span =
      unit === "week" ? 7 * DAY : unit === "month" ? 30 * DAY : 365 * DAY;
    return { sinceMs: nowMs - span, untilMs: nowMs, label: `last ${unit}` };
  }
  if (/\b(last\s+2\s+weeks|last\s+two\s+weeks|fortnight)\b/i.test(q)) {
    return { sinceMs: nowMs - 14 * DAY, untilMs: nowMs, label: "last 2 weeks" };
  }
  return null;
}
function parseGranularity(qRaw: string): { kind: BucketKind } | null {
  const s = String(qRaw || "").toLowerCase();
  if (/\b(yearly|per\s+year|by\s+year|annual(?:ly)?)\b/.test(s))
    return { kind: "year" };
  if (/\b(quarterly|per\s+quarter|by\s+quarter)\b/.test(s))
    return { kind: "quarter" };
  if (/\b(monthly|per\s+month|by\s+month)\b/.test(s)) return { kind: "month" };
  if (/\b(weekly|per\s+week|by\s+week|iso\s*week)\b/.test(s))
    return { kind: "week" };
  if (/\b(daily|per\s+day|by\s+day)\b/.test(s)) return { kind: "day" };
  return null;
}

/* ---------------- adapter factory ---------------- */
export function makeDataReaderAdapter(opts: Options): AIAdapter {
  const {
    baseUrl,
    endpoints,
    memory,
    shape,
    alwaysDeepFetchAll = true,
    hotsetLimit,
    kb = null,
    brandNames = [],
    makeDownloadLink,
  } = opts;

  const linkMaker: MakeDownloadLinkFn =
    makeDownloadLink || makeDefaultServerLinkFactory(baseUrl);

  const HOTSET_LIMIT = Number.isFinite(hotsetLimit as number)
    ? (hotsetLimit as number)
    : Number.isFinite(memory?.hotsetLimit as number)
      ? (memory.hotsetLimit as number)
      : 0;

  const scopeRubricSystem = ({
    datasetName = "Workdesk",
    itemPlural = "items",
    brandTokens = [] as string[],
  } = {}) =>
    ({
      role: "system",
      content: `Scope Rubric (self-judge, then act):
- PRIMARY SCOPE: ${datasetName} ${itemPlural} — counts, date ranges, latest/oldest, status mixes, TRN lookups.
- META (capabilities/help/how to ask): answer friendly + 4–6 example prompts (bullets; NOT a table unless user asked).
- BRAND (${brandTokens.length ? brandTokens.join(", ") : "your brand"}): answer using KB_JSON only; if unknown, say you don’t know.
- SERVICE (weather/time/maps): one sentence that this chat has no live access, then offer 3–5 in-scope ideas (bullets; NOT a table unless asked).
- OUT-OF-SCOPE TRIVIA/DEFINITIONS: decline briefly and show 4–6 in-scope examples.

Formatting default: concise sentences or bullets. Only use a table if the user explicitly asks or a persistent “always table” preference is set.`,
    }) as Msg;

  return {
    async buildMemory() {
      const ds = memory?.datasetName ?? "Dataset";
      const singular = memory?.itemSingular ?? "item";
      const plural = memory?.itemPlural ?? "items";
      const synonyms = memory?.synonyms ?? [];

      const hotset = await fetchHotset(baseUrl, endpoints, shape, HOTSET_LIMIT);
      const nowMs = Date.now();
      const todayStart = startOfDay(nowMs);
      const last7Start = nowMs - 7 * DAY;
      const last30Start = nowMs - 30 * DAY;
      let today = 0,
        last7 = 0,
        last30 = 0;
      for (const r of hotset) {
        const ms = smartTimestampMs(shape, r);
        if (!Number.isFinite(ms)) continue;
        if (ms >= last30Start) last30++;
        if (ms >= last7Start) last7++;
        if (ms >= todayStart) today++;
      }

      const payload = {
        terminology: { datasetName: ds, singular, plural, synonyms },
        snapshot: { last30, last7, today },
        hotset: hotset.slice(0, HOTSET_LIMIT).map((r) => ({
          key: keyAccessor(shape, r),
          receivedAt: r?.receivedAt ?? r?.base?.receivedAt,
          timestampMs: smartTimestampMs(shape, r),
          status: computeStatus(shape, r),
          trn: r?.trn ?? r?.base?.trn,
          product: r?.product ?? r?.base?.product,
          bookingLocation: r?.bookingLocation ?? r?.base?.bookingLocation,
          workflowStage: r?.workflowStage ?? r?.base?.workflowStage,
        })),
        notes: {
          latestDefinition: "Latest = max timestampMs (most recent receivedAt)",
          hotsetLimit: HOTSET_LIMIT,
        },
        kb: kb
          ? { available: true, title: kb.title || kb.brand || "Knowledge Base" }
          : undefined,
      };

      return {
        role: "system",
        content:
          `You are the ${ds} Assistant. Treat each ${singular} synonymously with ${[plural, ...synonyms].join(", ")}.\n` +
          `Use MEMORY_JSON for context. For counts/ranges/top-N the server will provide DEEP_FETCH_JSON.\n\n` +
          `MEMORY_JSON:\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``,
      };
    },

    async augment({ text, messages, context }: AdapterAugmentArgs) {
      const qRaw = (text || toUserText(messages) || "").trim();
      const q = norm(qRaw);
      const systems: Msg[] = [];

      // scope rubric
      systems.push(
        scopeRubricSystem({
          datasetName: memory?.datasetName ?? "Workdesk",
          itemPlural: memory?.itemPlural ?? "items",
          brandTokens: brandNames,
        }),
      );

      // per-chat key
      const sidKey = makeSidKey(context, messages);
      const pref = __uiPrefs.get(sidKey) || {};
      const state = getState(sidKey);

      // table preference
      let forceTableThisTurn = false;
      if (/\b(use|show|format|render).*\btable\b/i.test(qRaw)) {
        if (/\b(always|default)\b/i.test(qRaw)) {
          __uiPrefs.set(sidKey, { ...(pref || {}), alwaysTable: true });
          systems.push({
            role: "system",
            content: "I will use tables by default for this session.",
          });
        } else {
          forceTableThisTurn = true;
          systems.push({
            role: "system",
            content: "I’ll use a table for this reply.",
          });
        }
      }
      const useTable = !!(
        pref.alwaysTable ||
        forceTableThisTurn ||
        wantsTableNow(qRaw)
      );

      // service-like asks
      if (
        /\b(weather|forecast|temperature|time|map|direction|traffic)\b/i.test(q)
      ) {
        systems.push({
          role: "system",
          content: useTable
            ? `You do NOT have live access to external services here. Say that in 1 sentence, then present 3–5 in-scope ideas in a Markdown table (“Try this” | “Purpose”).`
            : `You do NOT have live access to external services here. Say that in 1 sentence, then present 3–5 in-scope ideas as bullet points.`,
        });
        return systems;
      }

      // brand/KB asks (simple containment)
      if (
        (brandNames || []).some((b) =>
          qRaw.toLowerCase().includes(b.toLowerCase()),
        )
      ) {
        systems.push({
          role: "system",
          content:
            `Answer using KB_JSON only. Be concise and factual. If a field is missing, say you don't know.\n\n` +
            `KB_JSON:\n\`\`\`json\n${JSON.stringify(kb || {})}\n\`\`\``,
        });
        return systems;
      }

      // explicit key lookup
      const mKey = qRaw.match(/\b(SPBTR\d{2}RFC\d{6})\b/i);
      if (mKey) {
        const item = await deepFetchByKey(baseUrl, endpoints, mKey[1]);
        systems.push({
          role: "system",
          content:
            `You have details for key ${mKey[1]}. Answer from DEEP_FETCH_JSON.\n\n` +
            `DEEP_FETCH_JSON:\n\`\`\`json\n${JSON.stringify({ kind: "DEEP_FETCH", intent: "byKey", key: mKey[1], item, DEEP_FETCH_READY: true })}\n\`\`\``,
        });
        return systems;
      }

      // parse scope (range & status)
      const grain = parseGranularity(qRaw);
      const abs = parseAbsoluteDateRange(qRaw);
      const span = parseYearSpan(qRaw);
      const yearOnly = parseYearOnly(qRaw);
      const monRange = parseMonthNameRange(qRaw);
      const monSingle = parseMonthNameSingle(qRaw);
      const rel = parseRelativeRange(qRaw);
      let picked: Range | null =
        abs || span || yearOnly || monRange || monSingle || rel;
      const statusFilter = detectStatusFilter(qRaw);

      // ----- EXPORTS (no upload-related paths here) -----
      const wantsExport =
        /\b(export(?:\s+it)?|download(?:able)?|save|dump|extract|create\s+(?:a\s+)?download(?:able)?\s+file)\b/i.test(
          qRaw,
        );
      const wantXlsx = /\b(xlsx|excel|spreadsheet)\b/i.test(qRaw);
      const explicitAll = /\b(all|entire|full|everything)\b/i.test(qRaw);
      const topInline = parseTopN(qRaw);

      if (wantsExport) {
        // “export it” → lastAggregation from THIS adapter
        const lastAgg = state?.lastAggregation || getAggregation(sidKey);
        if (
          !explicitAll &&
          !abs &&
          !span &&
          !yearOnly &&
          !monRange &&
          !monSingle &&
          !rel &&
          !topInline &&
          lastAgg?.columns &&
          lastAgg?.rows
        ) {
          const ts = new Date().toISOString().replace(/[:.]/g, "");
          const inferred =
            lastAgg?.meta?.name ||
            (lastAgg.columns[0]?.toLowerCase() === "year"
              ? "grouped-by-year"
              : "aggregation");
          const baseName = (memory?.datasetName || "workdesk")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-");
          const filename = `${baseName}-${inferred}-${ts}.${wantXlsx ? "xlsx" : "csv"}`;

          const bytes = wantXlsx
            ? await tableToXLSXBytes(lastAgg.columns, lastAgg.rows)
            : tableToCSVBytes(lastAgg.columns, lastAgg.rows);

          const mime = wantXlsx
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "text/csv;charset=utf-8";

          let href = "";
          try {
            href = await linkMaker(bytes, filename, mime, 10 * 60 * 1000);
          } catch {}
          if (!href) href = toDataUrl(mime, bytes, 2_000_000) || "";

          if (href) {
            systems.push({
              role: "system",
              content: `Output exactly ONE line of Markdown:\n\n📎 Download: [${filename}](${href})`,
            });
          } else {
            systems.push({
              role: "system",
              content:
                "File too large to inline. Ask the user to narrow the export; give 3 concrete examples.",
            });
          }
          return systems;
        }

        // “export all …”
        if (explicitAll && !picked && !topInline) {
          let rows = await fetchAll(baseUrl, endpoints, { forceAll: true });
          if (!rows?.length) {
            systems.push({
              role: "system",
              content:
                "No rows found. Say one brief line and offer 3 ways to adjust scope.",
            });
            return systems;
          }

          const headers = collectHeaders(rows.map(flatten));
          const ts = new Date().toISOString().replace(/[:.]/g, "");
          const baseName = (memory?.datasetName || "workdesk")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-");
          const filename = `${baseName}-all-${ts}.${wantXlsx ? "xlsx" : "csv"}`;

          const HARD = 250_000;
          if (rows.length > HARD) rows = rows.slice(0, HARD);

          const flat = rows.map(flatten);
          const bytes = wantXlsx
            ? await toXLSXBytes(flat, headers)
            : toCSVBytes(flat, headers);
          const mime = wantXlsx
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "text/csv;charset=utf-8";

          let href = "";
          try {
            href = await linkMaker(bytes, filename, mime, 10 * 60 * 1000);
          } catch {}
          if (!href) href = toDataUrl(mime, bytes, 2_000_000) || "";
          if (href) {
            systems.push({
              role: "system",
              content: `Output exactly ONE line of Markdown:\n\n📎 Download: [${filename}](${href})`,
            });
          } else {
            systems.push({
              role: "system",
              content:
                "File too large to inline. Ask the user to narrow the export; give exactly 3 concrete examples.",
            });
          }
          return systems;
        }

        // Otherwise, export current scope or inferred scope/topN
        let rows: any[] = [];
        let selectionLabel: string | null = null;

        if (picked) {
          rows = await fetchRowsForRangeStrict(
            baseUrl,
            endpoints,
            shape,
            picked,
          );
          if (statusFilter)
            rows = rows.filter((r) => computeStatus(shape, r) === statusFilter);
          rows.sort(
            (a, b) =>
              (smartTimestampMs(shape, b) || 0) -
              (smartTimestampMs(shape, a) || 0),
          );
          selectionLabel = picked.label || "range";
          setState(sidKey, {
            lastRange: picked,
            lastTopN: null,
            lastGrain: grain || null,
          });
        } else if (topInline) {
          const want = Math.max(topInline.n, 1);
          let latest = await deepFetchLatestN(
            baseUrl,
            endpoints,
            Math.max(want * 5, want + 10),
            shape,
          );
          if (statusFilter)
            latest = latest.filter(
              (r) => computeStatus(shape, r) === statusFilter,
            );
          rows = latest.slice(0, want);
          selectionLabel = `latest-${want}${statusFilter ? `-${statusFilter.toLowerCase()}` : ""}`;
          setState(sidKey, {
            lastTopN: topInline,
            lastRange: null,
            lastGrain: null,
          });
        } else if (state.lastRange) {
          rows = await fetchRowsForRangeStrict(
            baseUrl,
            endpoints,
            shape,
            state.lastRange,
          );
          if (statusFilter)
            rows = rows.filter((r) => computeStatus(shape, r) === statusFilter);
          selectionLabel = state.lastRange.label || "range";
        } else {
          rows = await fetchAll(baseUrl, endpoints);
          if (statusFilter)
            rows = rows.filter((r) => computeStatus(shape, r) === statusFilter);
          selectionLabel = "all";
        }

        if (!rows || rows.length === 0) {
          systems.push({
            role: "system",
            content:
              "Export failed (empty data). Say one brief line explaining there were no rows for that scope, then offer 3 ways to narrow/adjust.",
          });
          return systems;
        }

        const HARD = 250_000;
        if (rows.length > HARD) rows = rows.slice(0, HARD);

        const ts = new Date().toISOString().replace(/[:.]/g, "");
        const safeSlug = (s: string) =>
          String(s || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
        const baseName = memory?.datasetName
          ? safeSlug(memory.datasetName)
          : "dataset";
        const scopePart = selectionLabel ? `-${safeSlug(selectionLabel)}` : "";
        const headers = collectHeaders(rows.map(flatten));

        const filename = `${baseName}${scopePart}-${ts}.${wantXlsx ? "xlsx" : "csv"}`;
        const bytes = wantXlsx
          ? await toXLSXBytes(rows.map(flatten), headers)
          : toCSVBytes(rows.map(flatten), headers);
        const mime = wantXlsx
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "text/csv;charset=utf-8";

        let href = "";
        try {
          href = await linkMaker(bytes, filename, mime, 10 * 60 * 1000);
        } catch {}
        if (!href) href = toDataUrl(mime, bytes, 2_000_000) || "";

        if (href) {
          systems.push({
            role: "system",
            content: `Output exactly ONE line of Markdown:\n\n📎 Download: [${filename}](${href})`,
          });
        } else {
          systems.push({
            role: "system",
            content:
              "Say one short line asking the user to narrow the range (too large to embed). Give exactly 3 concrete examples.",
          });
        }
        return systems;
      }

      // Special: “per year” with no range → aggregate ALL years and persist aggregation
      if (!picked && grain?.kind === "year") {
        const allRows = await fetchAll(baseUrl, endpoints, { forceAll: true });

        const map = new Map<
          string,
          { total: number; reg: number; pen: number }
        >();
        for (const r of allRows) {
          const ms = smartTimestampMs(shape, r);
          if (!Number.isFinite(ms)) continue;
          const y = String(new Date(ms).getUTCFullYear());
          const st = computeStatus(shape, r);
          const cur = map.get(y) || { total: 0, reg: 0, pen: 0 };
          cur.total++;
          if (st === "REGISTERED") cur.reg++;
          if (st === "PENDING") cur.pen++;
          map.set(y, cur);
        }

        const cols = ["Year", "Total", "Registered", "Pending"];
        const rowsAgg = Array.from(map.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([y, v]) => [y, String(v.total), String(v.reg), String(v.pen)]);
        const agg = {
          columns: cols,
          rows: rowsAgg,
          meta: { name: "per-year" },
        };

        setState(sidKey, {
          lastAggregation: agg,
          lastRange: null,
          lastTopN: null,
          lastGrain: { kind: "year" },
        });
        setAggregation(sidKey, agg);

        const deepAll = present("all", shape, allRows, {
          bucket: { kind: "year" },
        });

        const renderInstr = useTable
          ? "Render a compact table: Year | Total | Registered | Pending."
          : "List each year like: YEAR — Total: X (Registered: Y, Pending: Z).";

        systems.push({
          role: "system",
          content:
            `You have ALL available years (forced all-time). Use DEEP_FETCH_JSON. ${renderInstr}\n\n` +
            `DEEP_FETCH_JSON:\n\`\`\`json\n${JSON.stringify(deepAll)}\n\`\`\``,
        });
        return systems;
      }

      // ---------- RANGE / GRAIN ----------
      if (picked || grain) {
        if (!picked && grain) {
          const now = Date.now();
          let sinceMs = now - 30 * DAY;
          switch (grain.kind) {
            case "quarter":
              sinceMs = now - 12 * 30 * DAY;
              break;
            case "month":
              sinceMs = now - 12 * 30 * DAY;
              break;
            case "week":
              sinceMs = now - 12 * 7 * DAY;
              break;
            case "day":
              sinceMs = now - 30 * DAY;
              break;
          }
          picked = { sinceMs, untilMs: now, label: "recent period" };
        }

        setState(sidKey, {
          lastRange: picked || null,
          lastGrain: grain || null,
          lastTopN: null,
        });

        const rows = await fetchRowsForRangeStrict(
          baseUrl,
          endpoints,
          shape,
          picked!,
        );
        const deep = present("range", shape, rows, { range: picked });

        if (grain && grain.kind !== "year") {
          const bucketHeader =
            grain.kind === "quarter"
              ? "Quarter"
              : grain.kind === "month"
                ? "Month"
                : grain.kind === "week"
                  ? "Week"
                  : "Day";

          const map = new Map<
            string,
            { total: number; reg: number; pen: number }
          >();
          for (const r of rows) {
            const ms = smartTimestampMs(shape, r);
            if (!Number.isFinite(ms)) continue;
            const d = new Date(ms);
            let key: string;
            switch (grain.kind) {
              case "quarter":
                key = `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
                break;
              case "month":
                key = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
                break;
              case "week": {
                const tmp = new Date(new Date(ms).setUTCHours(0, 0, 0, 0));
                const wd = tmp.getUTCDay() || 7;
                tmp.setUTCDate(tmp.getUTCDate() - (wd - 1));
                const y = new Date(tmp.getTime() + 3 * DAY).getUTCFullYear();
                const first = new Date(Date.UTC(y, 0, 4));
                const w =
                  Math.round(
                    (tmp.getTime() -
                      (first.getTime() -
                        ((first.getUTCDay() || 7) - 1) * DAY)) /
                      (7 * DAY),
                  ) + 1;
                key = `${y}-W${pad2(w)}`;
                break;
              }
              default:
                key = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
            }
            const st = computeStatus(shape, r);
            const cur = map.get(key) || { total: 0, reg: 0, pen: 0 };
            cur.total++;
            if (st === "REGISTERED") cur.reg++;
            if (st === "PENDING") cur.pen++;
            map.set(key, cur);
          }

          const cols = [bucketHeader, "Total", "Registered", "Pending"];
          const rowsAgg = Array.from(map.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([k, v]) => [
              k,
              String(v.total),
              String(v.reg),
              String(v.pen),
            ]);
          setState(sidKey, {
            lastAggregation: { columns: cols, rows: rowsAgg },
          });
          setAggregation(sidKey, { columns: cols, rows: rowsAgg });
        } else if (!grain) {
          // detail sample aggregation
          const cols = [
            "TRN/ID",
            "Received At",
            "Status",
            "Product",
            "Booking Location",
            "Workflow Stage",
          ];
          const rowsAgg = rows
            .sort(
              (a, b) =>
                (smartTimestampMs(shape, b) || 0) -
                (smartTimestampMs(shape, a) || 0),
            )
            .slice(0, 200)
            .map((r) => [
              String(r?.trn ?? r?.id ?? r?.base?.trn ?? r?.base?.id ?? ""),
              String(r?.receivedAt ?? r?.base?.receivedAt ?? ""),
              computeStatus(shape, r),
              String(r?.product ?? r?.base?.product ?? ""),
              String(r?.bookingLocation ?? r?.base?.bookingLocation ?? ""),
              String(r?.workflowStage ?? r?.base?.workflowStage ?? ""),
            ]);
          setState(sidKey, {
            lastAggregation: {
              columns: cols,
              rows: rowsAgg,
              meta: { name: "selection" },
            },
          });
          setAggregation(sidKey, {
            columns: cols,
            rows: rowsAgg,
            meta: { name: "selection" },
          });
        }

        const bucketHeader = !grain
          ? "Bucket"
          : grain.kind === "quarter"
            ? "Quarter"
            : grain.kind === "month"
              ? "Month"
              : grain.kind === "week"
                ? "Week"
                : "Day";

        const seriesInstr = useTable
          ? `If buckets are present, render a compact table: ${bucketHeader} | Total | Registered | Pending.`
          : `If buckets are present, list one line per bucket like: "${bucketHeader} — Total: X (Registered: Y, Pending: Z)".`;

        systems.push({
          role: "system",
          content:
            `You have exact data for ${picked!.label}. Use DEEP_FETCH_JSON totals/mix/perYear. ${seriesInstr}\n\n` +
            `DEEP_FETCH_JSON:\n\`\`\`json\n${JSON.stringify(deep)}\n\`\`\``,
        });
        return systems;
      }

      // oldest single
      if (wantsOldestSingle(qRaw)) {
        const item = await deepFetchOldest(baseUrl, endpoints, shape);
        const deep = present("oldest", shape, item ? [item] : []);
        systems.push({
          role: "system",
          content:
            `You have the oldest ${memory?.itemSingular ?? "item"} from backend.\n\n` +
            `DEEP_FETCH_JSON:\n\`\`\`json\n${JSON.stringify(deep)}\n\`\`\``,
        });
        return systems;
      }

      // top / latest N
      const top = parseTopN(qRaw);
      if (top) {
        setState(sidKey, { lastTopN: top, lastRange: null, lastGrain: null });
        let latest = await deepFetchLatestN(
          baseUrl,
          endpoints,
          Math.max(top.n * 5, top.n + 10),
          shape,
        );
        if (detectStatusFilter(qRaw))
          latest = latest.filter(
            (r) => computeStatus(shape, r) === detectStatusFilter(qRaw),
          );
        const rowsSel = latest.slice(0, top.n);
        const deep = present("latestN", shape, rowsSel, {
          request: { n: top.n },
        });

        // persist detail aggregation
        const cols = [
          "TRN/ID",
          "Received At",
          "Status",
          "Product",
          "Booking Location",
          "Workflow Stage",
        ];
        const rowsAgg = rowsSel.map((r) => [
          String(r?.trn ?? r?.id ?? r?.base?.trn ?? r?.base?.id ?? ""),
          String(r?.receivedAt ?? r?.base?.receivedAt ?? ""),
          computeStatus(shape, r),
          String(r?.product ?? r?.base?.product ?? ""),
          String(r?.bookingLocation ?? r?.base?.bookingLocation ?? ""),
          String(r?.workflowStage ?? r?.base?.workflowStage ?? ""),
        ]);
        setState(sidKey, {
          lastAggregation: {
            columns: cols,
            rows: rowsAgg,
            meta: { name: `selection-latest-${top.n}` },
          },
        });
        setAggregation(sidKey, {
          columns: cols,
          rows: rowsAgg,
          meta: { name: `selection-latest-${top.n}` },
        });

        systems.push({
          role: "system",
          content:
            `You have the latest ${deep.totals.count} ${memory?.itemPlural ?? "items"} from backend.` +
            `\n\nDEEP_FETCH_JSON:\n\`\`\`json\n${JSON.stringify(deep)}\n\`\`\``,
        });
        return systems;
      }

      // fallback: ALL
      if (alwaysDeepFetchAll) {
        const rows = await fetchAll(baseUrl, endpoints);
        const deep = present("all", shape, rows);
        systems.push({
          role: "system",
          content:
            `You have the full dataset. Use DEEP_FETCH_JSON for totals and mixes.\n\n` +
            `DEEP_FETCH_JSON:\n\`\`\`json\n${JSON.stringify(deep)}\n\`\`\``,
        });
      }

      return systems;
    },
  };
}
