// src/common/server/ai/tabularPlugin.js

/**
 * makeTabularPlugin — reusable plugin factory for “table-like” datasets.
 *
 * Features:
 * - ALWAYS deep-fetches for absolute ranges, year spans, month names, relative phrases, and top-N.
 * - Optional alwaysDeepFetchAll: true forces full-dataset availability every turn (prevents 50-row fallback).
 * - Returns DEEP_FETCH_JSON with totals, perYear counts, status mix, and a latest sample (preview only).
 * - Strong guardrails: when DEEP_FETCH_JSON is present, the model must NOT claim “no access”.
 */

export function makeTabularPlugin(options) {
  const {
    baseUrl,
    endpoints,            // { list: "/workdesk", full: "/workdesk/full", byKey: (id) => `/txn/${id}` }
    memory,               // { datasetName, itemSingular, itemPlural, synonyms }
    shape,                // { timestampAccessor(row), statusAccessor(row), keyAccessor(row) }
    facets = [],          // optional facets: ["product", (r)=>r.bookingLocation, ...]
    alwaysDeepFetchAll = true, // <- important: ensures full dataset context on every turn
    hotsetLimit,
    scopeGuard = "soft",        // "off" | "soft" | "hard"  (default soft)
    allowSmalltalk = true,      // hello/thanks/good morning/etc
    allowGeneric = true,        // "what can you do", "help", "reset", etc
    outOfScopeMessage,
  } = options;

  const HOTSET_LIMIT =
    Number.isFinite(hotsetLimit) ? hotsetLimit
    : Number.isFinite(memory?.hotsetLimit) ? memory.hotsetLimit
    : 0;

  function isSmalltalk(q) {
    return /\b(hi|hello|hey|thanks|thank you|good (morning|afternoon|evening)|bye|see you|yo|sup)\b/i.test(q);
  }
  function isGenericAssistantQuery(q) {
    return /\b(what can you do|help|commands|capabilities|examples|clear chat|reset|start over|how do i use|who are you)\b/i.test(q);
  }

  // ---- tiny helpers ----
  const DAY = 24 * 60 * 60 * 1000;
  const startOfDay = (ms) => {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const timestampAccessor = (row) =>
    typeof row?.__receivedAtMs === "number"
      ? row.__receivedAtMs
      : typeof row?.base?.__receivedAtMs === "number"
      ? row.base.__receivedAtMs
      : Date.parse(row?.receivedAt || row?.base?.receivedAt || "");

  const computeStatus = (row) => {
    const f = flatten(row);
    if (shape?.statusAccessor) return shape.statusAccessor(f);
    const ws = f?.workflowStage || "";
    return /Initiated/i.test(ws) ? "PENDING" : "REGISTERED";
  };

  const keyAccessor = (row) =>
    shape?.keyAccessor ? shape.keyAccessor(flatten(row)) : rfield(row, "id");

  const flatten = (row) =>
    row && row.base ? { ...row.base, ...row.derived } : row || {};

  const rfield = (row, k) => {
    if (!row) return undefined;
    if (k in row) return row[k];
    if (row.base && k in row.base) return row.base[k];
    return undefined;
  };

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
    // IMPORTANT: force limit=0 to get ALL rows
    const fullBase = `${baseUrl}${endpoints.full}`;
    const sep = fullBase.includes("?") ? "&" : "?";
    const url = `${fullBase}${sep}limit=0`;
    const payload = await fetchJson(url);
    return Array.isArray(payload?.rows) ? payload.rows : [];
  }

  async function deepFetchLatestN(n) {
    const url = `${baseUrl}${endpoints.list}?limit=${n}&sortBy=receivedAt&order=desc`;
    const payload = await fetchJson(url);
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    return present("latestN", rows, { request: { n } });
  }

  async function deepFetchOldest() {
    const url = `${baseUrl}${endpoints.list}?limit=1&sortBy=receivedAt&order=asc`;
    const payload = await fetchJson(url);
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    return present("oldest", rows);
  }

  async function deepFetchByKey(key) {
    try {
      const url = `${baseUrl}${endpoints.byKey(key)}`;
      const payload = await fetchJson(url);
      return {
        kind: "DEEP_FETCH",
        intent: "byKey",
        key,
        item: payload,
        DEEP_FETCH_READY: true,
      };
    } catch {
      return { kind: "DEEP_FETCH", intent: "byKey", key, error: "not_found", DEEP_FETCH_READY: true };
    }
  }

  async function deepFetchRange(range = {}) {
    // Force full results for the range (server supports sinceMs/untilMs)
    const fullBase = `${baseUrl}${endpoints.full}`;
    const sep = fullBase.includes("?") ? "&" : "?";
    const qs = [`limit=0`];
    if (Number.isFinite(range.sinceMs)) qs.push(`sinceMs=${range.sinceMs}`);
    if (Number.isFinite(range.untilMs)) qs.push(`untilMs=${range.untilMs}`);
    const url = `${fullBase}${sep}${qs.join("&")}`;

    const all = (await fetchJson(url))?.rows ?? [];
    const rows = [...all].sort(
      (a, b) => (timestampAccessor(b) || 0) - (timestampAccessor(a) || 0),
    );
    return present("range", rows, { range });
  }

  function present(intent, rows, extra = {}) {
    const flatRows = rows.map(flatten);
    const tally = (pick) => {
      const map = new Map();
      for (const r of flatRows) {
        const k = pick(r);
        if (!k && k !== 0) continue;
        map.set(k, (map.get(k) || 0) + 1);
      }
      return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    };

    // Per-year counts (UTC)
    const perYear = tally((r) => {
      const ms = timestampAccessor(r);
      if (!Number.isFinite(ms)) return undefined;
      return new Date(ms).getUTCFullYear();
    });

    // Status mix
    const statusMix = tally((r) => computeStatus(r));

    // Optional facets (top 12 per facet)
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

    return {
      kind: "DEEP_FETCH",
      intent,
      totals: { count: flatRows.length },
      perYear,
      statusMix,
      facets: facetResults,
      latestSample, // preview only; all counts above are for *all* rows used
      ...extra,
      DEEP_FETCH_READY: true,
    };
  }

  // ---------- parsing ----------
  const toUserText = (messages) => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m?.role === "user" && typeof m?.content === "string") return m.content;
    }
    return "";
  };

  function parseTopN(q) {
    const mTop = q.match(/\b(top|latest)\s+(\d{1,4})\b/i);
    if (mTop) return { n: Math.max(1, Math.min(2000, Number(mTop[2]))) };
    const mAny = q.match(/\b(\d{1,4})\s+(transactions?|rows|records|entries|txns?)\b/i);
    if (mAny) return { n: Math.max(1, Math.min(2000, Number(mAny[1]))) };
    if (/\blatest\s+(transaction|row|record|entry|txn)\b/i.test(q)) return { n: 1 };
    return null;
  }

  function parseAbsoluteDateRange(q) {
    // between 2022-01-01 and 2022-12-31
    const m = q.match(/\b(between|from)\s+(\d{4}-\d{2}-\d{2})\s+(?:and|to|-)\s+(\d{4}-\d{2}-\d{2})\b/i);
    if (m) {
      const sinceMs = Date.parse(`${m[2]}T00:00:00Z`);
      const untilMs = Date.parse(`${m[3]}T23:59:59Z`);
      if (Number.isFinite(sinceMs) && Number.isFinite(untilMs)) {
        return { sinceMs, untilMs, label: `${m[2]} to ${m[3]}` };
      }
    }
    // on 2022-11-03
    const m2 = q.match(/\bon\s+(\d{4}-\d{2}-\d{2})\b/i);
    if (m2) {
      const d0 = startOfDay(Date.parse(`${m2[1]}T00:00:00Z`));
      if (Number.isFinite(d0)) {
        return { sinceMs: d0, untilMs: d0 + DAY - 1, label: `on ${m2[1]}` };
      }
    }
    return null;
  }

  // ⬇️ make year-span and month-span parsing accept hyphen/en-dash/em-dash
  function parseYearSpan(q) {
    // 2019-2022 / 2019–2022 / 2019—2022 / "between 2019 and 2022"
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
    // “between august-september”, “Aug–Sep 2021”, “from aug to sep”
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
    const untilMs = Date.parse(`${yr}-${pad2(endIdx + 1)}-${pad2(lastDay)}T23:59:59Z`);
    return { sinceMs, untilMs, label: `${cap(m[1])}-${cap(m[2])} ${yr}` };
  }

  function parseMonthNameSingle(q) {
    // “last september”, “in september” → this year unless “last” is specified & month has already passed rules
    const m = q.match(
      /\b(?:last|in)?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+(20\d{2}|19\d{2}))?\b/i,
    );
    if (!m) return null;
    const monthIdx = monthIndex(m[1]);
    if (monthIdx == null) return null;

    const now = new Date();
    let yr = m[2] ? Number(m[2]) : now.getUTCFullYear();

    if (!m[2] && /\blast\b/i.test(m[0])) {
      // “last September”: choose the closest *previous* occurrence
      const nowMonth = now.getUTCMonth();
      if (monthIdx >= nowMonth) yr = yr - 1;
    }

    const sinceMs = Date.parse(`${yr}-${pad2(monthIdx + 1)}-01T00:00:00Z`);
    const lastDay = new Date(Date.UTC(yr, monthIdx + 1, 0)).getUTCDate();
    const untilMs = Date.parse(`${yr}-${pad2(monthIdx + 1)}-${pad2(lastDay)}T23:59:59Z`);
    return { sinceMs, untilMs, label: `${cap(m[1])} ${yr}` };
  }

  function parseRelativeRange(q) {
    const nowMs = Date.now();
    // last/past N days|weeks|months|years
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
    // previous week/month/year
    const m2 = q.match(/\b(previous|last)\s+(week|month|year)\b/i);
    if (m2) {
      const unit = m2[2].toLowerCase();
      const span = unit === "week" ? 7 * DAY : unit === "month" ? 30 * DAY : 365 * DAY;
      return { sinceMs: nowMs - span, untilMs: nowMs, label: `last ${unit}` };
    }
    // last 2 weeks / fortnight
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
  const pad2 = (n) => String(n).padStart(2, "0");
  const cap = (s) => s[0].toUpperCase() + s.slice(1).toLowerCase();

    // --- scope guard helpers ---
  function containsAny(haystack, needles = []) {
    const s = String(haystack || "").toLowerCase();
    return needles.some((w) => s.includes(String(w).toLowerCase()));
  }

  function isOnTopic(qRaw) {
    const q = String(qRaw || "");

    // Anything that already matches our intents = on-topic
    if (
      parseTopN(q) ||
      parseAbsoluteDateRange(q) ||
      parseYearSpan(q) ||
      parseYearOnly(q) ||
      parseMonthNameRange(q) ||
      parseMonthNameSingle(q) ||
      parseRelativeRange(q) ||
      /\b(oldest|earliest|first|latest)\b/i.test(q) ||
      /\b(SPBTR\d{2}RFC\d{6})\b/i.test(q)
    ) return true;

    // Domain tokens (tweak as needed)
    const tokens = [
      memory?.datasetName || "workdesk",
      memory?.itemSingular || "transaction",
      ...(memory?.synonyms || []),
      "trn","arn","receivedat","workflow","status","booking","location",
      "product","eif","iif","suf","submission","counterparty","customer",
      "split","exceptions","sustainable","documents","rows","records","entries","dataset"
    ];
    return containsAny(q, tokens);
  }

  // Returns a message string when OUT of scope; null when OK
  function scopeCheck({ text, messages } = {}) {
  const guardMode =
    scopeGuard === "hard" ? "hard" :
    scopeGuard ? "soft" : "off";

  if (guardMode === "off") return null;
    const userText =
      (text && String(text)) ||
      (() => {
        for (let i = (messages || []).length - 1; i >= 0; i--) {
          const m = messages[i];
          if (m?.role === "user" && typeof m?.content === "string") return m.content;
        }
        return "";
      })();

    if (
      isOnTopic(userText) ||
      (allowSmalltalk && isSmalltalk(userText)) ||
      (allowGeneric && isGenericAssistantQuery(userText))
    ) {
      return null; // allow it
    }

    const ds = memory?.datasetName || "this dataset";
    const plural = memory?.itemPlural || "items";
    return guardMode === "hard"
      ? (outOfScopeMessage ||
         `I'm focused on ${ds}. Please ask about its ${plural} (e.g., counts, date ranges, latest/oldest, or TRN details).`)
      : null; // soft mode: do not block, just let it pass
  }

  // ---------- public plugin surface ----------
  return {
    scopeCheck,
    // Memory system prompt with tiny snapshot + hotset preview (safe to keep small)
    async buildMemory() {
      const ds = memory?.datasetName ?? "Dataset";
      const singular = memory?.itemSingular ?? "item";
      const plural = memory?.itemPlural ?? "items";
      const synonyms = memory?.synonyms ?? [];

      const hotset = await fetchHotset(HOTSET_LIMIT);

      // quick 7/30/today from hotset only (just for flavor)
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
          status: /Initiated/i.test(r?.workflowStage ?? r?.base?.workflowStage ?? "") ? "PENDING" : "REGISTERED",
          trn: r?.trn ?? r?.base?.trn,
          product: r?.product ?? r?.base?.product,
          bookingLocation: r?.bookingLocation ?? r?.base?.bookingLocation,
          workflowStage: r?.workflowStage ?? r?.base?.workflowStage,
        })),
        notes: {
          latestDefinition: "Latest = max timestampMs (most recent receivedAt)",
          hotsetLimit: HOTSET_LIMIT,
        },
      };

      return {
        role: "system",
        content:
          `You are the ${ds} Assistant. Treat each ${singular} synonymously with ${[plural, ...synonyms].join(", ")}.\n` +
          `Use MEMORY_JSON for context. For counts/ranges/top-N the server will provide DEEP_FETCH_JSON.\n\n` +
          `MEMORY_JSON:\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``,
      };
    },

    // Augment each turn with precise data based on intent
    async augment({ text, messages }) {
      const qRaw = (text || toUserText(messages) || "").trim();
      const q = qRaw.toLowerCase();
      const systems = [];

      // Find specific key (TRN-like) if present
      const keyMatch = qRaw.match(/\b(SPBTR\d{2}RFC\d{6})\b/i);
      if (keyMatch) {
        const deep = await deepFetchByKey(keyMatch[1]);
        systems.push({
          role: "system",
          content:
            `You have details for key ${keyMatch[1]}. Answer from DEEP_FETCH_JSON.\n` +
            `DEEP_FETCH_JSON:\n\`\`\`json\n${JSON.stringify(deep)}\n\`\`\``,
        });
        return systems;
      }

      // Top / latest N
      const top = parseTopN(q);
      if (top) {
        const deep = await deepFetchLatestN(top.n);
        systems.push({
          role: "system",
          content:
            `You have the latest ${deep.totals.count} ${memory?.itemPlural ?? "items"} from backend.\n` +
            `Use DEEP_FETCH_JSON directly. If fields are missing, say "unknown".\n` +
            `DEEP_FETCH_JSON:\n\`\`\`json\n${JSON.stringify(deep)}\n\`\`\``,
        });
        return systems;
      }

      // Oldest / earliest / first
      if (/\b(oldest|earliest|first)\b/i.test(q)) {
        const deep = await deepFetchOldest();
        systems.push({
          role: "system",
          content:
            `You have the single oldest ${memory?.itemSingular ?? 'item'}. ` +
            `Answer directly from DEEP_FETCH_JSON.\n\n` +
            `DEEP_FETCH_JSON:\n\`\`\`json\n${JSON.stringify(deep)}\n\`\`\``,
        });
        return systems;
      }

      // Date range parsing — prioritize specificity
      const abs = parseAbsoluteDateRange(q);
      const span = parseYearSpan(q);
      const yearOnly = parseYearOnly(q);
      const monRange = parseMonthNameRange(q);
      const monSingle = parseMonthNameSingle(q);
      const rel = parseRelativeRange(q);

      const picked = abs || span || yearOnly || monRange || monSingle || rel;

      if (picked) {
        const deep = await deepFetchRange(picked);
        systems.push({
          role: "system",
          content:
            `You have exact data for ${picked.label}. Use DEEP_FETCH_JSON totals/mix/perYear for numbers.\n` +
            `If the user compares multiple overlapping ranges, explain that overlapping windows are not additive.\n` +
            `NEVER claim missing access while DEEP_FETCH_JSON is present.\n\n` +
            `DEEP_FETCH_JSON:\n\`\`\`json\n${JSON.stringify(deep)}\n\`\`\``,
        });
        return systems;
      }

      // No specific intent → optionally deep-fetch EVERYTHING so the model never falls back to “50”
      if (alwaysDeepFetchAll) {
        const rows = await fetchAll();
        const deep = present("all", rows);
        systems.push({
          role: "system",
          content:
            `You have the full dataset. Use DEEP_FETCH_JSON for totals and mixes. ` +
            `NEVER say you lack access when DEEP_FETCH_JSON is present.\n\n` +
            `DEEP_FETCH_JSON:\n\`\`\`json\n${JSON.stringify(deep)}\n\`\`\``,
        });
      }

      return systems;
    },
  };
}
