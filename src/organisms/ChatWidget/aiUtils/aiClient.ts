// src/organisms/ChatWidget/server/aiClient.ts

// NOTE: This module is safe in browser or server contexts (guarded access to window/localStorage).
import { RunAdaptersFn } from './adapters/interfaces'
type Msg = { role: "system" | "user" | "assistant"; content: string };

const LS_DEV_API_BASE = "aiTester:devApiBase";

const DEFAULTS = {
  // Use relative paths by default (same-origin). Dev API Base from localStorage can prefix these.
  SETTINGS_PATH: "/api/dev/openai-settings",
  KEY_PATH: "/api/dev/openai-key",

  // OpenAI (or compatible) upstream base for the *AI call*
  BASE_URL: "https://api.openai.com/v1",
  MODEL: "gpt-4o-mini",

  KEY_TTL_MS: 60_000,
  SETTINGS_TTL_MS: 60_000,
};

// Special tag: if any adapter emits a system message that starts with [[EMIT]],
// we will bypass the model call and immediately stream that content to the UI.
const EMIT_TAGS = ["[[EMIT]]", "[[ADAPTER:STOP]]"];

const keyCache = new Map<string, { value?: string; ts: number }>(); // keyed by endpoint
const settingsCache = new Map<string, { value?: any; ts: number }>(); // keyed by endpoint

const toText = (v: any): string => (typeof v === "string" ? v : "");
const isStringy = (x: any) =>
  typeof x?.content === "string" && x.content.trim().length > 0;

function toOpenAIMessages(
  history: any[],
  latestUserText: string,
  maxContext = 24,
): Msg[] {
  const trimmed = (history ?? [])
    .filter(
      (m) => (m.role === "user" || m.role === "assistant") && isStringy(m),
    )
    .map((m) => ({ role: m.role, content: toText(m.content) }))
    .slice(-maxContext);

  if (!trimmed.length || trimmed[trimmed.length - 1].role !== "user") {
    trimmed.push({ role: "user", content: latestUserText });
  }
  return trimmed;
}

function getDevApiBaseFromLS(): string {
  try {
    if (typeof window !== "undefined" && "localStorage" in window) {
      const v = window.localStorage.getItem(LS_DEV_API_BASE);
      return typeof v === "string" ? v : "";
    }
  } catch {}
  return "";
}

function joinUrl(base: string, p: string) {
  const left = (base || "").replace(/\/+$/, "");
  const right = (p || "/").replace(/^\/+/, "");
  return `${left}/${right}`;
}

async function fetchJSON<T = any>(
  url: string,
  init?: RequestInit,
): Promise<T | undefined> {
  try {
    const r = await fetch(url, { method: "GET", ...(init || {}) });
    if (!r.ok) return;
    return (await r.json().catch(() => undefined)) as T | undefined;
  } catch {
    return;
  }
}

async function getDevKey(
  endpoint: string,
  ttlMs = DEFAULTS.KEY_TTL_MS,
): Promise<string | undefined> {
  const now = Date.now();
  const prev = keyCache.get(endpoint);
  if (prev && now - prev.ts < ttlMs) return prev.value;

  const data = await fetchJSON<{ key?: string }>(endpoint);
  const k = (data?.key && String(data.key)) || "";
  const value = k || undefined;
  keyCache.set(endpoint, { value, ts: now });
  return value;
}

async function getSavedSettings(
  endpoint: string,
  ttlMs = DEFAULTS.SETTINGS_TTL_MS,
): Promise<any | undefined> {
  const now = Date.now();
  const prev = settingsCache.get(endpoint);
  if (prev && now - prev.ts < ttlMs) return prev.value;

  const data = await fetchJSON<{ settings?: any; hasSettings?: boolean }>(
    endpoint,
  );
  const s = data?.settings || {};
  settingsCache.set(endpoint, { value: s, ts: now });
  return s;
}

function extractDelta(obj: any): string {
  if (obj?.choices?.[0]?.delta?.content) return obj.choices[0].delta.content;
  if (obj?.choices?.[0]?.message?.content)
    return obj.choices[0].message.content;
  if (typeof obj?.content === "string") return obj.content;
  if (typeof obj?.text === "string") return obj.text;
  if (Array.isArray(obj?.content)) {
    return obj.content.map((p: any) => p?.text || p?.content || "").join("");
  }
  return "";
}

/**
 * DIRECT streaming to OpenAI-compatible upstream (matches your cURL),
 * while running adapters (if provided) in the browser or server.
 *
 * Dev API Base resolution:
 *   1) params.settingsEndpoint / params.devKeyEndpoint (absolute), if provided
 *   2) params.devApiBase (absolute) + default PATHs
 *   3) localStorage "aiTester:devApiBase" (absolute) + default PATHs
 *   4) same-origin default PATHs ("/api/dev/…")
 */
