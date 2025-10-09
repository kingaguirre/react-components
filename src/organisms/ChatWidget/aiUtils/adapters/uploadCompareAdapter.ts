import {
  AIAdapter,
  AdapterAugmentArgs,
  MakeDownloadLinkFn,
} from "./interfaces";
import { utf8Encode, base64ToBytes, toDataUrl } from "./shared/bytes";
import { slug } from "./shared/text";

const EMIT = "[[EMIT]]";

type Endpoints = {
  list: string;
  full: string;
  byKey: (id: string) => string;
};

type Options = {
  baseUrl: string;
  endpoints: Endpoints;
  makeDownloadLink?: MakeDownloadLinkFn;
};

type Range = { sinceMs?: number; untilMs?: number; label?: string };

// ---------------- session memory (per chat/thread) ----------------
const __state = new Map<
  string,
  {
    lastAggregation?: {
      columns: string[];
      rows: string[][];
      meta?: any;
    } | null;
    lastUpload?: {
      name: string;
      kind: "csv" | "xlsx";
      rows: any[];
      headersOriginal: string[];
      headersCanon: string[];
    } | null;
  }
>();

const pad2 = (n: number) => String(n).padStart(2, "0");

function monthIndex(name: string): number | null {
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
  const key = Object.keys(map).find((k) =>
    k.startsWith(name.toLowerCase().slice(0, 3)),
  );
  return key ? map[key] : null;
}
const monthName = (m: number) =>
  [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ][m] || String(m + 1);

// Per-chat/thread key (mirrors your tabularPlugin scoping)
const getSid = (context: any, messages: any[]) => {
  const sessionId = String(context?.sessionId || "default");
  let threadId = "t0";
  if (Array.isArray(messages)) {
    for (const m of messages) {
      if (m?.role === "user" && typeof m?.id === "string" && m.id.trim()) {
        threadId = `u:${m.id}`;
        break;
      }
    }
    if (threadId === "t0" && messages?.[0]?.id)
      threadId = `m:${String(messages[0].id)}`;
  }
  return `${sessionId}::${threadId}`;
};
const getState = (sid: string) => __state.get(sid) || {};
const setState = (sid: string, u: any) =>
  __state.set(sid, { ...getState(sid), ...u });

// ---------------- tiny HTML helpers (for pretty diffs) -------------
const USE_INLINE_HTML = true;
const esc = (s: string) =>
  String(s).replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] || c,
  );
const chip = (label: string) =>
  USE_INLINE_HTML
    ? `<span style="background:#fff7d6;color:#7a5d00;padding:0 .30em;border-radius:.25em;white-space:nowrap;font-weight:600">${esc(label)}</span>`
    : `**${label}**`;
const oldVal = (v: string) =>
  USE_INLINE_HTML
    ? `<span style="color:#b00020;font-weight:600">${esc(v)}</span>`
    : v;
const newVal = (v: string) =>
  USE_INLINE_HTML
    ? `<span style="color:#0b6d00;font-weight:700">${esc(v)}</span>`
    : v;
const arrow = () =>
  USE_INLINE_HTML ? `<span style="opacity:.85">&rarr;</span>` : "→";
const showVal = (v: unknown) =>
  String(v ?? "") === "" ? "(empty)" : String(v ?? "");

// ---------------- helpers ----------------
const joinUrl = (base: string, p: string) =>
  `${base.replace(/\/+$/, "")}/${p.replace(/^\/+/, "")}`;

async function fetchJson(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return await r.json();
}

async function fetchAll(baseUrl: string, endpoints: Endpoints) {
  const fullBase = `${baseUrl}${endpoints.full}`;
  const sep = fullBase.includes("?") ? "&" : "?";
  const url = `${fullBase}${sep}limit=0&sinceMs=0&untilMs=${Date.now()}`;
  const payload = await fetchJson(url);
  return Array.isArray(payload?.rows) ? payload.rows : [];
}

async function fetchRowsForRangeStrict(
  baseUrl: string,
  endpoints: Endpoints,
  range: Range,
) {
  const fullBase = `${baseUrl}${endpoints.full}`;
  const sep = fullBase.includes("?") ? "&" : "?";
  const url = `${fullBase}${sep}limit=0&sinceMs=${range.sinceMs ?? ""}&untilMs=${range.untilMs ?? ""}`;
  const payload = await fetchJson(url);
  let rows: any[] = Array.isArray(payload?.rows) ? payload.rows : [];
  rows = rows.filter((r) => {
    const ms =
      typeof r?.__receivedAtMs === "number"
        ? r.__receivedAtMs
        : typeof r?.base?.__receivedAtMs === "number"
          ? r.base.__receivedAtMs
          : Date.parse(r?.receivedAt || r?.base?.receivedAt || "");
    if (!Number.isFinite(ms)) return false;
    if (Number.isFinite(range.sinceMs!) && ms < (range.sinceMs as number))
      return false;
    if (Number.isFinite(range.untilMs!) && ms > (range.untilMs as number))
      return false;
    return true;
  });
  return rows;
}

