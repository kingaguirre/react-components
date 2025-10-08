// src/common/server/ai/__tests__/streamFactory.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// 🔧 adjust path if needed
import { createAIStreamHandler, aiDownloadRoute } from "../streamFactory";

// --- Mock OpenAI SDK --------------------------------------------------------
type CreateArgs = any;
const createMock = vi.fn<[], any>();

let lastClientOpts: any = null;

vi.mock("openai", () => {
  class OpenAI {
    chat: any;
    constructor(opts: any) {
      lastClientOpts = opts;
      this.chat = { completions: { create: createMock } };
    }
  }
  return { default: OpenAI };
});

// --- Helpers ----------------------------------------------------------------
function asyncStream(chunks: string[], controller?: { abort?: () => void }) {
  return {
    controller,
    async *[Symbol.asyncIterator]() {
      for (const c of chunks) {
        await Promise.resolve();
        yield { choices: [{ delta: { content: c } }] };
      }
    },
  };
}

function makeReq(overrides: Partial<any> = {}) {
  const headers: Record<string, string> = overrides.headers ?? {};
  const listeners: Record<string, Function[]> = {};
  return {
    body: overrides.body ?? {},
    get: (name: string) => headers[name.toLowerCase()],
    on: (evt: string, cb: Function) => {
      (listeners[evt] ||= []).push(cb);
    },
    _emit: (evt: string, ...args: any[]) => {
      for (const fn of listeners[evt] || []) fn(...args);
    },
    ...overrides,
  };
}

function makeRes() {
  const listeners: Record<string, Function[]> = {};
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let ended = false;
  let destroyed = false;
  let out = "";

  const res = {
    setHeader: (k: string, v: string) => { headers[k] = v; },
    getHeader: (k: string) => headers[k],
    status: (n: number) => { statusCode = n; return res; },
    get statusCode() { return statusCode; },
    write: (s: string) => { out += String(s); return true; },
    end: (s?: string) => { if (s) out += String(s); ended = true; },
    send: (b: any) => { out += typeof b === "string" ? b : String(b); ended = true; },
    once: (evt: string, cb: Function) => { (listeners[evt] ||= []).push(cb); },
    on: (evt: string, cb: Function) => { (listeners[evt] ||= []).push(cb); },
    _emit: (evt: string, ...args: any[]) => { for (const fn of listeners[evt] || []) fn(...args); },
    get destroyed() { return destroyed; },
    _destroy: () => { destroyed = true; res._emit("close"); },
    get headersSent() { return false; },
    get output() { return out; },
    get ended() { return ended; },
  };
  return res;
}

function makePlugin() {
  // captured for download tests
  let capturedMakeDownloadLink: ((buf: Buffer, name: string, mime: string, ttl?: number) => string) | null = null;

  const factory = ({ makeDownloadLink }: any) => {
    capturedMakeDownloadLink = makeDownloadLink;
    return {
      // inject session id as the sys message so we can assert it
      async buildMemory({ context }: any) {
        return { role: "system", content: `SYS:${context.sessionId}` };
      },
      async augment({ text }: any) {
        return [{ role: "system", content: `AUG:${text}` }];
      },
      scopeCheck: ({ text }: any) => (text === "BLOCK" ? "BLOCKED\n" : ""),
    };
  };

  return { factory, getLinkMaker: () => capturedMakeDownloadLink };
}

// --- Fake timers for download expiry
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-10-07T00:00:00Z"));
  createMock.mockReset();
  lastClientOpts = null;
});
afterEach(() => {
  vi.useRealTimers();
});

