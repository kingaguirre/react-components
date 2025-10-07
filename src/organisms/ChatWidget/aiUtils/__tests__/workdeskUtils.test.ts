// src/organisms/ChatWidget/aiUtils/__tests__/workdeskUtils.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
// 🔧 adjust path if needed
import {
  summarizeFullWorkdesk,
  fetchWorkdeskFull,
  fetchWorkdeskHotset,
  type FullRow,
} from "../workdeskUtils";

const utc = (y: number, m: number, d: number, h = 0, min = 0, s = 0) =>
  Date.UTC(y, m, d, h, min, s);

describe("summarizeFullWorkdesk", () => {
  const NOW = new Date("2025-10-07T00:00:00Z"); // keep midnight UTC to avoid TZ surprises

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes today/yesterday/last7/last30, trend, and top lists correctly", () => {
    // Build rows across windows
    const todayMs = utc(2025, 9, 7, 10, 0, 0);
    const yesterdayMs = utc(2025, 9, 6, 12, 0, 0);
    const minus3dMs = utc(2025, 9, 4, 9, 0, 0);
    const minus10dMs = utc(2025, 8, 27, 9, 0, 0);
    const minus40dMs = utc(2025, 7, 28, 9, 0, 0);

    const row = (ms: number, o: Partial<FullRow["base"]> = {}, stage?: string): FullRow => ({
      base: {
        bookingLocation: "KL",
        product: "EIF",
        submissionMode: "PORTAL",
        workflowStage: stage ?? "Registered",
        __receivedAtMs: ms,
        trn: `T-${ms}`,
        ...o,
      },
    });

    const rows: FullRow[] = [
      row(todayMs, { bookingLocation: "KL", product: "EIF" }, "Initiated"), // PENDING
      row(yesterdayMs, { bookingLocation: "KL", product: "EIF" }, "Registered"),
      row(minus3dMs, { bookingLocation: "MANILA", product: "IIF" }, "Initiated"), // PENDING
      row(minus10dMs, { bookingLocation: "SING", product: "SUF" }, "Registered"),
      row(minus40dMs, { bookingLocation: "HK", product: "OTHER" }, "Registered"),
    ];

    const s = summarizeFullWorkdesk(rows);

    // Totals
    expect(s.totals.today).toBe(1);
    expect(s.totals.yesterday).toBe(1);
    expect(s.totals.last7).toBe(3);
    expect(s.totals.last30).toBe(4);
    expect(s.totals.delta).toBe(0);
    expect(s.totals.trend).toBe("no change");

    // Top products/locations (7d window, sorted desc, max 3)
    expect(s.topProducts7[0]).toEqual(["EIF", 2]);
    expect(s.topProducts7[1]).toEqual(["IIF", 1]);
    expect(s.topLocations7[0]).toEqual(["KL", 2]);
    expect(s.topLocations7[1]).toEqual(["MANILA", 1]);

    // Status mix (Initiated→PENDING, else REGISTERED)
    // We expect 2 PENDING (today, -3d) and 1 REGISTERED (yday) within 7d
    // Order is by count; verify membership not order
    expect(s.status7).toEqual(
      expect.arrayContaining([
        ["PENDING", 2],
        ["REGISTERED", 1],
      ]),
    );

    // Seed markdown sanity
    const md = s.seedMarkdown;
    expect(md).toContain("**📊 TradeExpress Helix — Daily Snapshot**");
    expect(md).toContain("Last **30 days**: **4 transactions**");
    expect(md).toContain("Last **7 days**: **3 transactions**");
    expect(md).toMatch(/Today.*\*\*1\*\* vs \*\*Yesterday\*\*: \*\*1\*\*/i);
  });
});

describe("fetchWorkdesk*()", () => {
  const BASE = "http://test.local";

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-10-07T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetchWorkdeskFull returns rows and throws on non-OK", async () => {
    const fullRows = [
      {
        base: {
          bookingLocation: "KL",
          product: "EIF",
          submissionMode: "PORTAL",
          workflowStage: "Registered",
          receivedAt: "2025-10-01T10:00:00Z",
          __receivedAtMs: Date.parse("2025-10-01T10:00:00Z"),
        },
      },
    ];

    // Mock fetch
    // @ts-expect-error
    global.fetch = vi.fn(async (url: string) => {
      const u = new URL(url);
      if (u.pathname === "/workdesk/full") {
        return new Response(JSON.stringify({ rows: fullRows }), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });

    const ok = await fetchWorkdeskFull(BASE);
    expect(ok).toEqual(fullRows);

    // Error path
    // @ts-expect-error
    global.fetch = vi.fn(async () => new Response("nope", { status: 500 }));
    await expect(fetchWorkdeskFull(BASE)).rejects.toThrow(/workdesk 500/);
  });

  it("fetchWorkdeskHotset maps and classifies status correctly", async () => {
    const listRows = [
      {
        trn: "A",
        product: "EIF",
        bookingLocation: "KL",
        workflowStage: "Initiated", // → PENDING
        receivedAt: "2025-10-06T12:00:00Z",
        __receivedAtMs: Date.parse("2025-10-06T12:00:00Z"),
      },
      {
        trn: "B",
        product: "IIF",
        bookingLocation: "MANILA",
        workflowStage: "Registered", // → REGISTERED
        receivedAt: "2025-10-05T08:00:00Z",
        __receivedAtMs: Date.parse("2025-10-05T08:00:00Z"),
      },
    ];

    // @ts-expect-error
    global.fetch = vi.fn(async (url: string) => {
      const u = new URL(url);
      // Ensure sortBy and order are present
      expect(u.searchParams.get("sortBy")).toBe("receivedAt");
      expect(u.searchParams.get("order")).toBe("desc");
      expect(Number(u.searchParams.get("limit"))).toBe(2);

      if (u.pathname === "/workdesk") {
        return new Response(JSON.stringify({ rows: listRows }), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });

    const hot = await fetchWorkdeskHotset(BASE, 2);
    expect(hot).toEqual([
      {
        trn: "A",
        product: "EIF",
        bookingLocation: "KL",
        workflowStage: "Initiated",
        status: "PENDING",
        receivedAt: "2025-10-06T12:00:00Z",
        __receivedAtMs: Date.parse("2025-10-06T12:00:00Z"),
      },
      {
        trn: "B",
        product: "IIF",
        bookingLocation: "MANILA",
        workflowStage: "Registered",
        status: "REGISTERED",
        receivedAt: "2025-10-05T08:00:00Z",
        __receivedAtMs: Date.parse("2025-10-05T08:00:00Z"),
      },
    ]);
  });
});
