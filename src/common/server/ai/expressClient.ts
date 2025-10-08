// src/organisms/ChatWidget/server/expressClient.ts
type Msg = { role: "system" | "user" | "assistant"; content: string };

const DEFAULTS = {
  PROXY_URL: "http://localhost:4000/api/ai/stream",
  SETTINGS_ENDPOINT: "http://localhost:4000/api/dev/openai-settings",
  KEY_ENDPOINT: "http://localhost:4000/api/dev/openai-key",
  BASE_URL: "https://api.openai.com/v1",
  MODEL: "gpt-4o-mini",
  KEY_TTL_MS: 60_000,
  SETTINGS_TTL_MS: 60_000,
};

let __cachedKey: string | undefined;
let __keyFetchedAt = 0;

let __cachedSettings: any | undefined;
let __settingsFetchedAt = 0;

const toText = (v: any): string => (typeof v === "string" ? v : "");
const isStringy = (x: any) =>
  typeof x?.content === "string" && x.content.trim().length > 0;

function toOpenAIMessages(history: any[], latestUserText: string, maxContext = 24): Msg[] {
  const trimmed = (history ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && isStringy(m))
    .map((m) => ({ role: m.role, content: toText(m.content) }))
    .slice(-maxContext);

  if (!trimmed.length || trimmed[trimmed.length - 1].role !== "user") {
    trimmed.push({ role: "user", content: latestUserText });
  }
  return trimmed;
}

async function fetchJSON<T = any>(url: string): Promise<T | undefined> {
  try {
    const r = await fetch(url, { method: "GET" });
    if (!r.ok) return;
    return (await r.json().catch(() => undefined)) as T | undefined;
  } catch {
    return;
  }
}

async function getDevKey(endpoint = DEFAULTS.KEY_ENDPOINT): Promise<string | undefined> {
  const now = Date.now();
  if (__cachedKey && now - __keyFetchedAt < DEFAULTS.KEY_TTL_MS) return __cachedKey;

  const data = await fetchJSON<{ key?: string }>(endpoint);
  const k = (data?.key && String(data.key)) || "";
  __cachedKey = k || undefined;
  __keyFetchedAt = Date.now();
  return __cachedKey;
}

async function getSavedSettings(endpoint = DEFAULTS.SETTINGS_ENDPOINT): Promise<any | undefined> {
  const now = Date.now();
  if (__cachedSettings && now - __settingsFetchedAt < DEFAULTS.SETTINGS_TTL_MS) return __cachedSettings;

  const data = await fetchJSON<{ settings?: any; hasSettings?: boolean }>(endpoint);
  const s = data?.settings || {};
  __cachedSettings = s;
  __settingsFetchedAt = Date.now();
  return __cachedSettings;
}

/**
 * Minimal streaming client.
 * - Auto-loads saved settings (baseUrl/model) and dev key from your dev endpoints.
 * - Explicit params override the saved values.
 */
export async function* streamFromExpress(params: {
  text: string;
  history: any[];
  signal: AbortSignal;
  context?: any;

  // Optional overrides (default is to use saved settings)
  model?: string;
  baseUrl?: string;

  // Optional endpoint overrides
  proxyUrl?: string;
  settingsEndpoint?: string;
  devKeyEndpoint?: string;

  // Context window cap
  maxContext?: number;
}): AsyncIterable<string> {
  const {
    text,
    history,
    signal,
    context,
    model: modelOverride,
    baseUrl: baseUrlOverride,
    proxyUrl = DEFAULTS.PROXY_URL,
    settingsEndpoint = DEFAULTS.SETTINGS_ENDPOINT,
    devKeyEndpoint = DEFAULTS.KEY_ENDPOINT,
    maxContext = 24,
  } = params;

  // Pull saved settings/key
  const saved = (await getSavedSettings(settingsEndpoint)) || {};
  const savedModel = typeof saved.model === "string" && saved.model ? saved.model : DEFAULTS.MODEL;
  const savedBaseUrl =
    typeof saved.baseUrl === "string" && saved.baseUrl ? saved.baseUrl : DEFAULTS.BASE_URL;

  const model = modelOverride || savedModel;
  const baseUrl = baseUrlOverride || savedBaseUrl;

  const messages = toOpenAIMessages(history, text, maxContext);

  const attachments = Array.isArray(context?.attachments) ? context.attachments : [];
  const key = await getDevKey(devKeyEndpoint);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key) {
    // Primary (Bearer) and back-compat for proxies expecting X-OpenAI-Key
    headers["Authorization"] = `Bearer ${key}`;
    headers["X-OpenAI-Key"] = key;
  }

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
      baseUrl,   // upstream OpenAI-compatible endpoint
      stream: true,
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
