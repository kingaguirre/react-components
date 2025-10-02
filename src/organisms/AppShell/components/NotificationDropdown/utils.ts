/**
 * Returns a “time ago” string for a given Unix timestamp (in seconds).
 * - “now” for under 1 minute
 * - “# mins” for under 1 hour
 * - “# hours” for under 1 day
 * - “# days” for under 7 days
 * - “dd MMM YYYY, h:mm AM/PM” otherwise
 */
export function timeAgo(
  input: string | number | Date | null | undefined,
): string {
  if (!input && input !== 0) return "—";

  let ms: number;
  if (typeof input === "number") {
    // Heuristic: < 2e10 → seconds; else ms
    ms = input < 2e10 ? input * 1000 : input;
  } else {
    const t =
      input instanceof Date
        ? input.getTime()
        : new Date(input as any).getTime();
    if (!Number.isFinite(t)) return "—";
    ms = t;
  }

  const diff = Date.now() - ms;
  const minute = 60_000,
    hour = 60 * minute,
    day = 24 * hour,
    week = 7 * day;

  if (diff < minute) return "now";
  if (diff < hour) {
    const m = Math.floor(diff / minute);
    return `${m} min${m !== 1 ? "s" : ""} ago`;
  }
  if (diff < day) {
    const h = Math.floor(diff / hour);
    return `${h} hour${h !== 1 ? "s" : ""} ago`;
  }
  if (diff < week) {
    const d = Math.floor(diff / day);
    return `${d} day${d !== 1 ? "s" : ""} ago`;
  }

  // Absolute date + 12-hour time with AM/PM (local)
  const dte = new Date(ms);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dd = String(dte.getDate()).padStart(2, "0");
  const mon = months[dte.getMonth()];
  const yyyy = dte.getFullYear();

  const hrs24 = dte.getHours();
  const period = hrs24 >= 12 ? "PM" : "AM";
  const hrs12 = hrs24 % 12 || 12; // 0 -> 12
  const mins = String(dte.getMinutes()).padStart(2, "0");

  return `${dd} ${mon} ${yyyy}, ${hrs12}:${mins} ${period}`;
}
