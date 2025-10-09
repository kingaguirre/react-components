import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Helpers to collect async iterator output and to build JSON Responses
const asJson = (obj: any, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });

async function collect(it: AsyncIterable<string>): Promise<string> {
  let acc = "";
  for await (const chunk of it) acc += chunk;
  return acc;
}

let originalFetch: any;

// Re-import the module fresh each test to avoid cache bleed for internal maps
async function loadClient() {
  vi.resetModules();
  const mod = await import("../aiClient");
  return mod as { streamFromAI: typeof import("../aiClient").streamFromAI };
}

beforeEach(() => {
  originalFetch = global.fetch;
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("streamFromAI (server/aiClient.ts)", () => {
  it("EMIT: still fetches settings/key, skips upstream /chat/completions, streams adapter content", async () => {
    const { streamFromAI } = await loadClient();

    // 1) settings
    (fetch as any as vi.Mock).mockImplementationOnce((url: string) => {
      expect(url).toBe("/api/dev/openai-settings");
      return asJson({ settings: { model: "gpt-4o-mini", baseUrl: "https://up.example/v1" } });
    });
    // 2) key
    (fetch as any as vi.Mock).mockImplementationOnce((url: string) => {
      expect(url).toBe("/api/dev/openai-key");
      return asJson({ key: "sk-test" });
    });
    // 3) if upstream is called, fail
    (fetch as any as vi.Mock).mockImplementationOnce(() => {
      throw new Error("Upstream /chat/completions should NOT be called when [[EMIT]] is returned by adapters");
    });

    const it = streamFromAI({
      text: "show something",
      history: [],
      signal: new AbortController().signal,
      context: {},
      runAdapters: async () => [
        { role: "system", content: "[[EMIT]]\nHello world" },
      ],
      // stream flag doesn't matter here; EMIT short-circuits before upstream
    });

    const out = await collect(it);
    expect(out).toBe("Hello world");
    // Two calls: settings + key
    expect((fetch as any as vi.Mock).mock.calls.length).toBe(2);
  });

  it("calls upstream /chat/completions when no EMIT and returns non-SSE JSON content", async () => {
    const { streamFromAI } = await loadClient();

    // 1) settings
    (fetch as any as vi.Mock).mockImplementationOnce((url: string) => {
      expect(url).toBe("/api/dev/openai-settings");
      return asJson({ settings: { model: "gpt-4o-mini", baseUrl: "https://up.example/v1" } });
    });
    // 2) key
    (fetch as any as vi.Mock).mockImplementationOnce((url: string) => {
      expect(url).toBe("/api/dev/openai-key");
      return asJson({ key: "sk-test" });
    });
    // 3) upstream call
    (fetch as any as vi.Mock).mockImplementationOnce((url: string, init: any) => {
      expect(url).toBe("https://up.example/v1/chat/completions");
      const body = JSON.parse(init.body);
      expect(body.model).toBe("gpt-4o-mini");
      expect(Array.isArray(body.messages)).toBe(true);
      return asJson({ choices: [{ message: { content: "Hello from upstream" } }] });
    });

    const out = await collect(
      streamFromAI({
        text: "Hi there",
        history: [],
        signal: new AbortController().signal,
        runAdapters: async () => [{ role: "system", content: "SYS" }],
        stream: false, // force non-SSE code path
      }),
    );

    expect(out).toBe("Hello from upstream");
    expect((fetch as any as vi.Mock).mock.calls.length).toBe(3);
  });

  it("uses devApiBase override to form settings/key endpoints", async () => {
    const { streamFromAI } = await loadClient();

    // devApiBase override → endpoints should be `${devApiBase}/api/dev/openai-settings|key`
    (fetch as any as vi.Mock).mockImplementationOnce((url: string) => {
      expect(url).toBe("https://dev.local/api/dev/openai-settings");
      return asJson({ settings: { model: "gpt-4o-mini", baseUrl: "https://api.test/v1" } });
    });
    (fetch as any as vi.Mock).mockImplementationOnce((url: string) => {
      expect(url).toBe("https://dev.local/api/dev/openai-key");
      return asJson({ key: "sk-test" });
    });
    (fetch as any as vi.Mock).mockImplementationOnce((url: string) => {
      expect(url).toBe("https://api.test/v1/chat/completions");
      return asJson({ choices: [{ message: { content: "ok" } }] });
    });

    const out = await collect(
      streamFromAI({
        text: "ping",
        history: [],
        devApiBase: "https://dev.local",
        signal: new AbortController().signal,
        runAdapters: async () => [],
        stream: false,
      }),
    );

    expect(out).toBe("ok");
    expect((fetch as any as vi.Mock).mock.calls.length).toBe(3);
  });

  it("shapes history to include the latest user message if last is not user", async () => {
    const { streamFromAI } = await loadClient();

    // 1) settings
    (fetch as any as vi.Mock).mockImplementationOnce(() =>
      asJson({ settings: { model: "gpt-4o-mini", baseUrl: "https://api.test/v1" } }),
    );
    // 2) key
    (fetch as any as vi.Mock).mockImplementationOnce(() => asJson({ key: "sk-test" }));
    // 3) upstream
    (fetch as any as vi.Mock).mockImplementationOnce((url: string, init: any) => {
      expect(url).toBe("https://api.test/v1/chat/completions");
      const body = JSON.parse(init.body);
      // history ends with assistant, so latest user message must be appended
      const roles = body.messages.map((m: any) => m.role);
      expect(roles).toEqual(["user", "assistant", "user"]);
      expect(body.messages.at(-1).content).toBe("latest user");
      return asJson({ choices: [{ message: { content: "done" } }] });
    });

    const history = [
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi!" },
    ];

    const out = await collect(
      streamFromAI({
        text: "latest user",
        history,
        signal: new AbortController().signal,
        runAdapters: async () => [],
        stream: false, // non-SSE branch
      }),
    );

    expect(out).toBe("done");
    expect((fetch as any as vi.Mock).mock.calls.length).toBe(3);
  });
});
