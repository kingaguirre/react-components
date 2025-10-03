// src/organisms/ChatWidget/server/expressClient.ts

// IMPORTANT: must be an *async generator*; do not use `yield` in a non-generator.
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

/**
 * Stream from Express proxy and expose an AsyncIterable<string> for ChatWidget.
 * Sends OpenAI-ready `messages` and your `context` (memory) to the server.
 */
export async function* streamFromExpress(params: {
  text: string;
  history: any[];
  signal: AbortSignal;
  model?: string;
  proxyUrl?: string;
  context?: any;         // pass memory (e.g., { stats, hotset, terminology })
  maxContext?: number;   // cap messages included (default 24)
}): AsyncIterable<string> {
  const {
    text,
    history,
    signal,
    context,
    maxContext = 24,
    model = "gpt-4o-mini",
    proxyUrl = "",
  } = params;

  const messages = toOpenAIMessages(history, text).slice(-maxContext);

  const res = await fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      text,
      history,
      context,
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
        try { await reader.cancel(); } catch {}
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) yield chunk;
    }
  } finally {
    try { reader.releaseLock(); } catch {}
  }
}
