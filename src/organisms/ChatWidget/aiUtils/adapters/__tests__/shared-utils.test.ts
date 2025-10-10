/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// bytes.ts lives next to this __tests__ folder
import {
  utf8Encode,
  bytesToBase64 as node_bytesToBase64,
  base64ToBytes as node_base64ToBytes,
  toDataUrl,
  bytesLength,
} from "../shared/bytes";

// dates.ts + text.ts live under common/server/ai/...
import {
  DAY,
  startOfDay,
  pad2,
  parseAnyDate,
} from "../shared/dates";

import { slug, escHtml } from "../shared/text";

// TextDecoder: ensure available in Node
const TD: typeof TextDecoder =
  (globalThis as any).TextDecoder ?? (await import("util")).TextDecoder;

describe("shared utils (bytes, dates, text)", () => {
  const realWindow = (globalThis as any).window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // restore any window we may have patched
    (globalThis as any).window = realWindow;
  });

  // ---------- bytes.ts ----------
  describe("bytes.ts", () => {
    it("utf8Encode encodes unicode correctly (roundtrip)", () => {
      const input = "A😀héllo✓";
      const bytes = utf8Encode(input);
      // sanity: emoji makes length > input.length
      expect(bytes.byteLength).toBeGreaterThan(input.length);

      // roundtrip using TextDecoder
      const dec = new TD();
      const round = dec.decode(bytes);
      expect(round).toBe(input);
    });

    it("bytesToBase64/base64ToBytes (Node fallback) roundtrip", () => {
      // Ensure no window so Node path is used
      (globalThis as any).window = undefined;

      const src = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
      const b64 = node_bytesToBase64(src);
      const back = node_base64ToBytes(b64);
      expect(Array.from(back)).toEqual(Array.from(src));
    });

    it("bytesToBase64/base64ToBytes (browser branch via window.btoa/atob) roundtrip", async () => {
      // Simulate browser branch
      (globalThis as any).window = {
        btoa: (bin: string) => Buffer.from(bin, "binary").toString("base64"),
        atob: (b64: string) => Buffer.from(b64, "base64").toString("binary"),
      };

      // Re-import the functions through the same binding (the module reads window at runtime)
      const { bytesToBase64, base64ToBytes } = await import("../shared/bytes");

      const src = new Uint8Array([255, 0, 127, 128, 1, 42, 99, 200]);
      const b64 = bytesToBase64(src);
      const back = base64ToBytes(b64);
      expect(Array.from(back)).toEqual(Array.from(src));
    });

    it("toDataUrl returns data: URL within size limit and null when exceeding", () => {
      (globalThis as any).window = undefined; // use Node branch for base64
      const bytes = utf8Encode("hello");
      const url = toDataUrl("text/plain;charset=utf-8", bytes, 10 * 1024);
      expect(url).toMatch(/^data:text\/plain;charset=utf-8;base64,/);

      // over limit
      const big = new Uint8Array(1024);
      const tooSmallLimit = 10; // bytes
      expect(toDataUrl("application/octet-stream", big, tooSmallLimit)).toBeNull();
    });

    it("bytesLength handles null/undefined", () => {
      expect(bytesLength(null)).toBe(0);
      expect(bytesLength(undefined)).toBe(0);
      expect(bytesLength(new Uint8Array([1, 2, 3]))).toBe(3);
    });
  });

  // ---------- dates.ts ----------
  describe("dates.ts", () => {
    it("DAY constant == 86400000", () => {
      expect(DAY).toBe(24 * 60 * 60 * 1000);
    });

    it("startOfDay zeroes local time components", () => {
      const ms = Date.UTC(2025, 0, 2, 15, 23, 45, 678); // arbitrary ms
      const expected = (() => {
        const d = new Date(ms);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })();

      expect(startOfDay(ms)).toBe(expected);
    });

    it("pad2 pads to 2 chars", () => {
      expect(pad2(0)).toBe("00");
      expect(pad2(5)).toBe("05");
      expect(pad2(12)).toBe("12");
      expect(pad2(123)).toBe("123");
    });

    it("parseAnyDate handles ms, seconds, numeric strings, and ISO strings", () => {
      const ms = 1735689600000; // 2025-01-01T00:00:00.000Z
      const sec = Math.floor(ms / 1000);

      // number ms
      expect(parseAnyDate(ms)).toBe(ms);
      // number seconds -> ms
      expect(parseAnyDate(sec)).toBe(sec * 1000);

      // numeric string 13-digit (ms) -> ms
      expect(parseAnyDate(String(ms))).toBe(ms);
      // numeric string 10-digit (sec) -> ms
      expect(parseAnyDate(String(sec))).toBe(sec * 1000);

      // ISO with Z
      const isoZ = "2025-01-01T00:00:00Z";
      expect(parseAnyDate(isoZ)).toBe(Date.parse(isoZ));

      // ISO-like with space (function replaces with T)
      const isoSpace = "2025-01-01 00:00:00Z";
      expect(parseAnyDate(isoSpace)).toBe(Date.parse("2025-01-01T00:00:00Z"));

      // invalid -> NaN
      expect(Number.isNaN(parseAnyDate("not a date"))).toBe(true);
    });
  });

  // ---------- text.ts ----------
  describe("text.ts", () => {
    it("slug normalizes, strips non-alphanum, trims dashes, lowercases", () => {
      expect(slug("Hello, World!")).toBe("hello-world");
      expect(slug("--A--B--")).toBe("a-b");
      expect(slug("   ")).toBe("selection");
    });

    it("slug enforces max length", () => {
      const long = "a".repeat(100);
      expect(slug(long, 48)).toBe("a".repeat(48));
    });

    it("escHtml escapes &, <, >", () => {
      expect(escHtml("x < y & y > z")).toBe("x &lt; y &amp; y &gt; z");
      expect(escHtml("&<>")).toBe("&amp;&lt;&gt;");
    });
  });
});