export async function* streamFromAI(params: {
  text: string;
  history: any[];
  signal: AbortSignal;
  context?: any;

  // Optional overrides (defaults read from /api/dev/openai-settings)
  model?: string; // AI model
  baseUrl?: string; // AI base URL (e.g. https://api.openai.com/v1)

  // Optional endpoint overrides
  settingsEndpoint?: string; // absolute URL
  devKeyEndpoint?: string; // absolute URL

  // Dev API Base (absolute). If provided, prefixes default PATHs.
  devApiBase?: string;

  // Optional: data API base (your app’s backend for /workdesk, etc.)
  dataBase?: string;

  // Context window cap
  maxContext?: number;

  // Force stream flag (default true)
  stream?: boolean;

  // Optional adapters runner (replaces old import)
  runAdapters?: RunAdaptersFn;
}): AsyncIterable<string> {
  const {
    text,
    history,
    signal,
    context,
    model: modelOverride,
    baseUrl: baseUrlOverride,
    settingsEndpoint,
    devKeyEndpoint,
    devApiBase,
    dataBase = typeof window !== "undefined"
      ? (window as any).__HELIX_API_BASE__ || `${window.location.origin}`
      : "http://localhost:4000",
    maxContext = 24,
    stream = true,
    runAdapters,
  } = params;

  // Resolve Dev API Base (for settings/key). Order: param → localStorage → ""
  const devBase =
    (devApiBase && devApiBase.trim()) || getDevApiBaseFromLS() || "";

  // Build endpoints if not explicitly provided
  const settingsUrl =
    settingsEndpoint ||
    (devBase
      ? joinUrl(devBase, DEFAULTS.SETTINGS_PATH)
      : DEFAULTS.SETTINGS_PATH);

  const keyUrl =
    devKeyEndpoint ||
    (devBase ? joinUrl(devBase, DEFAULTS.KEY_PATH) : DEFAULTS.KEY_PATH);

  // 1) Saved settings & key
  const saved = (await getSavedSettings(settingsUrl)) || {};
  const savedModel =
    typeof saved.model === "string" && saved.model
      ? saved.model
      : DEFAULTS.MODEL;
  const savedBaseUrl =
    typeof saved.baseUrl === "string" && saved.baseUrl
      ? saved.baseUrl
      : DEFAULTS.BASE_URL;

  const model = modelOverride || savedModel;
  const baseUrl = baseUrlOverride || savedBaseUrl;
  const key = await getDevKey(keyUrl);
  if (!key) throw new Error("Missing OpenAI key (from dev endpoint)");

  // 2) Shape user messages (assistant/user only; system comes from adapters)
  const shaped = toOpenAIMessages(history, text, maxContext);

  // 3) RUN ADAPTERS and prepend their system messages
  const systemMessages: Msg[] = runAdapters
    ? await runAdapters({
        text,
        messages: shaped, // pass the shaped conversation
        context: context || {}, // pass-through any caller-provided context (attachments, etc.)
        dataBase, // let adapters know the data API base
      })
    : [];

  // 3a) EARLY EMIT: if any system message begins with [[EMIT]], bypass the LLM entirely.
  //     We prefer the *last* such message in case multiple adapters emitted.
  const emitMsg = [...systemMessages].reverse().find((m) => {
    if (typeof m?.content !== "string") return false;
    const s = m.content.trim();
    return EMIT_TAGS.some((tag) => s.startsWith(tag));
  });

  // AFTER: stream EMIT content in small chunks so UI shows “typing”
  if (emitMsg) {
    const out = emitMsg.content.replace(
      /^\s*\[\[(?:EMIT|ADAPTER:STOP)\]\]\s*\n?/,
      "",
    );
    if (out) {
      // Split at paragraph boundaries; fall back to fixed-size chunks
      const paras = out.split(/\n{2,}/);
      if (paras.length > 1) {
        for (let i = 0; i < paras.length; i++) {
          yield (i === 0 ? "" : "\n\n") + paras[i];
          // tiny delay so the reader yields control; feels like streaming

          await new Promise((r) => setTimeout(r, 10));
        }
      } else {
        const CHUNK = 120;
        for (let i = 0; i < out.length; i += CHUNK) {
          yield out.slice(i, i + CHUNK);

          await new Promise((r) => setTimeout(r, 10));
        }
      }
    }
    return;
  }

  // 4) Final messages → identical to your cURL schema
  const messages: Msg[] = [...systemMessages, ...shaped];

  // 5) DIRECT call (no Express proxy): POST ${baseUrl}/chat/completions
  const url = joinUrl(baseUrl, "/chat/completions");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
  const body: any = { model, messages };
  if (stream) body.stream = true;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Upstream ${res.status}: ${errText}`);
  }

  const ct = (res.headers.get("content-type") || "").toLowerCase();

  // 6) Stream SSE like `curl -N`
  if (stream && ct.includes("text/event-stream") && res.body) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (signal.aborted) {
          try {
            await reader.cancel();
          } catch {}
          break;
        }
        buf += dec.decode(value, { stream: true }).replace(/\r\n/g, "\n");

        let i;
        while ((i = buf.indexOf("\n\n")) !== -1) {
          const event = buf.slice(0, i);
          buf = buf.slice(i + 2);
          for (const line of event.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") return;
            try {
              const j = JSON.parse(data);
              const delta = extractDelta(j);
              if (delta) yield delta;
            } catch {
              if (data) yield data;
            }
          }
        }
      }
      if (buf.trim()) {
        try {
          const j = JSON.parse(buf);
          const delta = extractDelta(j);
          if (delta) yield delta;
        } catch {
          if (buf) yield buf;
        }
      }
    } finally {
      try {
        reader.releaseLock();
      } catch {}
    }
    return;
  }

  // Non-SSE fallback
  const textResp = await res.text();
  try {
    const j = JSON.parse(textResp);
    const delta = extractDelta(j) || textResp;
    if (delta) yield delta;
  } catch {
    if (textResp) yield textResp;
  }
}
