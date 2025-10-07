// server/ai/streamFactory.js
import OpenAI from "openai";

/**
 * Factory: returns an Express handler for streaming Chat Completions.
 * - plugin: domain adapter with buildMemory() and augment()
 * - baseUrl: origin to call your own backend (e.g., http://localhost:4000)
 */

// Simple ephemeral download registry (memory-only)
const __downloads = new Map(); // token -> { buf, mime, name, expiresAt }
function registerDownload(buf, name, mime, ttlMs = 10 * 60 * 1000) {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  __downloads.set(token, { buf, mime, name, expiresAt: Date.now() + ttlMs });
  return token;
}

// Express route to serve downloads
export function aiDownloadRoute(req, res) {
  const { token } = req.params || {};
  const item = __downloads.get(token);
  if (!item || Date.now() > item.expiresAt) {
    __downloads.delete(token);
    return res.status(404).end("Link expired or not found");
  }
  res.setHeader("Content-Type", item.mime);
  res.setHeader("Content-Disposition", `attachment; filename="${item.name}"`);
  res.send(item.buf);
}

/** Stable fingerprint per **chat** (not per browser tab) based on message identities */
function stableChatFingerprint(messages = []) {
  // Use the first 2–3 messages’ ids & timestamps; avoids coupling to text
  const head = messages
    .filter(m => m && (m.role === "assistant" || m.role === "user"))
    .slice(0, 3)
    .map(m => `${m.role}:${m.id ?? ""}:${m.createdAt ?? ""}`)
    .join("|");

  // Tiny hash → base36
  let h = 2166136261;
  for (let i = 0; i < head.length; i++) {
    h ^= head.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return (h >>> 0).toString(36);
}

export function createAIStreamHandler({
  plugin,
  openaiApiKey,       // default/fallback
  baseUrl,            // your app/base origin (NOT OpenAI base URL) – unchanged
  cacheTtlMs = 0,
  enableScopeGuard = true,
}) {
  const openai = new OpenAI({ apiKey: openaiApiKey });

  // Provide a link maker that uses the registry + your server base URL
  function makeDownloadLink(buf, filename, mime, ttlMs) {
    const token = registerDownload(buf, filename, mime, ttlMs);
    const origin = process.env.PUBLIC_API_ORIGIN || "http://localhost:4000";
    return `${origin}/__ai-download/${token}`;
  }

  const domain = plugin({ baseUrl, cacheTtlMs, makeDownloadLink });

  return async function aiStreamHandler(req, res) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");

    const {
      model = process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages = [],
      temperature = 0.2,
      text = "",
      context = {},
      baseUrl: requestBaseUrl, // <-- NEW: OpenAI-compatible base URL from client body
    } = req.body ?? {};

    // Optional guard as before...
    try {
      if (enableScopeGuard && typeof domain.scopeCheck === "function") {
        const guardMsg = domain.scopeCheck({ text, messages, context });
        if (guardMsg) { res.write(guardMsg); return res.end(); }
      }
    } catch {}

    // ----- NEW: per-request OpenAI config (key + baseURL) -----
    // Priority: header > env default provided to factory
    const overrideKey = req.get("x-openai-key");
    const effectiveKey = overrideKey || openaiApiKey;
    if (!effectiveKey) {
      return res.status(400).end("OpenAI key missing (env or X-OpenAI-Key).");
    }

    const effectiveBaseURL =
      (typeof requestBaseUrl === "string" && requestBaseUrl.trim()) ||
      process.env.OPENAI_BASE_URL || // optional env-level override
      undefined;

    // Build client with overrides
    const openai = new OpenAI({
      apiKey: effectiveKey,
      ...(effectiveBaseURL ? { baseURL: effectiveBaseURL } : {}),
    });
    // -----------------------------------------------------------

    // ----- (unchanged) scope/session plumbing -----
    const clientContext = context || {};
    const chatFp = stableChatFingerprint(messages);
    const effectiveSessionId = `${clientContext.sessionId || "default"}:${chatFp}`;
    const serverContext = { ...clientContext, sessionId: effectiveSessionId };

    const sysMem = await domain.buildMemory({ context: serverContext }).catch(() => null);
    const deepMsgs = await domain.augment({
      text: String(text || "").trim(),
      messages,
      context: serverContext,
    }).catch(() => []);

    const finalMessages = [
      ...(sysMem ? [sysMem] : []),
      ...deepMsgs,
      ...messages,
    ];

    // ----- streaming -----
    let stream;
    try {
      stream = await openai.chat.completions.create({
        model,
        stream: true,
        temperature,
        messages: finalMessages,
      });
    } catch (e) {
      if (!res.headersSent) {
        return res.status(500).end(`ERROR: ${e?.message || String(e)}`);
      }
      return;
    }

    const onClose = () => { try { stream.controller?.abort?.(); } catch {} };
    res.on("close", onClose);
    req.on("aborted", onClose);

    try {
      for await (const part of stream) {
        const delta = part?.choices?.[0]?.delta?.content ?? "";
        if (!delta) continue;
        const ok = res.write(delta);
        if (!ok) await new Promise(r => res.once("drain", r));
        if (res.destroyed) break;
      }
    } catch (err) {
      const msg = String(err?.message || err);
      const isAbort = err?.name === "AbortError" || msg.includes("aborted") || msg.includes("socket hang up");
      if (!isAbort) {
        if (!res.headersSent) res.status(500).end(`ERROR: ${msg}`);
        else try { res.write(`\nERROR: ${msg}`); } catch {}
      }
    } finally {
      try { res.end(); } catch {}
    }
  };
}
