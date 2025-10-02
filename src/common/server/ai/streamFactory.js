// server/ai/streamFactory.js
import OpenAI from "openai";

// Minimal plugin interface:
// {
//   name: string,
//   terminology?: object,
//   fetchAll: (baseUrl) => Promise<any[]>,
//   fetchLatestN?: (n, baseUrl) => Promise<any[]>,  // optional fast path
//   normalizeMs: (row) => number,                   // timestamp ms for sort/range
//   statusOf: (row) => string,                      // status string
//   sampleOf: (row) => object,                      // compact sample for prompt
//   parseRange?: (q, nowMs) => {sinceMs, untilMs, label}|null,
//   parseTopN?: (q) => { n }|null,
// }

const DAY = 24 * 60 * 60 * 1000;

function defaultParseRange(q, nowMs) {
  q = String(q || "").toLowerCase();
  const words = { one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,couple:2,few:3 };
  const wnum = (w) => words[w] ?? undefined;

  let m = q.match(/\b(last|past)\s+(\d+)\s*(day|days|week|weeks|month|months)\b/i);
  if (m) {
    const n = Number(m[2]);
    const u = m[3].toLowerCase();
    const span = u.startsWith("week") ? 7*DAY : u.startsWith("month") ? 30*DAY : DAY;
    return { sinceMs: nowMs - n*span, untilMs: nowMs, label: `last ${n} ${u}` };
  }

  m = q.match(/\b(last|past)\s+(one|two|three|four|five|six|seven|eight|nine|ten|couple|few)\s*(day|days|week|weeks|month|months)\b/i);
  if (m) {
    const n = wnum(m[2]) ?? 1;
    const u = m[3].toLowerCase();
    const span = u.startsWith("week") ? 7*DAY : u.startsWith("month") ? 30*DAY : DAY;
    return { sinceMs: nowMs - n*span, untilMs: nowMs, label: `last ${n} ${u}` };
  }

  if (/\b(previous|last)\s+week\b/i.test(q)) {
    return { sinceMs: nowMs - 7*DAY, untilMs: nowMs, label: "last week" };
  }
  if (/\bfortnight\b/i.test(q)) {
    return { sinceMs: nowMs - 14*DAY, untilMs: nowMs, label: "last 2 weeks" };
  }
  return null;
}
function defaultParseTopN(q) {
  q = String(q || "").toLowerCase();
  let m = q.match(/\b(top|latest)\s+(\d{1,4})\b/);
  if (m) return { n: Math.max(1, Math.min(1000, Number(m[2]))) };
  m = q.match(/\b(\d{1,4})\s+(transactions|rows|records|entries|txns?|orders|tickets)\b/);
  if (m) return { n: Math.max(1, Math.min(1000, Number(m[1]))) };
  if (/\blatest\s+(transaction|row|record|entry|txn|order|ticket)\b/.test(q)) return { n: 1 };
  return null;
}

/**
 * Factory: returns an Express handler for streaming Chat Completions.
 * - plugin: domain adapter with buildMemory() and augment() (see workdeskPlugin).
 * - baseUrl: origin to call your own backend (e.g., http://localhost:4000)
 */
export function createAIStreamHandler({
  plugin,
  openaiApiKey,
  baseUrl,
  cacheTtlMs = 0,
  enableScopeGuard = true,
  outOfScopeMessage,
}) {
  const openai = new OpenAI({ apiKey: openaiApiKey });
  const domain = plugin({ baseUrl, cacheTtlMs });

  return async function aiStreamHandler(req, res) {
    // Streaming-friendly headers
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
    } = req.body ?? {};

    // ---- optional scope guard (off-topic short-circuit) ----
    if (enableScopeGuard && typeof domain.scopeCheck === "function") {
      const guardMsg = domain.scopeCheck({
        text,
        messages,
      }) || outOfScopeMessage; // plugin decides; caller can override

      if (guardMsg) {
        // stream a tiny reply and exit early (no model call)
        res.write(guardMsg);
        try { return res.end(); } catch { return; }
      }
    }

    // Build memory/system messages (terminology + snapshot + hotset)
    const sysMem = await domain.buildMemory({ context }).catch(() => null);

    // Deepen on intent (oldest/earliest, ranges, specific years/months, topN, TRN, etc.)
    const deepMsgs = await domain.augment({
      text: String(text || "").trim(),
      messages,
      context,
    }).catch(() => []);

    const finalMessages = [
      ...(sysMem ? [sysMem] : []),
      ...deepMsgs,
      ...messages,
    ];

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

    const onClose = () => {
      try { stream.controller?.abort?.(); } catch {}
    };
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
      const isAbort =
        err?.name === "AbortError" ||
        msg.includes("aborted") ||
        msg.includes("socket hang up");
      if (!isAbort) {
        if (!res.headersSent) res.status(500).end(`ERROR: ${msg}`);
        else try { res.write(`\nERROR: ${msg}`); } catch {}
      }
    } finally {
      try { res.end(); } catch {}
    }
  };
}

