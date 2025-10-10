// src/common/server/ai/adapters/shared/dates.ts
export const DAY = 24 * 60 * 60 * 1000;

export const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const pad2 = (n: number) => String(n).padStart(2, "0");

// light date parsing that handles numbers/iso/common forms
export function parseAnyDate(val: unknown): number {
  if (val == null) return NaN;
  if (typeof val === "number") {
    if (!Number.isFinite(val)) return NaN;
    if (val >= 1e12) return val;
    if (val >= 1e9) return val * 1000;
    return val;
  }
  const s = String(val).trim();
  if (!s) return NaN;
  if (/^\d{10,13}$/.test(s)) {
    const n = Number(s);
    return s.length === 13 ? n : n * 1000;
  }
  const iso = Date.parse(s.replace(" ", "T"));
  if (Number.isFinite(iso)) return iso;
  return NaN;
}
