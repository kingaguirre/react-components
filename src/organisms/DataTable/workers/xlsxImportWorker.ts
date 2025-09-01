/// <reference lib="webworker" />

import * as XLSX from "xlsx";

type MsgIn =
  | { kind: "xlsx"; buffer: ArrayBuffer; chunkSize?: number }
  | { kind: "csv"; text: string; chunkSize?: number };

type MsgOut =
  | { type: "chunk"; chunk: Array<Record<string, any>> }
  | { type: "done" }
  | { type: "error"; message: string };

// Convert AOA -> array of objects using first row as header (synthesizes names if blank)
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

self.onmessage = (evt: MessageEvent<MsgIn>) => {
  const data = evt.data;
  const chunkSize = (data as any).chunkSize ?? 500;

  try {
    // CSV must be read as string; XLSX as array buffer
    const wb =
      data.kind === "csv"
        ? XLSX.read(data.text, { type: "string" })
        : XLSX.read((data as any).buffer, { type: "array" });

    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      self.postMessage({ type: "error", message: "No sheet found." } as MsgOut);
      return;
    }

    const ws = wb.Sheets[sheetName];
    const aoa: any[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      blankrows: false,
      defval: "",
    }) as any[][];
    const objects = aoaToObjects(aoa);

    if (objects.length === 0) {
      self.postMessage({ type: "done" } as MsgOut);
      return;
    }

    for (let i = 0; i < objects.length; i += chunkSize) {
      const chunk = objects.slice(i, i + chunkSize);
      self.postMessage({ type: "chunk", chunk } as MsgOut);
    }

    self.postMessage({ type: "done" } as MsgOut);
  } catch (err: any) {
    self.postMessage({
      type: "error",
      message: err?.message || "Import failed.",
    } as MsgOut);
  }
};