// --------- attachment → rows (CSV/XLSX) ----------
const isCsvName = (name = "") => /\.csv$/i.test(name);
const isXlsxName = (name = "") => /\.xlsx$/i.test(name);
const isCsvMime = (m = "") => /(^text\/csv|\bcsv\b)/i.test(m);
const isXlsxMime = (m = "") => /(sheet|excel|spreadsheetml)/i.test(m);

async function rowsFromCSVBuffer(buf: Uint8Array) {
  const text = new TextDecoder().decode(buf);
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, ""));
  const out: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row: string[] = [];
    const s = lines[i];
    let cur = "",
      inQ = false;
    for (let j = 0; j < s.length; j++) {
      const ch = s[j];
      if (ch === '"') {
        if (inQ && s[j + 1] === '"') {
          cur += '"';
          j++;
        } else inQ = !inQ;
      } else if (ch === "," && !inQ) {
        row.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    row.push(cur);
    const obj: any = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] ?? "";
    });
    out.push(obj);
  }
  return out;
}

async function rowsFromXLSXBuffer(buf: Uint8Array) {
  try {
    const mod = await import("exceljs");
    const ExcelJS: any = (mod as any)?.default ?? mod;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const ws = wb.worksheets[0];
    if (!ws) return [];
    const rows: any[] = [];
    const headers: string[] = [];
    ws.getRow(1).eachCell((cell: any, col: number) => {
      headers[col - 1] = String(cell.value ?? "").trim();
    });
    ws.eachRow((row: any, rowNum: number) => {
      if (rowNum === 1) return;
      const obj: any = {};
      headers.forEach((h, idx) => {
        const cell = row.getCell(idx + 1);
        let v = cell?.value;
        if (v && typeof v === "object" && "text" in v) v = (v as any).text;
        obj[h] = v == null ? "" : v;
      });
      rows.push(obj);
    });
    return rows;
  } catch {
    return [];
  }
}

async function parseFirstTabularAttachment(attachments: any[] = []) {
  if (!Array.isArray(attachments) || attachments.length === 0) return null;

  const cand = attachments.find(
    (a) =>
      isCsvName(a?.name) ||
      isXlsxName(a?.name) ||
      isCsvMime(a?.mime || a?.type || "") ||
      isXlsxMime(a?.mime || a?.type || "") ||
      (typeof a?.dataUrl === "string" && /^data:.*;base64,/.test(a.dataUrl)),
  );
  if (!cand) return null;

  let b64 = cand?.bytesB64 as string | undefined;
  let mime = (cand?.mime || cand?.type || "") as string;

  if (!b64 && typeof cand.dataUrl === "string") {
    const m = cand.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (m) {
      mime = mime || m[1] || "";
      b64 = m[2];
    }
  }
  if (!b64) return null;

  const buf = base64ToBytes(b64);
  const name = cand.name || "";

  if (isCsvName(name) || isCsvMime(mime)) {
    const rows = await rowsFromCSVBuffer(buf);
    return { kind: "csv" as const, name: name || "upload.csv", rows };
  }
  if (isXlsxName(name) || isXlsxMime(mime)) {
    const rows = await rowsFromXLSXBuffer(buf);
    return { kind: "xlsx" as const, name: name || "upload.xlsx", rows };
  }

  // if no extension hints, try CSV first
  const asCsv = await rowsFromCSVBuffer(buf);
  if (asCsv?.length)
    return { kind: "csv" as const, name: name || "upload.csv", rows: asCsv };
  const asXlsx = await rowsFromXLSXBuffer(buf);
  if (asXlsx?.length)
    return { kind: "xlsx" as const, name: name || "upload.xlsx", rows: asXlsx };

  return null;
}

// ---- canonicalization for diff ----
const canonicalKeyName = (name: string) => {
  const raw = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  const ALIAS: Record<string, string> = {
    trn: "trn",
    trnnumber: "trn",
    transactionnumber: "trn",
    trnno: "trn",
    trnnum: "trn",
    "trn#": "trn",
    id: "id",
    arn: "arn",
    arnnumber: "arn",
    "arn#": "arn",
    workflowstage: "stage",
    stage: "stage",
    product: "product",
    bookinglocation: "bookinglocation",
    customerreference: "customerref",
    customerref: "customerref",
    submissionmode: "submissionmode",
    regdate: "regdate",
    reldate: "reldate",
    segment: "segment",
    subsegment: "subsegment",
    splitid: "splitid",
    lockedby: "lockedby",
    lli: "lli",
    aml: "aml",
    snc: "snc",
    clbk: "clbk",
    cocoa: "cocoa",
    tdopsapproval: "tdopsapproval",
    customer: "customer",
    counterparty: "counterparty",
    step: "step",
    substep: "substep",
    receivedat: "receivedat",
    __receivedatms: "__receivedatms",
    status: "status", // extra alias if your data uses "status"
  };
  return ALIAS[raw] || raw;
};

const TRACK_EMPTY = new Set([
  "arn",
  "trn",
  "id",
  "customer",
  "counterparty",
  "product",
  "step",
  "substep",
  "lockedby",
  "stage",
  "lli",
  "aml",
  "snc",
  "clbk",
  "cocoa",
  "tdopsapproval",
  "customerref",
  "submissionmode",
  "regdate",
  "reldate",
  "segment",
  "subsegment",
  "splitid",
  "bookinglocation",
  "receivedat",
  "__receivedatms",
  "status",
]);

