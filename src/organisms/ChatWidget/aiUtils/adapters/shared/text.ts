// src/common/server/ai/adapters/shared/text.ts
export const slug = (s: string, max = 48) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max) || "selection";

export function escHtml(s: string) {
  return String(s).replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] || c,
  );
}
