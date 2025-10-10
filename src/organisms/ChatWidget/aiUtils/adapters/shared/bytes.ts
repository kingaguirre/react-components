// src/organisms/ChatWidget/aiUtils/adapters/shared/bytes.ts

export const utf8Encode = (s: string): Uint8Array =>
  new TextEncoder().encode(s);

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof window !== "undefined" && "btoa" in window) {
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, i + chunk)) as unknown as number[],
      );
    }

    return btoa(bin)!;
  }
  // Node fallback
  // @ts-ignore
  const b64 = Buffer.from(bytes).toString("base64");
  return b64;
}

export function base64ToBytes(b64: string): Uint8Array {
  if (!b64) return new Uint8Array();
  if (typeof window !== "undefined" && "atob" in window) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  // Node fallback
  // @ts-ignore
  return new Uint8Array(Buffer.from(b64, "base64"));
}

export function toDataUrl(
  mime: string,
  bytes: Uint8Array,
  maxBytes = 750 * 1024,
): string | null {
  if (!bytes || bytes.length === 0) return null;
  if (bytes.length > maxBytes) return null;
  const b64 = bytesToBase64(bytes);
  return `data:${mime};base64,${b64}`;
}

export const bytesLength = (bytes?: Uint8Array | null) =>
  bytes ? bytes.byteLength : 0;