const normVal = (v: any) => {
  if (v == null) return "";
  if (typeof v === "object") return "";
  let s = String(v).trim();
  if (/^(null|undefined|n\/a|na|nan)$/i.test(s)) s = "";
  return s;
};

const flatten = (row: any) =>
  row && row.base ? { ...row.base, ...row.derived } : row || {};
const canonRowForDiff = (row: any) => {
  const flat = flatten(row);
  const out: any = {};
  for (const [k, v] of Object.entries(flat)) {
    const key = canonicalKeyName(k);
    const val = normVal(v);
    if (!key) continue;
    if (val === "" && !TRACK_EMPTY.has(key)) continue;
    out[key] = val;
  }
  return out;
};
const canonUploadRowForDiff = (row: any) => {
  const canon: any = {};
  const headerByCanon: any = {};
  for (const [k, v] of Object.entries(row || {})) {
    const key = canonicalKeyName(k);
    const val = normVal(v);
    if (!key) continue;
    if (val === "" && !(key === "trn" || key === "id")) continue;
    if (!(key in canon) || canon[key] === "") {
      canon[key] = val;
      headerByCanon[key] = String(k).trim();
    }
  }
  return { canon, headerByCanon };
};
const computeKey = (row: any) => {
  const c = canonRowForDiff(row);
  return c.trn || c.id || "";
};

// default server download link maker (POST /__ai-register → returns /__ai-download/:token URL)
function makeDefaultServerLinkFactory(baseUrl: string): MakeDownloadLinkFn {
  let origin = "";
  try {
    const u = new URL(baseUrl);
    origin = `${u.protocol}//${u.host}`;
  } catch {
    try {
      origin = (typeof window !== "undefined" && window.location?.origin) || "";
    } catch {
      origin = "";
    }
  }
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
        bytesB64: (() => {
          const u8 =
            bytes instanceof Uint8Array
              ? bytes
              : new Uint8Array(bytes as ArrayBuffer);
          let bin = "";
          const chunk = 0x8000;
          for (let i = 0; i < u8.length; i += chunk)
            bin += String.fromCharCode.apply(
              null,
              Array.from(u8.subarray(i, i + chunk)),
            );

          if (typeof btoa !== "undefined") return btoa(bin);
          // Node fallback:
          // @ts-ignore
          return Buffer.from(bin, "binary").toString("base64");
        })(),
      }),
    });
    if (!r.ok) throw new Error(`register failed: ${r.status}`);
    const j = await r.json().catch(() => ({}) as any);
    if (!j?.url) throw new Error("register returned no url");
    return j.url as string;
  };
}

// simple table exports
const tableToCSVBytes = (columns: string[], rows: string[][]) => {
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
};
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

