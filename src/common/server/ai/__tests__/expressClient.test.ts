// src/common/server/ai/__tests__/expressClient.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const encoder = new TextEncoder();

function makeStream(chunks: string[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
}

describe("streamFromExpress (auto-loads saved settings + key, supports overrides, caches)", () => {
  const PROXY = "https://proxy.local/stream";
  const DEVKEY_EP = "https://server.local/api/dev/openai-key";
  const SETTINGS_EP = "https://server.local/api/dev/openai-settings";

  let fetchSpy: any;

  beforeEach(() => {
    vi.resetModules(); // fresh module (resets internal caches)
    fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || "GET").toUpperCase();

      // Saved settings endpoint
      if (url === SETTINGS_EP && method === "GET") {
        return new Response(
          JSON.stringify({
            hasSettings: true,
            settings: {
              baseUrl: "https://corp.example/v1",
              model: "corp-model",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      // Dev key endpoint
      if (url === DEVKEY_EP && method === "GET") {
        return new Response(JSON.stringify({ key: "DEVKEY_123" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Proxy success — stream two chunks
      if (url === PROXY && method === "POST") {
        return new Response(makeStream(["part1-", "part2"]), { status: 200 });
      }

      return new Response("not found", { status: 404 });
    });

    // @ts-expect-error override
    global.fetch = fetchSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses explicit overrides over saved settings, forwards key in Authorization + X-OpenAI-Key, shapes/caps messages, and streams", async () => {
    // Dynamically import after resetModules so caches start empty
    const { streamFromExpress } = await import("../expressClient");

    // Make a long history to exercise filtering + maxContext
    const history: any[] = [
      { role: "system", content: "ignore me" },
      { role: "assistant", content: "" }, // empty -> drop
      { role: "user", content: "m0" },
      // add 28 alternating user/assistant so total > 24
      ...Array.from({ length: 28 }, (_, i) => ({
        role: i % 2 === 0 ? "assistant" : "user",
        content: `m${i + 1}`,
      })),
      { role: "assistant", content: "final-assistant" }, // last is assistant → latest user must be appended
    ];

    const attachments = [{ name: "f.txt", mime: "text/plain", bytesB64: "QQ==" }];

    const ac = new AbortController();

    // consume the stream
    const chunks: string[] = [];
    for await (const chunk of streamFromExpress({
      text: "LATEST_USER_INPUT",
      history,
      signal: ac.signal,
      proxyUrl: PROXY,
      settingsEndpoint: SETTINGS_EP,
      devKeyEndpoint: DEVKEY_EP,
      // overrides (should beat saved settings)
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
      maxContext: 5, // force cap below internal default
      context: { attachments, other: 1 },
    })) {
      chunks.push(chunk);
    }

    // streamed bytes
    expect(chunks.join("")).toBe("part1-part2");

    // GETs for settings + key happened
    expect(fetchSpy).toHaveBeenCalledWith(SETTINGS_EP, expect.objectContaining({ method: "GET" }));
    expect(fetchSpy).toHaveBeenCalledWith(DEVKEY_EP, expect.objectContaining({ method: "GET" }));

    // Inspect the POST call to proxy
    const postCall = fetchSpy.mock.calls.find((c: any[]) => String(c[0]) === PROXY);
    expect(postCall).toBeTruthy();

    const [, postInit] = postCall!;
    // headers include the forwarded key in both Authorization and X-OpenAI-Key
    expect(postInit.headers).toMatchObject({
      "Content-Type": "application/json",
      "Authorization": "Bearer DEVKEY_123",
      "X-OpenAI-Key": "DEVKEY_123",
    });

    // body payload checks
    const body = JSON.parse(String(postInit.body));
    expect(body.model).toBe("gpt-4o-mini"); // override beats saved
    expect(body.baseUrl).toBe("https://api.openai.com/v1"); // override beats saved
    expect(body.stream).toBe(true); // always true in client
    expect(body.attachments).toEqual(attachments);
    expect(body.context.attachments).toEqual(attachments);

    // messages shaped & capped to maxContext with latest user appended
    expect(Array.isArray(body.messages)).toBe(true);
    expect(body.messages.length).toBe(6);
    const last = body.messages[body.messages.length - 1];
    expect(last.role).toBe("user");
    expect(last.content).toBe("LATEST_USER_INPUT");
    // only 'user'/'assistant' roles appear
    expect(new Set(body.messages.map((m: any) => m.role))).toEqual(new Set(["user", "assistant"]));
  });

  it("does not append latest user if the last message is already a user", async () => {
    const { streamFromExpress } = await import("../expressClient");

    // history ends with user → no extra append
    const history = [
      { role: "user", content: "one" },
      { role: "assistant", content: "two" },
      { role: "user", content: "I am last user already" },
    ];

    // Tweak fetch to return a simple OK stream & valid settings/key
    let posted: any = null;
    (global.fetch as any) = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === SETTINGS_EP) {
        return new Response(JSON.stringify({ hasSettings: true, settings: { baseUrl: "https://s/v1", model: "m" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url === DEVKEY_EP) {
        return new Response(JSON.stringify({ key: "K" }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url === PROXY && init?.method === "POST") {
        posted = JSON.parse(String(init.body));
        return new Response(makeStream(["ok"]), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });

    const ac = new AbortController();
    for await (const _ of streamFromExpress({
      text: "latest-user-text",
      history,
      signal: ac.signal,
      proxyUrl: PROXY,
      settingsEndpoint: SETTINGS_EP,
      devKeyEndpoint: DEVKEY_EP,
      maxContext: 10,
    })) {
      // drain
    }

    expect(posted).toBeTruthy();
    const msgs = posted.messages;
    expect(msgs[msgs.length - 1]).toEqual({ role: "user", content: "I am last user already" });
    // ensure our passed 'text' didn't get appended because last was already a user
    expect(msgs.some((m: any) => m.content === "latest-user-text")).toBe(false);
  });

  it("throws on non-OK proxy response and includes status + text", async () => {
    const { streamFromExpress } = await import("../expressClient");

    (global.fetch as any) = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === SETTINGS_EP) {
        return new Response(JSON.stringify({ hasSettings: true, settings: { baseUrl: "https://s/v1", model: "m" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url === DEVKEY_EP) {
        return new Response(JSON.stringify({ key: "K" }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url === "https://bad.proxy/stream" && init?.method === "POST") {
        return new Response("boom", { status: 500 });
      }
      return new Response("not found", { status: 404 });
    });

    const ac = new AbortController();
    const iter = (async () => {
      for await (const _ of streamFromExpress({
        text: "x",
        history: [],
        signal: ac.signal,
        proxyUrl: "https://bad.proxy/stream",
        settingsEndpoint: SETTINGS_EP,
        devKeyEndpoint: DEVKEY_EP,
      })) {
        /* noop */
      }
    })();

    await expect(iter).rejects.toThrow(/Proxy 500: boom/);
  });

  it("uses saved settings when no overrides are provided", async () => {
    const { streamFromExpress } = await import("../expressClient");

    let posted: any = null;
    (global.fetch as any) = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === SETTINGS_EP) {
        return new Response(
          JSON.stringify({
            hasSettings: true,
            settings: { baseUrl: "https://saved.base/v1", model: "saved-model" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url === DEVKEY_EP) {
        return new Response(JSON.stringify({ key: "KEY" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url === PROXY && init?.method === "POST") {
        posted = JSON.parse(String(init.body));
        return new Response(makeStream(["ok"]), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });

    const ac = new AbortController();
    for await (const _ of streamFromExpress({
      text: "hello",
      history: [{ role: "user", content: "hi" }],
      signal: ac.signal,
      proxyUrl: PROXY,
      settingsEndpoint: SETTINGS_EP,
      devKeyEndpoint: DEVKEY_EP,
    })) {
      // drain
    }

    expect(posted).toBeTruthy();
    expect(posted.model).toBe("saved-model");
    expect(posted.baseUrl).toBe("https://saved.base/v1");
  });

  it("caches dev key and settings within TTL (single GET each for two consecutive calls)", async () => {
    const { streamFromExpress } = await import("../expressClient");

    // fresh spy with counters
    const calls: { keyGET: number; settingsGET: number; proxyPOST: number } = {
      keyGET: 0,
      settingsGET: 0,
      proxyPOST: 0,
    };

    (global.fetch as any) = vi.fn(async (url: string, init?: RequestInit) => {
      const method = (init?.method || "GET").toUpperCase();
      if (url === SETTINGS_EP && method === "GET") {
        calls.settingsGET++;
        return new Response(
          JSON.stringify({ hasSettings: true, settings: { baseUrl: "https://s/v1", model: "m" } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url === DEVKEY_EP && method === "GET") {
        calls.keyGET++;
        return new Response(JSON.stringify({ key: "KEY" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url === PROXY && method === "POST") {
        calls.proxyPOST++;
        return new Response(makeStream(["ok"]), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });

    const ac1 = new AbortController();
    for await (const _ of streamFromExpress({
      text: "first",
      history: [],
      signal: ac1.signal,
      proxyUrl: PROXY,
      settingsEndpoint: SETTINGS_EP,
      devKeyEndpoint: DEVKEY_EP,
    })) { /* drain */ }

    const ac2 = new AbortController();
    for await (const _ of streamFromExpress({
      text: "second",
      history: [],
      signal: ac2.signal,
      proxyUrl: PROXY,
      settingsEndpoint: SETTINGS_EP,
      devKeyEndpoint: DEVKEY_EP,
    })) { /* drain */ }

    expect(calls.proxyPOST).toBe(2);
    expect(calls.keyGET).toBe(1);       // cached for second call
    expect(calls.settingsGET).toBe(1);  // cached for second call
  });
});
