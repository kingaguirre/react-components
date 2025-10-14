// src/molecules/DatePicker/utils.tsx
import { format as dfFormat, parse as dfParse, isValid as dfIsValid } from "date-fns";
import type { DatePickerProps } from "./interface";

/**
 * Formats a Date or a [Date|nil, Date|nil] range into a string (or "start,end")
 * using the provided date-fns pattern.
 */
export const formatDate = (
  input: Date | [Date | null, Date | null] | null | undefined,
  fmt: string
): string | null => {
  if (!input) return null;

  const fmtOne = (d: Date | null) => (d && dfIsValid(d) ? dfFormat(d, fmt) : null);

  if (Array.isArray(input)) {
    const [s, e] = input;
    if (!s || !e) return null; // only emit when both ends are set
    const fs = fmtOne(s);
    const fe = fmtOne(e);
    return fs && fe ? `${fs},${fe}` : null;
  }

  return fmtOne(input);
};

/**
 * Parses an incoming `value` (string | Date | tuple) into Date(s),
 * primarily using the supplied `fmt`. Falls back to native Date for safety.
 */
export const parseDateRange = (
  input?: DatePickerProps["value"],
  fmt: string = "dd-MMM-yyyy"
): Date | [Date | null, Date | null] | null => {
  if (!input) return null;

  const tryParse = (val: string | Date | null): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return dfIsValid(val) ? val : null;
    // parse string using the specified format
    const parsed = dfParse(val.trim(), fmt, new Date());
    if (dfIsValid(parsed)) return parsed;
    // last resort: Date constructor
    const fallback = new Date(val);
    return dfIsValid(fallback) ? fallback : null;
  };

  if (typeof input === "string") {
    const parts = input.split(",");
    if (parts.length === 1) {
      return tryParse(parts[0]);
    }
    if (parts.length === 2) {
      const s = tryParse(parts[0]);
      const e = tryParse(parts[1]);
      return s || e ? [s, e] : null;
    }
    return null;
  }

  if (Array.isArray(input)) {
    const s = tryParse(input[0] ?? null);
    const e = tryParse(input[1] ?? null);
    return s || e ? [s, e] : null;
  }

  // Date instance
  return tryParse(input);
};
