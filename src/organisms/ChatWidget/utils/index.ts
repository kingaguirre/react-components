// src/organisms/ChatWidget/utils/index.ts
export const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

export const createId = (prefix = "msg") =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const nowIso = () => new Date().toISOString();

export const scrollToBottom = (el: HTMLElement) => {
  el.scrollTop = el.scrollHeight;
};

export const toPlainText = (node: any): string => {
  if (node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toPlainText).join("");
  if (typeof node === "object" && (node as any).props)
    return toPlainText((node as any).props?.children);
  return "";
};

export const scrub = (s: string) => s.replace(/^\s*[\[\]]\s*$/gm, "");

// --- filename utils ---
export function splitFilename(name: string): { base: string; ext: string } {
  if (!name) return { base: "", ext: "" };
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return { base: name, ext: "" };
  return { base: name.slice(0, dot), ext: name.slice(dot + 1) };
}

// --- canvas text measuring (pixel-accurate) ---
let __measureCanvas: HTMLCanvasElement | null = null;
function measureWidth(text: string, font: string): number {
  if (!__measureCanvas) __measureCanvas = document.createElement("canvas");
  const ctx = __measureCanvas.getContext("2d");
  if (!ctx) return text.length * 6; // fallback
  ctx.font = font; // "style variant weight size family"
  return ctx.measureText(text).width;
}

// Middle-truncate base to fit widthPx, keep ".." visible
export function middleTruncateToWidth(
  base: string,
  widthPx: number,
  font: string,
  dots = "..",
  minHead = 2,
  minTail = 2,
): string {
  if (!base) return "";
  if (measureWidth(base, font) <= widthPx) return base;

  // Binary search total kept chars (head + tail)
  const ratioHead = 0.6; // keep a bit more on the left
  let lo = minHead + minTail;
  let hi = base.length;
  let best = base.slice(0, minHead) + dots + base.slice(-minTail);

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    let head = Math.max(minHead, Math.ceil(mid * ratioHead));
    let tail = Math.max(minTail, mid - head);
    if (head + tail > base.length) tail = base.length - head;

    const cand = base.slice(0, head) + dots + base.slice(-tail);
    const w = measureWidth(cand, font);

    if (w <= widthPx) {
      best = cand;
      lo = mid + 1; // try keep more
    } else {
      hi = mid - 1; // keep less
    }
  }
  return best;
}

export * from "./persistence";
export * from "./sessionUtils";
export * from "./useControlled";
