// src/organisms/ChatWidget/server/expressClient.ts
type Msg = { role: "system" | "user" | "assistant"; content: string };
const toText = (v: any): string => (typeof v === "string" ? v : "");
const isStringy = (x: any) =>
  typeof x?.content === "string" && x.content.trim().length > 0;

/** Convert your ChatWidget thread into OpenAI messages (skip JSX seeds, empties) */
function toOpenAIMessages(history: any[], latestUserText: string): Msg[] {
  const trimmed = (history ?? [])
    .filter(
      (m) => (m.role === "user" || m.role === "assistant") && isStringy(m),
    )
    .map((m) => ({ role: m.role, content: toText(m.content) }))
    // Cap context to last 24 messages for token sanity
    .slice(-24);

  // Ensure the very latest user input is present (in case the placeholder path reorders)
  if (!trimmed.length || trimmed[trimmed.length - 1].role !== "user") {
    trimmed.push({ role: "user", content: latestUserText });
  }
  return trimmed;
}

// Lightweight fetch of the dev key (same endpoint your tester uses)
async function getDevOpenAIKey(endpoint: string): Promise<string | undefined> {
  try {
    const r = await fetch(endpoint, { method: "GET" });
    if (!r.ok) return;
    const j = await r.json().catch(() => null);
    const k = j?.key ? String(j.key) : "";
    return k || undefined;
  } catch {
    return;
  }
}

export async function* streamFromExpress(params: {
  text: string;
  history: any[];
  signal: AbortSignal;
  model?: string;
  proxyUrl?: string;
  context?: any;
  maxContext?: number;

  /** NEW: upstream OpenAI-compatible base URL to use (e.g., https://api.openai.com/v1) */
  baseUrl?: string;

  /**
   * NEW: forward the dev/server-saved key as X-OpenAI-Key (DEV ONLY).
   * If true, we’ll GET it from devKeyEndpoint and attach the header.
   */
  useServerKeyHeader?: boolean;

  /** NEW: where to fetch the dev key from (defaults to same origin route) */
  devKeyEndpoint?: string; // e.g., "http://localhost:4000/api/dev/openai-key"
}): AsyncIterable<string> {
  const {
    text,
    history,
    signal,
    context,
    maxContext = 24,
    model = "gpt-4o-mini",
    proxyUrl = "",
    baseUrl,
    useServerKeyHeader = false, // NEW
    devKeyEndpoint = "/api/dev/openai-key", // NEW
  } = params;

  const messages = toOpenAIMessages(history, text).slice(-maxContext);

  const attachments = Array.isArray(context?.attachments)
    ? context.attachments
    : [];

  // NEW: optionally fetch and forward key as a header (dev-only convenience)
  let openaiKey: string | undefined;
  if (useServerKeyHeader) {
    openaiKey = await getDevOpenAIKey(devKeyEndpoint);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (openaiKey) headers["X-OpenAI-Key"] = openaiKey; // server may read this

  const res = await fetch(proxyUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages,
      text,
      history,
      attachments,
      context: { ...(context || {}), attachments },
      baseUrl, // NEW: pass through to server
    }),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Proxy ${res.status}: ${errText}`);
  }
  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
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
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) yield chunk;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }
}
