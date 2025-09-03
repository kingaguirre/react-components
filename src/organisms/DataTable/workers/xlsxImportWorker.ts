/// <reference lib="webworker" />

// ExcelJS-based import worker: parses XLSX with ExcelJS, CSV via a light parser.
// Keeps the same MsgIn / MsgOut protocol as your previous SheetJS worker.

import { Workbook } from "exceljs";

type MsgIn =
  | { kind: "xlsx"; buffer: ArrayBuffer; chunkSize?: number }
  | { kind: "csv"; text: string; chunkSize?: number };

type MsgOut =
  | { type: "chunk"; chunk: Array<Record<string, any>> }
  | { type: "done" }
  | { type: "error"; message: string };

// ─────────────────────────────────────────────────────────────────────────────
// CSV parsing (handles quotes, commas, newlines, "" escaping)
// ─────────────────────────────────────────────────────────────────────────────
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let i = 0;
  const n = text.length;
  let inQuotes = false;

  while (i < n) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < n && text[i + 1] === '"') {
          // escaped "
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cell += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i++;
      continue;
    }

    cell += ch;
    i++;
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// AOA -> objects using first row as header (synthesizes header if blank)
// ─────────────────────────────────────────────────────────────────────────────
function aoaToObjects(aoa: any[][]): Record<string, any>[] {
  if (!aoa || aoa.length === 0) return [];
  const headerRow = aoa[0] ?? [];
  const headers: string[] = headerRow.map((h: any, i: number) => {
    const v = h == null ? "" : String(h).trim();
    return v || `Column_${i + 1}`;
  });

  const rows = aoa.slice(1);
  return rows.map((arr) => {
    const obj: Record<string, any> = {};
    for (let i = 0; i < headers.length; i++) obj[headers[i]] = arr[i] ?? "";
    return obj;
  });
}

// Normalize ExcelJS cell values to strings (basic, predictable)
function normCell(v: any): string {
  if (v == null) return "";
  // ExcelJS rich text and hyperlinks may be objects; prefer .text if present
  if (typeof v === "object") {
    if ("text" in v && v.text != null) return String((v as any).text);
    if (v.richText && Array.isArray(v.richText)) {
      return v.richText.map((p: any) => p.text ?? "").join("");
    }
    if (v.hyperlink && v.text) return String(v.text);
    // Dates / formula results may come as Date/number etc.
  }
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

async function handleCSV(text: string, chunkSize: number) {
  const aoa = parseCSV(text);
  const objects = aoaToObjects(aoa);

  if (objects.length === 0) {
    (self as any).postMessage({ type: "done" } as MsgOut);
    return;
  }
  const size = Math.max(1, chunkSize | 0 || 500);
  for (let i = 0; i < objects.length; i += size) {
    (self as any).postMessage({
      type: "chunk",
      chunk: objects.slice(i, i + size),
    } as MsgOut);
  }
  (self as any).postMessage({ type: "done" } as MsgOut);
}

async function handleXLSX(buffer: ArrayBuffer, chunkSize: number) {
  const wb = new Workbook();
  await wb.xlsx.load(buffer);

  const ws = wb.worksheets[0];
  if (!ws) {
    (self as any).postMessage({ type: "done" } as MsgOut);
    return;
  }

  // Build AOA using the worksheet's actual row/column bounds
  const maxRow = ws.actualRowCount || ws.rowCount || 0;
  const maxCol = ws.actualColumnCount || (ws.columns?.length ?? 0);

  if (maxRow === 0 || maxCol === 0) {
    (self as any).postMessage({ type: "done" } as MsgOut);
    return;
  }

  const aoa: string[][] = new Array(maxRow);
  for (let r = 1; r <= maxRow; r++) {
    const rowArr: string[] = new Array(maxCol);
    for (let c = 1; c <= maxCol; c++) {
      const cell = ws.getCell(r, c);
      rowArr[c - 1] = normCell(cell?.value);
    }
    aoa[r - 1] = rowArr;
  }

  const objects = aoaToObjects(aoa);
  if (objects.length === 0) {
    (self as any).postMessage({ type: "done" } as MsgOut);
    return;
  }

  const size = Math.max(1, chunkSize | 0 || 500);
  for (let i = 0; i < objects.length; i += size) {
    (self as any).postMessage({
      type: "chunk",
      chunk: objects.slice(i, i + size),
    } as MsgOut);
  }
  (self as any).postMessage({ type: "done" } as MsgOut);
}

self.onmessage = async (evt: MessageEvent<MsgIn>) => {
  try {
    const data = evt.data;
    const chunkSize = (data as any).chunkSize ?? 500;

    if (data.kind === "csv") {
      await handleCSV(data.text, chunkSize);
      return;
    }
    if (data.kind === "xlsx") {
      await handleXLSX(data.buffer, chunkSize);
      return;
    }

    (self as any).postMessage({
      type: "error",
      message: `Unknown kind: ${(data as any).kind}`,
    } as MsgOut);
  } catch (err: any) {
    (self as any).postMessage({
      type: "error",
      message: err?.message || "Import failed.",
    } as MsgOut);
  }
};
