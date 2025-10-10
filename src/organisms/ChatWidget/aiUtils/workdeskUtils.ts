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

// Static knowledge/config for the Workdesk adapters.
// Keep prompts out of here; this is just data you can reuse across adapters.

export const memory = {
  datasetName: "Transaction Workdesk",
  itemSingular: "transaction",
  itemPlural: "transactions",
  synonyms: ["row", "record", "entry", "txn"],
  hotsetLimit: 50,
};

// NOTE: these accessors are plain JS functions (TS will happily type them as 'any').
export const shape = {
  timestampAccessor: (row: any) =>
    typeof row?.__receivedAtMs === "number"
      ? row.__receivedAtMs
      : typeof row?.base?.__receivedAtMs === "number"
        ? row.base.__receivedAtMs
        : Date.parse(row?.receivedAt || row?.base?.receivedAt || ""),
  statusAccessor: (row: any) => {
    const ws =
      row?.workflowStage ??
      row?.base?.workflowStage ??
      row?.status ??
      row?.base?.status ??
      "";
    return /pending|initiated|in[-\s]?progress|awaiting|on[-\s]?hold|review|draft/i.test(
      ws,
    )
      ? "PENDING"
      : "REGISTERED";
  },
  keyAccessor: (row: any) =>
    row?.trn ?? row?.base?.trn ?? row?.id ?? row?.base?.id,
};

// Useful facets for grouping/filtering/quick summaries
export const facets = [
  (r: any) => r?.product ?? r?.base?.product,
  (r: any) => r?.bookingLocation ?? r?.base?.bookingLocation,
  (r: any) => r?.workflowStage ?? r?.base?.workflowStage,
  (r: any) => {
    const ms =
      typeof r?.__receivedAtMs === "number"
        ? r.__receivedAtMs
        : typeof r?.base?.__receivedAtMs === "number"
          ? r.base.__receivedAtMs
          : Date.parse(r?.receivedAt || r?.base?.receivedAt || "");
    if (!Number.isFinite(ms)) return undefined;
    return new Date(ms).getUTCFullYear();
  },
];

// Merged: keep your names and add common aliases for robustness.
export const brandNames = [
  "TradeExpress",
  "Helix",
  "TradeXpress Helix",
  "Trade Express Helix",
];

export const kb = {
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
  whoItServes: [
    "Trade Operations",
    "Middle Office",
    "Risk/Compliance",
    "Business Ops",
  ],
  dataModelNotes: {
    itemTerminology: "Each row is a transaction",
    latestDefinition:
      "Latest = highest __receivedAtMs / most recent receivedAt",
  },
  contact: {
    general: "helix-support@tradexpress.example",
    security: "security@tradexpress.example",
    website: "https://example.com/helix",
  },
  ownership: {
    productOwnerTeam: "Helix Platform",
    engineeringTeam: "Helix Engineering",
    maintainerGroup: "Helix Core Services",
  },
  people: [
    {
      role: "Head, Platform and AI Engineering",
      name: "Nox",
      email: "nox@sc.com",
    },
    {
      role: "Engineering Lead, Application Frameworks",
      name: "Neil",
      email: "neil@sc.com",
    },
    {
      role: "Engineering Lead, Strategic Foundation Services",
      name: "Krishna",
      email: "krishna@sc.com",
    },
    { role: "Developer", name: "King", email: "king@sc.com" },
    { role: "Developer", name: "Clem", email: "clem@sc.com" },
  ],
};

// Optional: one-stop import
export const details = { memory, shape, facets, brandNames, kb } as const;