// --- Tests ------------------------------------------------------------------
describe("createAIStreamHandler — streaming + config overrides", () => {
  it("streams deltas, composes messages (sysMem + augment + client), and respects key/baseURL overrides", async () => {
    const { factory } = makePlugin();

    // openai stream yields two parts
    createMock.mockResolvedValue(
      asyncStream(["hello", "world"])
    );

    const handler = createAIStreamHandler({
      plugin: factory,
      openaiApiKey: "ENV_KEY",
      baseUrl: "http://app.local",
    });

    const req = makeReq({
      headers: { "x-openai-key": "HEADER_KEY" },
      body: {
        model: "gpt-4o-mini",
        temperature: 0.3,
        baseUrl: "https://api.openai.com/v1",
        text: "hi",
        context: { sessionId: "s-123" },
        messages: [
          { role: "user", id: "u1", createdAt: 1, content: "U1" },
          { role: "assistant", id: "a1", createdAt: 2, content: "A1" },
        ],
      },
    });
    const res = makeRes();

    await handler(req, res);

    // streamed output
    expect(res.output).toBe("helloworld");
    expect(res.ended).toBe(true);

    // OpenAI client constructed with header key and baseURL override
    expect(lastClientOpts).toMatchObject({
      apiKey: "HEADER_KEY",
      baseURL: "https://api.openai.com/v1",
    });

    // validate messages composition in the create() call
    const call = createMock.mock.calls[0][0] as CreateArgs;
    expect(call.model).toBe("gpt-4o-mini");
    expect(call.stream).toBe(true);
    expect(call.temperature).toBe(0.3);

    const msgs = call.messages;
    expect(msgs[0]).toEqual(expect.objectContaining({ role: "system" }));         // SYS
    expect(String(msgs[0].content)).toMatch(/^SYS:s-123:/); // sessionId augmented with fingerprint
    expect(msgs[1]).toEqual({ role: "system", content: "AUG:hi" });              // AUG
    expect(msgs.slice(2)).toEqual([
      { role: "user", id: "u1", createdAt: 1, content: "U1" },
      { role: "assistant", id: "a1", createdAt: 2, content: "A1" },
    ]);
  });

  it("short-circuits with scope guard message and never calls OpenAI", async () => {
    const { factory } = makePlugin();
    const handler = createAIStreamHandler({
      plugin: factory,
      openaiApiKey: "ENV_KEY",
      baseUrl: "http://app.local",
      enableScopeGuard: true,
    });

    const req = makeReq({
      headers: { "x-openai-key": "HEADER_KEY" },
      body: { text: "BLOCK", messages: [], context: { sessionId: "x" } },
    });
    const res = makeRes();

    await handler(req, res);
    expect(res.output).toContain("BLOCKED");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 400 if no API key is available from header or factory", async () => {
    const { factory } = makePlugin();
    const handler = createAIStreamHandler({
      plugin: factory,
      openaiApiKey: "", // none
      baseUrl: "http://app.local",
    });

    const req = makeReq({ body: { text: "hi", messages: [] } });
    const res = makeRes();

    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.output).toMatch(/OpenAI key missing/);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("surfaces OpenAI.create errors as 500", async () => {
    const { factory } = makePlugin();
    const handler = createAIStreamHandler({
      plugin: factory,
      openaiApiKey: "ENV_KEY",
      baseUrl: "http://app.local",
    });

    createMock.mockRejectedValueOnce(new Error("boom"));

    const req = makeReq({ body: { text: "x", messages: [], context: { sessionId: "s" } } });
    const res = makeRes();

    await handler(req, res);
    expect(res.statusCode).toBe(500);
    expect(res.output).toMatch(/ERROR: boom/);
  });

  it("aborts the OpenAI stream when response closes", async () => {
    const { factory } = makePlugin();
    const handler = createAIStreamHandler({
      plugin: factory,
      openaiApiKey: "K",
      baseUrl: "http://app.local",
    });

    // Build an abortable stream: yield once, then wait until abort() is called,
    // then throw AbortError so the handler exits cleanly.
    const controller = {
      aborted: false,
      abort: vi.fn(function () {
        // keep function form so `this` works if needed later
        controller.aborted = true;
      }),
    };
    const abortableStream = {
      controller,
      async *[Symbol.asyncIterator]() {
        // first chunk goes out
        yield { choices: [{ delta: { content: "first" } }] };
        // now hang until abort() is invoked
        // (tick in a loop so the test can trigger close deterministically)
        while (!controller.aborted) {
          await new Promise((r) => setTimeout(r, 5));
        }
        const err: any = new Error("aborted");
        err.name = "AbortError";
        throw err;
      },
    };
    createMock.mockResolvedValue(abortableStream as any);

    const req = makeReq({ body: { text: "x", messages: [], context: { sessionId: "s" } } });
    const res = makeRes();

    const p = handler(req, res);
    // ensure create() ran and the handler had a chance to attach the "close" listener
    await vi.waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    // now fire both close + aborted to be extra safe
    res._destroy();
    req._emit("aborted");
    // advance the 5ms poll in the abortable stream
    await vi.advanceTimersByTimeAsync(10);
    await p;

    expect(controller.abort).toHaveBeenCalled();
    expect(res.ended).toBe(true);
    // first chunk may or may not have been written depending on timing; assert we didn't hang
  });
});

describe("aiDownloadRoute + makeDownloadLink integration", () => {
  it("serves a registered buffer and expires after TTL", async () => {
    // capture the link maker by instantiating a handler once
    const { factory, getLinkMaker } = makePlugin();
    createAIStreamHandler({
      plugin: factory,
      openaiApiKey: "K",
      baseUrl: "http://app.local",
    });

    const makeLink = getLinkMaker()!;
    expect(makeLink).toBeTruthy();

    // register with 1s TTL
    const url = makeLink(Buffer.from("abc"), "file.csv", "text/csv", 1000);
    const token = url.split("/__ai-download/")[1];
    expect(token).toBeTruthy();

    // request before expiry
    {
      const req = { params: { token } } as any;
      const res = makeRes();
      aiDownloadRoute(req, res);
      expect(res.getHeader("Content-Type")).toBe("text/csv");
      expect(res.getHeader("Content-Disposition")).toContain('file.csv');
      expect(res.output).toBe("abc");
      expect(res.ended).toBe(true);
    }

    // advance time beyond TTL → expired
    vi.setSystemTime(new Date(Date.now() + 2001));
    {
      const req = { params: { token } } as any;
      const res = makeRes();
      aiDownloadRoute(req, res);
      expect(res.statusCode).toBe(404);
      expect(res.output).toMatch(/expired|not found/i);
    }
  });
});