// ---------------- Adapter ----------------
export function makeUploadCompareAdapter(opts: Options): AIAdapter {
  const { baseUrl, endpoints, makeDownloadLink } = opts;
  const linkMaker: MakeDownloadLinkFn =
    makeDownloadLink || makeDefaultServerLinkFactory(baseUrl);

  return {
    async buildMemory() {
      // No extra memory required for upload-compare
      return undefined;
    },

    async augment({ text, messages, context }: AdapterAugmentArgs) {
      const sid = getSid(context, messages);
      const state = getState(sid);
      const q = String(text || "").toLowerCase();

      // ---------------- intent detectors ----------------
      const wantsCompare =
        /\b(compare|diff|difference|what'?s new|what changed|changes?)\b/i.test(
          q,
        );

      const wantsExport =
        /\b(export(?:\s+it)?|download(?:able)?|save|dump|extract|create\s+(?:a\s+)?download(?:able)?\s+file)\b/i.test(
          q,
        );

      // "export all transactions" / "export everything"
      const wantsExportAll =
        /\bexport\b.*\b(all|everything|full)\b.*\b(transactions|rows|data)?\b/i.test(
          q,
        );

      const wantXlsx = /\b(xlsx|excel|spreadsheet)\b/i.test(q);

      const exportUploaded =
        /\b(uploaded file|last upload|the upload|previous upload)\b/i.test(q);

      const impliesFile =
        /\b(file|csv|xlsx|spreadsheet|upload(ed)?|this\s+file|that\s+file)\b/i.test(
          q,
        );
      const hasAttachment =
        Array.isArray(context?.attachments) && context.attachments.length > 0;

      // dataset-only "status per month" for a year range
      const wantsStatusMonthly =
        /\b(status|registered|register|pending)\b.*\bper\s+month\b/i.test(q) ||
        /\btable\b.*\bper\s+month\b.*\b(registered|pending)\b/i.test(q);

      // YoY / dataset-only compare intent (no file required)
      const wantsYoYCompare =
        /\b(yoy|year[-\s]?over[-\s]?year|percentage?\s+(?:change|difference)|compare(?:d)?\s+(?:to|with)\s+(?:last|previous)\s+year|from\s+previous\s+year|vs\.\s*prev(?:ious)?\s*year|increase|decrease)\b/i.test(
          q,
        ) ||
        (wantsCompare &&
          !hasAttachment &&
          /\b(year|annual|20\d{2}|19\d{2})\b/i.test(q));

      // ---------------- 0) EXPORT ALL (dataset) ----------------
      if (wantsExport && wantsExportAll) {
        const allRows = await fetchAll(baseUrl, endpoints);
        if (!allRows.length) {
          return [
            {
              role: "system",
              content: `${EMIT}\n_No data available to export._`,
            },
          ];
        }

        const flat = allRows.map(flatten);
        const headers = Array.from(
          flat.reduce((s, r) => {
            Object.keys(r || {}).forEach((k) => s.add(k));
            return s;
          }, new Set<string>()),
        );

        // to file
        const ts = new Date().toISOString().replace(/[:.]/g, "");
        const filename = `all-transactions-${ts}.${wantXlsx ? "xlsx" : "csv"}`;
        let bytes: Uint8Array;

        if (wantXlsx) {
          try {
            const mod = await import("exceljs");
            const ExcelJS: any = (mod as any)?.default ?? mod;
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet("data");
            // @ts-ignore
            ws.columns = headers.map((h: string) => ({ header: h, key: h }));
            flat.forEach((r) =>
              ws.addRow(
                headers.reduce(
                  (o: any, h: any) => ((o[h] = r[h] ?? ""), o),
                  {},
                ),
              ),
            );
            const buf: ArrayBuffer = await wb.xlsx.writeBuffer();
            bytes = new Uint8Array(buf);
          } catch {
            const esc = (v: unknown) =>
              v == null
                ? ""
                : /[",\n]/.test(String(v))
                  ? `"${String(v).replace(/"/g, '""')}"`
                  : String(v);
            const lines = [headers.join(",")].concat(
              flat.map((r) => headers.map((h) => esc(r[h as any])).join(",")),
            );
            bytes = utf8Encode(lines.join("\n"));
          }
        } else {
          const esc = (v: unknown) =>
            v == null
              ? ""
              : /[",\n]/.test(String(v))
                ? `"${String(v).replace(/"/g, '""')}"`
                : String(v);
          const lines = [headers.join(",")].concat(
            flat.map((r) => headers.map((h) => esc(r[h as any])).join(",")),
          );
          bytes = utf8Encode(lines.join("\n"));
        }

        const mime = wantXlsx
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "text/csv;charset=utf-8";

        let href = "";
        try {
          href = await linkMaker(bytes, filename, mime, 10 * 60 * 1000);
        } catch {}
        if (!href) href = toDataUrl(mime, bytes, 2_000_000) || "";

        if (href) {
          return [
            {
              role: "system",
              content: `${EMIT}\n📎 Download: [${filename}](${href})`,
            },
          ];
        } else {
          return [
            {
              role: "system",
              content: `${EMIT}\nFile too large to inline. Ask the user to narrow the export (e.g., “export all transactions for 2023”, “export TRN + stage only”, “last 90 days”).`,
            },
          ];
        }
      }

      // ---------------- 1) STATUS PER MONTH (dataset) ----------------
      if (wantsStatusMonthly) {
        // Year range: "2020-2021", "for 2020 to 2021", etc.
        let yStart: number | null = null,
          yEnd: number | null = null;
        const mRange = q.match(/\b(19|20)\d{2}\s*[-to–—]\s*(19|20)\d{2}\b/);
        if (mRange) {
          const nums = mRange[0].match(/(19|20)\d{2}/g)?.map(Number) || [];
          if (nums.length >= 2) {
            yStart = Math.min(nums[0], nums[1]);
            yEnd = Math.max(nums[0], nums[1]);
          }
        }
        if (yStart == null || yEnd == null) {
          const mOne = q.match(/\b(19|20)\d{2}\b/g);
          if (mOne?.length === 2) {
            yStart = Math.min(+mOne[0], +mOne[1]);
            yEnd = Math.max(+mOne[0], +mOne[1]);
          } else if (mOne?.length === 1) {
            yStart = +mOne[0];
            yEnd = +mOne[0];
          }
        }
        if (yStart == null || yEnd == null) {
          // default to last 24 months if not specified
          const now = new Date();
          yEnd = now.getUTCFullYear();
          yStart = yEnd - 1;
        }

        const sinceMs = Date.parse(`${yStart}-01-01T00:00:00Z`);
        const untilMs = Date.parse(`${yEnd}-12-31T23:59:59.999Z`);
        const baseRows = await fetchRowsForRangeStrict(baseUrl, endpoints, {
          sinceMs,
          untilMs,
          label: `${yStart}-${yEnd}`,
        });

        // Bucket by (year, month). Decide registered/pending from "stage" or "status"
        const buckets = new Map<
          string,
          { y: number; m: number; total: number; reg: number; pend: number }
        >();
        for (const r of baseRows) {
          const flat = flatten(r);
          const ms =
            typeof r?.__receivedAtMs === "number"
              ? r.__receivedAtMs
              : typeof r?.base?.__receivedAtMs === "number"
                ? r.base.__receivedAtMs
                : Date.parse(flat.receivedAt || "");
          if (!Number.isFinite(ms)) continue;
          const dt = new Date(ms);
          const y = dt.getUTCFullYear();
          const m = dt.getUTCMonth();
          if (y < yStart || y > yEnd) continue;

          const key = `${y}-${pad2(m + 1)}`;
          const cur = buckets.get(key) || { y, m, total: 0, reg: 0, pend: 0 };
          cur.total += 1;

          // canonical stage/status
          const stage = String(flat.stage ?? flat.status ?? "").toLowerCase();
          if (/^reg/.test(stage)) cur.reg += 1;
          else if (/^pend/.test(stage)) cur.pend += 1;

          buckets.set(key, cur);
        }

        const keys = Array.from(buckets.values()).sort((a, b) =>
          a.y === b.y ? a.m - b.m : a.y - b.y,
        );
        const columns = [
          "Month",
          "Total Transactions",
          "Registered",
          "Pending",
        ];
        const rows: string[][] = [];
        let sumT = 0,
          sumR = 0,
          sumP = 0;

        for (const it of keys) {
          rows.push([
            `${monthName(it.m)} ${it.y}`,
            String(it.total),
            String(it.reg),
            String(it.pend),
          ]);
          sumT += it.total;
          sumR += it.reg;
          sumP += it.pend;
        }
        if (rows.length)
          rows.push(["Total", String(sumT), String(sumR), String(sumP)]);

        // persist for “export it”
        setState(sid, {
          lastAggregation: {
            columns,
            rows,
            meta: { name: "status-monthly", years: `${yStart}-${yEnd}` },
          },
        });

        const md = [
          `**Status per Month — ${yStart}${yStart === yEnd ? "" : `–${yEnd}`}**`,
          "",
          rows.map((r) => r.join("\t")).join("\n"),
        ].join("\n");

        return [{ role: "system", content: `${EMIT}\n${md}` }];
      }

      // ---------------- 2) YOY (dataset) ----------------
      if (wantsYoYCompare) {
        const allRows = await fetchAll(baseUrl, endpoints);
        if (!allRows.length) {
          return [
            {
              role: "system",
              content: `${EMIT}\n_No data available for YoY._`,
            },
          ];
        }

        // Build counts per year (UTC)
        const byYear = new Map<number, number>();
        for (const r of allRows) {
          const ms =
            typeof r?.__receivedAtMs === "number"
              ? r.__receivedAtMs
              : typeof r?.base?.__receivedAtMs === "number"
                ? r.base.__receivedAtMs
                : Date.parse(r?.receivedAt || r?.base?.receivedAt || "");
          if (!Number.isFinite(ms)) continue;
          const y = new Date(ms).getUTCFullYear();
          byYear.set(y, (byYear.get(y) || 0) + 1);
        }
        const years = Array.from(byYear.keys()).sort((a, b) => a - b);
        if (years.length < 2) {
          return [
            {
              role: "system",
              content: `${EMIT}\n_Not enough history to compute year-over-year._`,
            },
          ];
        }
        const total = Array.from(byYear.values()).reduce((a, b) => a + b, 0);

        // Build rows: Year | Count | % of Total | YoY % Change
        const aggCols = ["Year", "Count", "% of Total", "YoY % Change"];
        const aggRows: string[][] = [];
        const pct = (n: number, d: number) =>
          !d ? "0.0%" : `${((n / d) * 100).toFixed(1)}%`;
        const pctChange = (curr: number, prev: number) =>
          !prev
            ? "—"
            : `${curr >= prev ? "+" : ""}${(((curr - prev) / prev) * 100).toFixed(1)}%`;

        for (let i = 0; i < years.length; i++) {
          const y = years[i];
          const c = byYear.get(y) || 0;
          const pY = years[i - 1];
          const pC = typeof pY === "number" ? byYear.get(pY) || 0 : 0;
          aggRows.push([String(y), String(c), pct(c, total), pctChange(c, pC)]);
        }

        setState(sid, {
          lastAggregation: {
            columns: aggCols,
            rows: aggRows,
            meta: { name: "yoy" },
          },
        });

        const lines = [
          "**Year-over-Year change (all data)**",
          `Total: ${total.toLocaleString()} transactions`,
          "",
          ...aggRows.map(([y, c, share, yoy]) => {
            const m = /^([+-]\d+(?:\.\d+)?)%$/.exec(yoy || "");
            const v = m ? parseFloat(m[1]) : NaN;
            const trend = Number.isFinite(v)
              ? v > 0
                ? "↑"
                : v < 0
                  ? "↓"
                  : "→"
              : "•";
            return `- **${y}** — ${c} (${share}) • YoY: ${yoy} ${trend}`;
          }),
        ];

        return [{ role: "system", content: `${EMIT}\n${lines.join("\n")}` }];
      }

      // ---------------- 3) FILE-BASED COMPARE ----------------
      if (wantsCompare) {
        // if user clearly meant a file but there is none (and no memory of last upload) → ask
        if (impliesFile && !hasAttachment && !state.lastUpload?.rows?.length) {
          const md =
            "Please attach a CSV/XLSX to compare.\n- compare this to last month\n- diff this file vs 2024\n- show what’s new by TRN";
          return [{ role: "system", content: `${EMIT}\n${md}` }];
        }

        // Parse now (or fallback to last upload)
        let upload = hasAttachment
          ? await parseFirstTabularAttachment(context.attachments)
          : null;
        if (!upload) {
          const prev = getState(sid).lastUpload;
          if (prev?.rows?.length) {
            upload = {
              kind: prev.kind,
              name: prev.name,
              rows: prev.rows,
            } as any;
          }
        }
        if (
          !upload ||
          !Array.isArray(upload.rows) ||
          upload.rows.length === 0
        ) {
          const md =
            "Please attach a CSV/XLSX to compare.\n- compare this to last month\n- diff this file vs 2024\n- show what’s new by TRN";
          return [{ role: "system", content: `${EMIT}\n${md}` }];
        }

        // Persist upload meta
        const headersOriginal = upload.rows[0]
          ? Object.keys(upload.rows[0])
          : [];
        const headersCanon = headersOriginal.map((h) => canonicalKeyName(h));
        setState(sid, {
          lastUpload: {
            name: upload.name,
            kind: upload.kind,
            rows: upload.rows,
            headersOriginal,
            headersCanon,
          },
        });

        // Optional absolute/month-name ranges
        const mAbs = q.match(
          /\b(between|from)\s+(\d{4}-\d{2}-\d{2})\s+(?:and|to|-)\s*(\d{4}-\d{2}-\d{2})\b/i,
        );
        let picked: Range | null = null;
        if (mAbs) {
          const sinceMs = Date.parse(`${mAbs[2]}T00:00:00Z`);
          const untilMs = Date.parse(`${mAbs[3]}T23:59:59.999Z`);
          if (Number.isFinite(sinceMs) && Number.isFinite(untilMs)) {
            picked = { sinceMs, untilMs, label: `${mAbs[2]} to ${mAbs[3]}` };
          }
        }
        if (!picked) {
          const dash = "[-–—]";
          const month =
            "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
          const re = new RegExp(
            `\\b(?:between|from)\\s+${month}\\s*(?:${dash}|to|and)\\s*${month}(?:\\s+(20\\d{2}|19\\d{2}))?\\b`,
            "i",
          );
          const m = q.match(re);
          if (m) {
            const yr = m[3] ? Number(m[3]) : new Date().getUTCFullYear();
            const sIdx = monthIndex(m[1]!);
            const eIdx = monthIndex(m[2]!);
            if (sIdx != null && eIdx != null) {
              const sinceMs = Date.parse(
                `${yr}-${pad2(sIdx + 1)}-01T00:00:00Z`,
              );
              const lastDay = new Date(Date.UTC(yr, eIdx + 1, 0)).getUTCDate();
              const untilMs = Date.parse(
                `${yr}-${pad2(eIdx + 1)}-${pad2(lastDay)}T23:59:59.999Z`,
              );
              picked = { sinceMs, untilMs, label: `${m[1]}-${m[2]} ${yr}` };
            }
          }
        }

        const baseRows = picked
          ? await fetchRowsForRangeStrict(baseUrl, endpoints, picked)
          : await fetchAll(baseUrl, endpoints);

        // Canonical maps
        const baseCanonMap = new Map<string, any>();
        for (const r of baseRows) {
          const k = computeKey(r);
          if (!k) continue;
          baseCanonMap.set(String(k), canonRowForDiff(r));
        }
        const upCanonMap = new Map<string, any>();
        const upHeaderByCanon = new Map<string, Record<string, string>>();
        for (const r of upload.rows) {
          const { canon, headerByCanon } = canonUploadRowForDiff(r);
          const k = canon.trn || canon.id || "";
          if (!k) continue;
          upCanonMap.set(String(k), canon);
          upHeaderByCanon.set(String(k), headerByCanon);
        }

        const newKeys: string[] = [];
        const removedKeys: string[] = [];
        const commonKeys: string[] = [];
        for (const k of upCanonMap.keys())
          (baseCanonMap.has(k) ? commonKeys : newKeys).push(k);
        for (const k of baseCanonMap.keys())
          if (!upCanonMap.has(k)) removedKeys.push(k);

        const byKeyUpdates = new Map<
          string,
          {
            changes: Array<{ label: string; before: string; after: string }>;
            newColCount: number;
          }
        >();
        for (const k of commonKeys) {
          const base = baseCanonMap.get(k) || {};
          const up = upCanonMap.get(k) || {};
          const hdrs = upHeaderByCanon.get(k) || {};
          const a = new Set(
            Object.keys(base).filter((f) => f !== "trn" && f !== "id"),
          );
          const b = new Set(
            Object.keys(up).filter((f) => f !== "trn" && f !== "id"),
          );
          const changes: Array<{
            label: string;
            before: string;
            after: string;
          }> = [];
          let newColCount = 0;
          for (const f of a) {
            if (!b.has(f)) continue;
            const before = normVal(base[f]);
            const after = normVal(up[f]);
            if (before === after) continue;
            const label =
              hdrs[f] ||
              (f === "customerref"
                ? "CUSTOMER REFERENCE"
                : f === "submissionmode"
                  ? "SUBMISSION MODE"
                  : f === "bookinglocation"
                    ? "BOOKING LOCATION"
                    : f === "regdate"
                      ? "REG. DATE"
                      : f === "reldate"
                        ? "REL. DATE"
                        : f === "stage"
                          ? "STAGE"
                          : f.toUpperCase());
            changes.push({
              label,
              before: String(before ?? ""),
              after: String(after ?? ""),
            });
          }
          for (const f of b) {
            if (a.has(f)) continue;
            const after = normVal(up[f]);
            if (after !== "") newColCount++;
          }
          if (changes.length || newColCount)
            byKeyUpdates.set(k, { changes, newColCount });
        }

        // Build sections
        const filename =
          upload.name || (upload.kind === "csv" ? "upload.csv" : "upload.xlsx");
        const headerTitle = `**Comparison —** **${filename}**`;
        const headerLines = [
          `Uploaded rows: ${upload.rows.length}`,
          `Baseline rows: ${baseRows.length} (our current data)`,
          picked?.label ? `Baseline scope: ${picked.label}` : ``,
        ]
          .filter(Boolean)
          .join("\n");

        const updatedKeys = Array.from(byKeyUpdates.keys());
        const MAX_UPDATED_KEYS = 5;
        const showUpdated = updatedKeys.slice(0, MAX_UPDATED_KEYS);
        const moreUpdated = Math.max(
          0,
          updatedKeys.length - showUpdated.length,
        );

        const updatedSection = showUpdated.length
          ? [
              `**Updated**`,
              ...showUpdated.map((k) => {
                const entry = byKeyUpdates.get(k)!;
                const lines = [`- 🟨 **${k}**`];
                entry.changes.forEach((it) =>
                  lines.push(
                    `  - ${chip(it.label)}: ${oldVal(showVal(it.before))} ${arrow()} ${newVal(showVal(it.after))}`,
                  ),
                );
                if (entry.newColCount > 0)
                  lines.push(
                    `  - + ${entry.newColCount} newly populated field(s)`,
                  );
                return lines.join("\n");
              }),
              moreUpdated
                ? `…**${moreUpdated}** more transaction(s) with updates`
                : ``,
            ]
              .filter(Boolean)
              .join("\n")
          : ``;

        const MAX_NEWS = 10;
        const newSection = newKeys.length
          ? [
              `**New**`,
              ...newKeys.slice(0, MAX_NEWS).map((k) => `- 🟩 **${k}**`),
              Math.max(0, newKeys.length - MAX_NEWS)
                ? `…${Math.max(0, newKeys.length - MAX_NEWS)} more`
                : ``,
            ].join("\n")
          : ``;

        const MAX_DELETED = 10;
        const deletedSection = removedKeys.length
          ? [
              `**Deleted**`,
              ...removedKeys.slice(0, MAX_DELETED).map((k) => `- 🟥 **${k}**`),
              Math.max(0, removedKeys.length - MAX_DELETED)
                ? `…${Math.max(0, removedKeys.length - MAX_DELETED)} more`
                : ``,
            ].join("\n")
          : ``;

        // Quick take
        const totalUpdatedTrns = updatedKeys.length;
        const totalNewTrns = newKeys.length;
        const totalDeletedTrns = removedKeys.length;
        const totalFieldChanges = updatedKeys.reduce(
          (acc, k) => acc + (byKeyUpdates.get(k)?.changes || []).length,
          0,
        );
        const totalNewlyPopulated = updatedKeys.reduce(
          (acc, k) => acc + (byKeyUpdates.get(k)?.newColCount || 0),
          0,
        );
        const fieldCounts = new Map<string, number>();
        for (const k of updatedKeys) {
          for (const ch of byKeyUpdates.get(k)?.changes || []) {
            fieldCounts.set(ch.label, (fieldCounts.get(ch.label) || 0) + 1);
          }
        }
        const topFields = Array.from(fieldCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([label, n]) => `${label} (${n})`)
          .join(", ");

        const quickBits: string[] = [];
        const plural = (n: number, s: string, p = s + "s") => (n === 1 ? s : p);
        quickBits.push(
          `${totalUpdatedTrns} ${plural(totalUpdatedTrns, "updated TRN")}`,
        );
        if (totalFieldChanges)
          quickBits.push(
            `${totalFieldChanges} ${plural(totalFieldChanges, "field change")}`,
          );
        if (totalNewlyPopulated)
          quickBits.push(
            `${totalNewlyPopulated} newly populated ${plural(totalNewlyPopulated, "field")}`,
          );
        if (totalNewTrns)
          quickBits.push(`${totalNewTrns} ${plural(totalNewTrns, "new TRN")}`);
        if (totalDeletedTrns)
          quickBits.push(
            `${totalDeletedTrns} ${plural(totalDeletedTrns, "deleted TRN")}`,
          );
        const quickTake =
          totalUpdatedTrns || totalNewTrns || totalDeletedTrns
            ? `**Quick take:** ${quickBits.join(" • ")}.` +
              (topFields ? ` Top fields: ${topFields}.` : "")
            : `_No differences detected vs baseline._`;

        // Persist aggregation for “export it”
        const aggRows: string[][] = [];
        for (const k of updatedKeys) {
          const entry = byKeyUpdates.get(k)!;
          entry.changes.forEach((it) =>
            aggRows.push([
              "UPDATED",
              k,
              it.label,
              String(it.before ?? ""),
              String(it.after ?? ""),
            ]),
          );
          if (entry.newColCount > 0) {
            aggRows.push([
              "NEW_COLUMNS_SUMMARY",
              k,
              "Count",
              "",
              String(entry.newColCount),
            ]);
          }
        }
        for (const k of newKeys) aggRows.push(["NEW", k, "", "", ""]);
        for (const k of removedKeys) aggRows.push(["DELETED", k, "", "", ""]);
        setState(sid, {
          lastAggregation: {
            columns: [
              "ChangeType",
              "TRN",
              "Field",
              "Before (baseline)",
              "After (upload)",
            ],
            rows: aggRows,
            meta: { name: "diff", filename },
          },
        });

        const finalMd = [
          headerTitle,
          headerLines,
          updatedSection,
          newSection,
          deletedSection,
          quickTake,
        ]
          .filter(Boolean)
          .join("\n\n");

        return [{ role: "system", content: `${EMIT}\n${finalMd}` }];
      }

      // ---------------- 4) EXPORTS owned by upload-compare ----------------
      if (wantsExport) {
        // a) “export uploaded …”
        if (exportUploaded && state.lastUpload?.rows?.length) {
          const lastUpload = state.lastUpload!;
          const headersOrder = lastUpload.headersOriginal?.length
            ? lastUpload.headersOriginal
            : Object.keys(lastUpload.rows[0] || {});
          const ts = new Date().toISOString().replace(/[:.]/g, "");
          const filenameBase = (lastUpload.name || "upload").replace(
            /\.(csv|xlsx)$/i,
            "",
          );
          const filename = `uploaded-${slug(filenameBase)}-${ts}.${wantXlsx ? "xlsx" : "csv"}`;

          const flat = lastUpload.rows.map(flatten);
          let bytes: Uint8Array;

          if (wantXlsx) {
            try {
              const mod = await import("exceljs");
              const ExcelJS: any = (mod as any)?.default ?? mod;
              const wb = new ExcelJS.Workbook();
              const ws = wb.addWorksheet("data");
              // @ts-ignore
              ws.columns = headersOrder.map((h: string) => ({
                header: h,
                key: h,
              }));
              flat.forEach((r) =>
                ws.addRow(
                  headersOrder.reduce(
                    (o: any, h: string) => ((o[h] = r[h]), o),
                    {},
                  ),
                ),
              );
              const buf: ArrayBuffer = await wb.xlsx.writeBuffer();
              bytes = new Uint8Array(buf);
            } catch {
              const esc = (v: unknown) =>
                v == null
                  ? ""
                  : /[",\n]/.test(String(v))
                    ? `"${String(v).replace(/"/g, '""')}"`
                    : String(v);
              const lines = [headersOrder.join(",")].concat(
                flat.map((r) => headersOrder.map((h) => esc(r[h])).join(",")),
              );
              bytes = utf8Encode(lines.join("\n"));
            }
          } else {
            const esc = (v: unknown) =>
              v == null
                ? ""
                : /[",\n]/.test(String(v))
                  ? `"${String(v).replace(/"/g, '""')}"`
                  : String(v);
            const lines = [headersOrder.join(",")].concat(
              flat.map((r) => headersOrder.map((h) => esc(r[h])).join(",")),
            );
            bytes = utf8Encode(lines.join("\n"));
          }

          const mime = wantXlsx
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "text/csv;charset=utf-8";

          let href = "";
          try {
            href = await linkMaker(bytes, filename, mime, 10 * 60 * 1000);
          } catch {}
          if (!href) href = toDataUrl(mime, bytes, 2_000_000) || "";

          if (href) {
            return [
              {
                role: "system",
                content: `${EMIT}\n📎 Download: [${filename}](${href})`,
              },
            ];
          } else {
            return [
              {
                role: "system",
                content: `${EMIT}\nFile too large to inline. Ask the user to narrow; give 3 examples.`,
              },
            ];
          }
        }

        // b) “export it” for the last comparison/aggregation
        const lastAgg = state.lastAggregation;
        if (lastAgg?.columns && lastAgg?.rows) {
          const ts = new Date().toISOString().replace(/[:.]/g, "");
          const inferred = lastAgg?.meta?.name || "aggregation";
          const baseName = lastAgg?.meta?.filename
            ? slug(lastAgg.meta.filename.replace(/\.(csv|xlsx)$/i, ""))
            : "upload-compare";
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
            return [
              {
                role: "system",
                content: `${EMIT}\n📎 Download: [${filename}](${href})`,
              },
            ];
          } else {
            return [
              {
                role: "system",
                content: `${EMIT}\nFile too large to inline. Ask the user to narrow the export; give 3 concrete examples.`,
              },
            ];
          }
        }
      }

      // Not handled by this adapter → let the next adapter try
      return [];
    },
  };
}
