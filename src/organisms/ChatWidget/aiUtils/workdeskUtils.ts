// src/organisms/ChatWidget/server/workdeskUtils.ts
// Utilities for Workdesk stats + seeding

export type WorkdeskFullRow = {
  base: {
    bookingLocation: string;
    product: string;
    submissionMode: string;
    workflowStage: string;
    receivedAt?: string;
    __receivedAtMs?: number;
  };
  derived?: { status?: string };
};

// Lightweight helpers + stats builder (talks in "transactions")
export type FullRow = {
  base: {
    bookingLocation: string;
    product: string;
    submissionMode: string;
    workflowStage: string;
    receivedAt?: string;
    __receivedAtMs?: number;
    trn?: string;
  };
  derived?: { status?: string };
};

const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const daysAgoMs = (n: number) => Date.now() - n * 24 * 60 * 60 * 1000;

export const TERMINOLOGY = {
  dataset: "Workdesk",
  itemSingular: "transaction",
  itemPlural: "transactions",
  synonyms: ["row", "record", "entry", "txn"],
  idField: "base.trn",
  timestampField: "base.__receivedAtMs",
  orderingHint: "latest = highest __receivedAtMs (most recent receivedAt)",
};

export function summarizeFullWorkdesk(rows: FullRow[]) {
  const toMs = (r: FullRow) =>
    typeof r?.base?.__receivedAtMs === "number"
      ? r.base.__receivedAtMs!
      : Date.parse(r?.base?.receivedAt || "");

  const todayStart = startOfDay(Date.now());
  const ydayStart = todayStart - 24 * 60 * 60 * 1000;
  const last7Start = daysAgoMs(7);
  const last30Start = daysAgoMs(30);

  let today = 0,
    yday = 0,
    last7 = 0,
    last30 = 0;

  const countBy = <T extends string>(
    pick: (r: FullRow) => T | undefined,
    sinceMs?: number,
  ) => {
    const map = new Map<T, number>();
    for (const r of rows) {
      const ms = toMs(r);
      if (!Number.isFinite(ms)) continue;
      if (sinceMs != null && ms < sinceMs) continue;
      const k = pick(r);
      if (!k) continue;
      map.set(k, (map.get(k) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  };

  for (const r of rows) {
    const ms = toMs(r);
    if (!Number.isFinite(ms)) continue;
    if (ms >= last30Start) last30++;
    if (ms >= last7Start) last7++;
    if (ms >= todayStart) today++;
    else if (ms >= ydayStart && ms < todayStart) yday++;
  }

  const delta = today - yday;
  const trend =
    delta === 0 ? "no change" : delta > 0 ? `+${delta}` : `${delta}`;

  const topProducts7 = countBy((r) => r.base.product, last7Start).slice(0, 3);
  const topLocations7 = countBy(
    (r) => r.base.bookingLocation,
    last7Start,
  ).slice(0, 3);
  const status7 = countBy(
    (r) =>
      r.derived?.status ||
      (/Initiated/i.test(r.base.workflowStage) ? "PENDING" : "REGISTERED"),
    last7Start,
  );

  const statusTotal7 = status7.reduce((s, [, n]) => s + n, 0) || 1;
  const fmtPct = (n: number) => `${Math.round((n / statusTotal7) * 100)}%`;
  const list = (pairs: [string, number][]) =>
    pairs.length
      ? pairs.map(([k, n]) => `  - ${k}: **${n}**`).join("\n")
      : "  - (no data)";

  const seedMarkdown =
    `**📊 TradeExpress Helix — Daily Snapshot**\n\n` +
    `- Last **30 days**: **${last30} transactions**\n` +
    `- Last **7 days**: **${last7} transactions**\n` +
    `- **Today**: **${today}** vs **Yesterday**: **${yday}** → Delta **${trend}**\n\n` +
    `**Top products (7d)**\n${list(topProducts7)}\n\n` +
    `**Top booking locations (7d)**\n${list(topLocations7)}\n\n` +
    `**Status mix (7d)**\n` +
    status7.map(([k, n]) => `  - ${k}: **${n}** (${fmtPct(n)})`).join("\n");

  return {
    totals: { last30, last7, today, yesterday: yday, delta, trend },
    topProducts7,
    topLocations7,
    status7,
    seedMarkdown,
  };
}

// ---- Public: fetch full dataset (limit=0) and return rows ----
export async function fetchWorkdeskFull(
  baseUrl = "http://localhost:4000",
): Promise<WorkdeskFullRow[]> {
  const res = await fetch(`${baseUrl}/workdesk/full?limit=0`, {
    method: "GET",
  });
  if (!res.ok) throw new Error(`workdesk ${res.status}`);
  const payload = await res.json();
  return Array.isArray(payload?.rows)
    ? (payload.rows as WorkdeskFullRow[])
    : [];
}

// --- Types for summary and hotset ---
export type WorkdeskSummary = ReturnType<typeof summarizeFullWorkdesk>;

export type HotsetItem = {
  trn: string;
  product: string;
  bookingLocation: string;
  workflowStage: string;
  status: "PENDING" | "REGISTERED" | string;
  receivedAt?: string;
  __receivedAtMs?: number;
};

// Fetch a compact “hotset” (= latest N transactions)
export async function fetchWorkdeskHotset(
  baseUrl = "http://localhost:4000",
  limit = 50,
): Promise<HotsetItem[]> {
  const res = await fetch(
    `${baseUrl}/workdesk?limit=${limit}&sortBy=receivedAt&order=desc`,
    { method: "GET" },
  );
  if (!res.ok) throw new Error(`workdesk hotset ${res.status}`);
  const payload = await res.json();
  const latest = Array.isArray(payload?.rows) ? payload.rows : [];
  return latest.map((r: any) => ({
    trn: r.trn,
    product: r.product,
    bookingLocation: r.bookingLocation,
    workflowStage: r.workflowStage,
    status: /Initiated/i.test(r.workflowStage) ? "PENDING" : "REGISTERED",
    receivedAt: r.receivedAt,
    __receivedAtMs: r.__receivedAtMs,
  }));
}
