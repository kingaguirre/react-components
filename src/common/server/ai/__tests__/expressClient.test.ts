// src/common/server/ai/__tests__/expressClient.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
// 🔧 adjust path if your repo differs
import { streamFromExpress } from "../expressClient";

const encoder = new TextEncoder();

function makeStream(chunks: string[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
}

describe("streamFromExpress", () => {
  const PROXY = "https://proxy.local/stream";
  const DEVKEY_EP = "https://server.local/api/dev/openai-key";

  let fetchSpy: any;

  beforeEach(() => {
    // fresh fetch mock per test
    fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || "GET").toUpperCase();

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

  it("shapes messages, forwards dev key as header, and streams chunks", async () => {
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
      { role: "assistant", content: "final-assistant" }, // not user -> latest user must be appended
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
      baseUrl: "https://api.openai.com/v1",
      useServerKeyHeader: true,
      devKeyEndpoint: DEVKEY_EP,
      model: "gpt-4o-mini",
      maxContext: 5, // force cap below the internal 24 cap
      context: { attachments, other: 1 },
    })) {
      chunks.push(chunk);
    }

    // streamed bytes
    expect(chunks.join("")).toBe("part1-part2");

    // GET for dev key happened once
    expect(fetchSpy).toHaveBeenCalledWith(DEVKEY_EP, expect.objectContaining({ method: "GET" }));

    // Inspect the POST call to proxy
    const postCall = fetchSpy.mock.calls.find((c: any[]) => String(c[0]) === PROXY);
    expect(postCall).toBeTruthy();

    const [, postInit] = postCall!;
    // headers include the forwarded key
    expect(postInit.headers).toMatchObject({
      "Content-Type": "application/json",
      "X-OpenAI-Key": "DEVKEY_123",
    });

    // body payload checks
    const body = JSON.parse(String(postInit.body));
    expect(body.model).toBe("gpt-4o-mini");
    expect(body.baseUrl).toBe("https://api.openai.com/v1");
    expect(body.attachments).toEqual(attachments);
    expect(body.context.attachments).toEqual(attachments);

    // messages shaped & capped to maxContext with latest user appended
    expect(Array.isArray(body.messages)).toBe(true);
    expect(body.messages.length).toBe(5);
    const last = body.messages[body.messages.length - 1];
    expect(last.role).toBe("user");
    expect(last.content).toBe("LATEST_USER_INPUT");
    // only 'user'/'assistant' roles appear
    expect(new Set(body.messages.map((m: any) => m.role))).toEqual(new Set(["user", "assistant"]));
  });

  it("does not add latest user if the last message is already a user", async () => {
    // history ends with user → no extra append
    const history = [
      { role: "user", content: "one" },
      { role: "assistant", content: "two" },
      { role: "user", content: "I am last user already" },
    ];

    // Tweak fetch to capture POST body
    let posted: any = null;
    (global.fetch as any) = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === PROXY && init?.method === "POST") {
        posted = JSON.parse(String(init.body));
        return new Response(makeStream(["ok"]), { status: 200 });
      }
      if (url === DEVKEY_EP) {
        return new Response(JSON.stringify({ key: "K" }), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });

    const ac = new AbortController();
    // drain iterator to trigger POST
    for await (const _ of streamFromExpress({
      text: "latest-user-text",
      history,
      signal: ac.signal,
      proxyUrl: PROXY,
      useServerKeyHeader: true,
      devKeyEndpoint: DEVKEY_EP,
      maxContext: 10,
    })) { /* noop */ }

    expect(posted).toBeTruthy();
    const msgs = posted.messages;
    expect(msgs[msgs.length - 1]).toEqual({ role: "user", content: "I am last user already" });
    // ensure our passed 'text' didn't get appended because last was already a user
    expect(msgs.some((m: any) => m.content === "latest-user-text")).toBe(false);
  });

  it("throws on non-OK proxy response and includes status + text", async () => {
    (global.fetch as any) = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === PROXY && init?.method === "POST") {
        return new Response("boom", { status: 500 });
      }
      return new Response(JSON.stringify({ key: "K" }), { status: 200 });
    });

    const ac = new AbortController();
    const iter = (async () => {
      for await (const _ of streamFromExpress({
        text: "x",
        history: [],
        signal: ac.signal,
        proxyUrl: PROXY,
        useServerKeyHeader: true,
        devKeyEndpoint: DEVKEY_EP,
      })) { /* noop */ }
    })();

    await expect(iter).rejects.toThrow(/Proxy 500: boom/);
  });
});
