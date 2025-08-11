import { DatePickerProps } from "./interface";

export const formatDate = (input: any): string | null => {
  if (!input) return null;

  const format = (date: Date | null): string | null => {
    if (!date) return null;
    const pad = (num: number) => num.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  if (Array.isArray(input)) {
    const [start, end] = input;
    if (!start || !end) return null; // Ensure both dates exist
    return `${format(start)},${format(end)}`;
  }

  return format(input);
};

export const parseDateRange = (
  input?: DatePickerProps["selectedDate"],
): string | [string, string] | null => {
  if (!input) return null;

  // Helper: Process a value (string or Date) and return a formatted date or null.
  const processValue = (val: string | Date | null): string | null => {
    if (!val) return null;
    if (typeof val === "string") {
      const trimmed = val.trim();
      const parsed = parseCustomDate(trimmed);
      return parsed ? formatToYYYYMMDD(parsed) : null;
    }
    if (val instanceof Date) {
      return isValidDate(val) ? formatToYYYYMMDD(val) : null;
    }
    return null;
  };

  let start: string | undefined;
  let end: string | undefined;

  if (typeof input === "string") {
    const parts = input.split(",");
    if (parts.length === 1) {
      // Single date string: parse and return a single date.
      return processValue(parts[0]) ?? null;
    } else if (parts.length === 2) {
      // Two comma-separated values: parse both.
      start = processValue(parts[0]) ?? undefined;
      end = processValue(parts[1]) ?? undefined;
    } else {
      return null;
    }
  } else if (input instanceof Date) {
    return isValidDate(input) ? formatToYYYYMMDD(input) : null;
  } else if (Array.isArray(input) && input.length === 2) {
    // In this branch, each element can be a string or Date (or null).
    start = processValue(input[0]) ?? undefined;
    end = processValue(input[1]) ?? undefined;
  } else {
    return null;
  }

  // Ensure both dates exist before returning a tuple.
  return start && end ? [start, end] : null;
};

// Helper function to parse various date formats
const parseCustomDate = (date: string | Date): Date | null => {
  if (date instanceof Date && !isNaN(date.getTime())) return date; // Already a valid Date object

  const formats = [
    "YYYY-MM-DD",
    "MMM-DD-YYYY",
    "DD-MM-YYYY",
    "DD-MMM-YYYY",
    "MMM/DD/YYYY",
    "DD/MM/YYYY",
    "DD/MMM/YYYY",
  ];

  for (const format of formats) {
    const parsedDate = tryParseDate(date as string, format);
    if (parsedDate) return parsedDate;
  }

  return null; // Return null if none of the formats match
};

// Helper function to attempt parsing based on format
const tryParseDate = (dateStr: string, format: string): Date | null => {
  const monthNames = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  let day: number, month: number, year: number;

  const match = dateStr.match(/\d+|[a-zA-Z]+/g);
  if (!match || match.length < 3) return null;

  switch (format) {
    case "YYYY-MM-DD":
      [year, month, day] = match.map(Number);
      month -= 1; // Convert to zero-based index
      break;
    case "MMM-DD-YYYY":
    case "MMM/DD/YYYY":
      [month, day, year] = [
        monthNames[match[0] as keyof typeof monthNames],
        Number(match[1]),
        Number(match[2]),
      ];
      break;
    case "DD-MM-YYYY":
    case "DD/MM/YYYY":
      [day, month, year] = match.map(Number);
      month -= 1;
      break;
    case "DD-MMM-YYYY":
    case "DD/MMM/YYYY":
      [day, month, year] = [
        Number(match[0]),
        monthNames[match[1] as keyof typeof monthNames],
        Number(match[2]),
      ];
      break;
    default:
      return null;
  }

  const parsedDate = new Date(year, month, day);
  return isValidDate(parsedDate) ? parsedDate : null;
};

// Helper function to check if date is valid
const isValidDate = (date: Date): boolean => !isNaN(date.getTime());

// Helper function to format date as YYYY-MM-DD
const formatToYYYYMMDD = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
