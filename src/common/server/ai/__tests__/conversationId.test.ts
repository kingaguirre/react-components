// src/common/server/ai/__tests__/conversationId.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getConversationId, resetConversationId } from "../conversationId";

const KEY = "wd_conversation_id";

// simple in-memory sessionStorage mock
function makeMemorySessionStorage() {
  const store = new Map<string, string>();
  return {
    get length() { return store.size; },
    clear() { store.clear(); },
    getItem(k: string) { return store.has(k) ? store.get(k)! : null; },
    key(i: number) { return Array.from(store.keys())[i] ?? null; },
    removeItem(k: string) { store.delete(k); },
    setItem(k: string, v: string) { store.set(k, String(v)); },
    __dump() { return Object.fromEntries(store.entries()); },
  } as unknown as Storage & { __dump: () => Record<string, string> };
}

let cryptoGetSpy: ReturnType<typeof vi.spyOn> | null = null;

beforeEach(() => {
  (globalThis as any).sessionStorage = makeMemorySessionStorage();
  cryptoGetSpy?.mockRestore();
  cryptoGetSpy = null;
});

afterEach(() => {
  cryptoGetSpy?.mockRestore();
  vi.restoreAllMocks();
});

describe("getConversationId()", () => {
  it("uses crypto.randomUUID() when available and persists to sessionStorage", () => {
    const uuid = "00000000-0000-4000-8000-000000000000";
    const rr = vi.fn().mockReturnValue(uuid);

    // 🔑 mock the getter for globalThis.crypto
    cryptoGetSpy = vi
      .spyOn(globalThis as any, "crypto", "get")
      .mockReturnValue({ randomUUID: rr } as any);

    const first = getConversationId();
    expect(first).toBe(uuid);
    expect((globalThis.sessionStorage as any).__dump()[KEY]).toBe(uuid);
    expect(rr).toHaveBeenCalledTimes(1);

    // second call should reuse storage (no new UUID)
    const second = getConversationId();
    expect(second).toBe(uuid);
    expect(rr).toHaveBeenCalledTimes(1);
  });

  it("falls back to Math.random+Date if crypto.randomUUID is missing", () => {
    // return undefined for crypto → triggers fallback path
    cryptoGetSpy = vi
      .spyOn(globalThis as any, "crypto", "get")
      .mockReturnValue(undefined as any);

    const id1 = getConversationId();
    expect(typeof id1).toBe("string");
    expect(id1.length).toBeGreaterThan(10);

    const id2 = getConversationId();
    expect(id2).toBe(id1); // persisted
    expect((globalThis.sessionStorage as any).__dump()[KEY]).toBe(id1);
  });

  it("returns an existing id from sessionStorage without generating a new one", () => {
    const preset = "preset-123";
    globalThis.sessionStorage.setItem(KEY, preset);

    const rr = vi.fn(); // should not be called
    cryptoGetSpy = vi
      .spyOn(globalThis as any, "crypto", "get")
      .mockReturnValue({ randomUUID: rr } as any);

    const id = getConversationId();
    expect(id).toBe(preset);
    expect(rr).not.toHaveBeenCalled();
  });
});

describe("resetConversationId()", () => {
  it("clears the stored id so the next call generates a new one", () => {
    const firstUuid = "11111111-1111-4111-8111-111111111111";
    const secondUuid = "22222222-2222-4222-8222-222222222222";
    const rr = vi.fn().mockReturnValueOnce(firstUuid).mockReturnValueOnce(secondUuid);

    cryptoGetSpy = vi
      .spyOn(globalThis as any, "crypto", "get")
      .mockReturnValue({ randomUUID: rr } as any);

    const a = getConversationId();
    expect(a).toBe(firstUuid);
    expect(globalThis.sessionStorage.getItem(KEY)).toBe(firstUuid);

    resetConversationId();
    expect(globalThis.sessionStorage.getItem(KEY)).toBeNull();

    const b = getConversationId();
    expect(b).toBe(secondUuid);
    expect(b).not.toBe(a);
    expect(rr).toHaveBeenCalledTimes(2);
  });
});
