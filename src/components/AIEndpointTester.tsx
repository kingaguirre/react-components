"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import { theme } from "../styles";

type Parser = "auto" | "sse" | "ndjson" | "text" | "json";
type UiState =
  | "idle"
  | "requesting"
  | "streaming"
  | "done"
  | "error"
  | "aborted";

const API_BASE = "http://localhost:4000"; // /api/dev/openai-key and /api/ai/openai

export const AIEndpointTester = () => {
  // OpenAI server key (dev storage)
  const [openaiServerKey, setOpenaiServerKey] = useState("");
  const [openaiServerKeySaved, setOpenaiServerKeySaved] = useState(false);

  // Payload knobs
  const [model, setModel] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState(0.2);
  const [prompt, setPrompt] = useState("say hello in 3 words");
  const [payloadMode, setPayloadMode] = useState<"messages" | "input">(
    "messages",
  );
  const [stream, setStream] = useState(true);
  const [timeoutMs, setTimeoutMs] = useState(30000);
  const [parser, setParser] = useState<Parser>("auto");

  // UI state
  const [state, setState] = useState<UiState>("idle");
  const [httpStatus, setHttpStatus] = useState("");
  const [ctype, setCtype] = useState("");
  const [output, setOutput] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [hint, setHint] = useState("");
  const [streamGuess, setStreamGuess] = useState<"yes" | "no" | "unknown">(
    "unknown",
  );
  const [copiedOut, setCopiedOut] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1"); // NEW

  // Load server-saved OpenAI key on mount
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/dev/openai-key`);
        if (!r.ok) return;
        const d = await r.json();
        if (ignore) return;
        const k = String(d?.key || "");
        setOpenaiServerKeySaved(!!k);
        if (k && !openaiServerKey) setOpenaiServerKey(k);
      } catch {}
    })();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helpers
  const appendLog = useCallback((line: string) => {
    setLogs((prev) => [...prev, line]);
  }, []);

  const saveOpenAIServerKey = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/dev/openai-key`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: openaiServerKey }),
      });
      const d = await r.json().catch(() => ({}));
      const has = !!openaiServerKey;
      setOpenaiServerKeySaved(has);
      appendLog(
        `[openai] server key ${has ? "saved" : "cleared"} (${d?.hasKey ? "has" : "empty"})`,
      );
      setHint(
        has
          ? "Saved OpenAI key on server (in-memory)."
          : "Cleared OpenAI key on server.",
      );
    } catch (e: any) {
      appendLog(`[openai] save error: ${e?.message || String(e)}`);
      setHint("Failed to save OpenAI key. Check /api/dev/openai-key.");
    }
  }, [openaiServerKey, appendLog]);

  const clearOpenAIServerKey = useCallback(async () => {
    setOpenaiServerKey("");
    try {
      const r = await fetch(`${API_BASE}/api/dev/openai-key`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "" }),
      });
      await r.json().catch(() => ({}));
      setOpenaiServerKeySaved(false);
      appendLog("[openai] server key cleared");
      setHint("Cleared OpenAI key on server.");
    } catch (e: any) {
      appendLog(`[openai] clear error: ${e?.message || String(e)}`);
      setHint("Failed to clear OpenAI key. Check /api/dev/openai-key.");
    }
  }, [appendLog]);

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (openaiServerKey.trim()) h["X-OpenAI-Key"] = openaiServerKey.trim(); // ← add this
    return h;
  }, [openaiServerKey]);

  const payload = useMemo(() => {
    const core =
      payloadMode === "messages"
        ? { messages: [{ role: "user", content: prompt }] }
        : { input: prompt };
    return { model, stream, temperature, baseUrl, ...core }; // NEW baseUrl
  }, [model, stream, payloadMode, prompt, temperature, baseUrl]);

  const targetUrl = `${API_BASE}/api/ai/openai`;

  const curl = useMemo(() => {
    const hdrs = `-H "Content-Type: application/json"`;
    return `curl -X POST ${hdrs} -d ${JSON.stringify(JSON.stringify(payload))} ${JSON.stringify(targetUrl)}`;
  }, [targetUrl, payload]);

  // Run request
  const reset = useCallback(() => {
    abortRef.current?.abort?.();
    abortRef.current = null;
    setState("idle");
    setHttpStatus("");
    setCtype("");
    setOutput("");
    setLogs([]);
    setHint("");
    setStreamGuess("unknown");
  }, []);

  const start = useCallback(async () => {
    setState("requesting");
    setOutput("");
    setLogs([]);
    setHint("");

    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let resp: Response | null = null;
    try {
      appendLog(`[req] POST ${targetUrl}`);
      appendLog(`[req] headers ${JSON.stringify(headers)}`);
      appendLog(`[req] payload ${JSON.stringify(payload)}`);

      resp = await fetch(targetUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      setHttpStatus(`${resp.status} ${resp.statusText}`);
      const ct = (resp.headers.get("content-type") || "").toLowerCase();
      setCtype(ct);

      if (!resp.ok) {
        const text = await safeText(resp);
        setState("error");
        appendLog(`[resp] error body: ${truncate(text, 2000)}`);
        setHint(hintFromHttp(resp.status, ct, text));
        return;
      }

      const mode: Parser = parser === "auto" ? detectParser(ct) : parser;
      appendLog(`[resp] content-type: ${ct} → parser: ${mode}`);

      const len = resp.headers.get("content-length");
      const guess = computeStreamGuess(mode, ct, len, stream);
      setStreamGuess(guess);
      appendLog(
        `[resp] stream? ${guess} (ct=${ct}, len=${len || "—"}, mode=${mode})`,
      );

      setState("streaming");
      const onChunk = (s: string) => setOutput((prev) => prev + s);

      if (!resp.body) {
        const text = await safeText(resp);
        onChunk(text);
        setState("done");
        return;
      }

      if (mode === "sse") await pumpSSE(resp.body, onChunk);
      else if (mode === "ndjson") await pumpNDJSON(resp.body, onChunk);
      else if (mode === "text") await pumpText(resp.body, onChunk);
      else {
        const text = await safeText(resp);
        try {
          onChunk(extract(JSON.parse(text)) || text);
        } catch {
          onChunk(text);
        }
      }

      setState("done");
    } catch (e: any) {
      clearTimeout(timer);
      setState("error");
      const msg = e?.message || String(e);
      appendLog(`[err] ${msg}`);
      setHint(hintFromFetchError(e));
    }
  }, [targetUrl, headers, payload, timeoutMs, parser, stream, appendLog]);

  const abort = useCallback(() => {
    abortRef.current?.abort?.();
    setState("aborted");
  }, []);

  const copy = useCallback(async (text: string, which: "out" | "curl") => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "out") {
        setCopiedOut(true);
        setTimeout(() => setCopiedOut(false), 1200);
      } else {
        setCopiedCurl(true);
        setTimeout(() => setCopiedCurl(false), 1200);
      }
    } catch {}
  }, []);

  // Submit on Enter (Shift+Enter = newline)
  const onPromptKey = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        start();
      }
    },
    [start],
  );

  return (
    <Wrap>
      {/* Header */}
      <HeaderCard>
        <Badge>AI</Badge>
        <HeadText>
          <Title>AI Endpoint Tester</Title>
          <Sub>
            OpenAI (proxy) only — server key saved in-memory. Enter = Send,
            Shift+Enter = newline.
          </Sub>
        </HeadText>
      </HeaderCard>

      {/* TOP: Server OpenAI Key bar */}
      <KeyCard>
        <KeyRow>
          <Field compact style={{ margin: 0 }}>
            <Label>Server OpenAI Key (saved on server)</Label>
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                type="password"
                placeholder="sk-..."
                value={openaiServerKey}
                onChange={(e) => setOpenaiServerKey(e.target.value)}
                autoComplete="off"
              />
              <BtnPrimary
                onClick={saveOpenAIServerKey}
                disabled={!openaiServerKey.trim()}
              >
                Save
              </BtnPrimary>
              <BtnDanger onClick={clearOpenAIServerKey}>Clear</BtnDanger>
            </div>
            <MiniNote>
              {openaiServerKeySaved
                ? "Saved on server (in-memory)"
                : "No saved server key"}
            </MiniNote>
          </Field>
        </KeyRow>
      </KeyCard>

      {/* Controls */}
      <Card>
        {/* Model / Temp / Timeout */}
        <Row4>
          <Field>
            <Label>OpenAI Base URL</Label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
          </Field>
          <Field>
            <Label>Model</Label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} />
          </Field>
          <Field narrow>
            <Label>Temperature</Label>
            <Input
              type="number"
              step={0.1}
              min={0}
              max={2}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
            />
          </Field>
          <Field narrow>
            <Label>Timeout (ms)</Label>
            <Input
              type="number"
              min={0}
              value={timeoutMs}
              onChange={(e) => setTimeoutMs(Number(e.target.value || 0))}
            />
          </Field>
        </Row4>

        {/* Payload / Stream / Parser */}
        <Row3>
          <Field>
            <Label>Payload</Label>
            <Segmented>
              <SegBtn
                className={payloadMode === "messages" ? "active" : ""}
                onClick={() => setPayloadMode("messages")}
              >
                messages[]
              </SegBtn>
              <SegBtn
                className={payloadMode === "input" ? "active" : ""}
                onClick={() => setPayloadMode("input")}
              >
                input
              </SegBtn>
            </Segmented>
          </Field>
          <Field>
            <Label>Stream</Label>
            <Segmented>
              <SegBtn
                className={stream ? "active" : ""}
                onClick={() => setStream(true)}
              >
                true
              </SegBtn>
              <SegBtn
                className={!stream ? "active" : ""}
                onClick={() => setStream(false)}
              >
                false
              </SegBtn>
            </Segmented>
          </Field>
          <Field>
            <Label>Parser</Label>
            <Segmented>
              {(["auto", "sse", "ndjson", "text", "json"] as Parser[]).map(
                (p) => (
                  <SegBtn
                    key={p}
                    className={parser === p ? "active" : ""}
                    onClick={() => setParser(p)}
                  >
                    {p}
                  </SegBtn>
                ),
              )}
            </Segmented>
          </Field>
        </Row3>

        {/* Prompt */}
        <Field>
          <Label>Prompt / Input</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onPromptKey}
          />
        </Field>

        <div
          style={{ display: "flex", gap: 8, justifyContent: "space-between" }}
        >
          {/* Actions under prompt */}
          <RowInline>
            <ButtonPrimary
              onClick={start}
              disabled={state === "streaming" || state === "requesting"}
            >
              {state === "streaming" || state === "requesting"
                ? "Running…"
                : "Send"}
            </ButtonPrimary>
            <ButtonOutline
              onClick={abort}
              disabled={state !== "streaming" && state !== "requesting"}
            >
              Abort
            </ButtonOutline>
            <ButtonGhost onClick={reset}>Reset</ButtonGhost>
          </RowInline>

          {/* Status line */}
          <RowInline>
            <Status $state={state}>{state}</Status>
            <Pill>{httpStatus || "—"}</Pill>
            <Pill>{ctype || "—"}</Pill>
            <Pill>Stream: {streamGuess}</Pill>
          </RowInline>
        </div>
      </Card>

      {/* Output & Logs */}
      <TwoCol>
        <Card>
          <RowBetween>
            <PanelTitle>Output (stream)</PanelTitle>
            <Small onClick={() => copy(output, "out")}>
              {copiedOut ? "✓ Copied" : "Copy"}
            </Small>
          </RowBetween>
          <Pre $fixed>{output || "(no output yet)"}</Pre>
        </Card>
        <Card>
          <PanelTitle>Logs</PanelTitle>
          <Pre $fixed>{logs.length ? logs.join("\n") : "(no logs yet)"}</Pre>
        </Card>
      </TwoCol>

      {/* Hint & cURL */}
      <TwoCol>
        <Card>
          <PanelTitle>Troubleshooting Hint</PanelTitle>
          <Hint>{hint || "—"}</Hint>
        </Card>
        <Card>
          <RowBetween>
            <PanelTitle>cURL (copy to terminal)</PanelTitle>
            <Small onClick={() => copy(curl, "curl")}>
              {copiedCurl ? "✓ Copied" : "Copy"}
            </Small>
          </RowBetween>
          <Pre small>{curl || "(will generate after you send once)"}</Pre>
        </Card>
      </TwoCol>
    </Wrap>
  );
};

/* ===================== styled ===================== */

const Wrap = styled.div`
  color-scheme: light;
  font-family: ${theme.fontFamily};
  color: ${theme.colors.light.darker};
  max-width: 1080px;
  margin: 0 auto;
  padding: 16px;
  &,
  * {
    box-sizing: border-box;
  }
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid ${theme.colors.default.lighter};
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(2, 8, 23, 0.08);
  padding: 12px;
  min-width: 0; /* prevent grid overflow by long content */
`;

const HeaderCard = styled(Card)`
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 12px;
  align-items: center;
`;
const KeyCard = styled(Card)`
  margin: 12px 0;
`;

const Badge = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: ${theme.colors.primary.base};
  font-weight: 800;
  border: 1px solid ${theme.colors.default.lighter};
  background: linear-gradient(135deg, #eaf2ff, #efe9ff);
  text-align: center;
  line-height: 36px;
`;

const HeadText = styled.div``;
const Title = styled.div`
  font-size: 18px;
  font-weight: 800;
`;
const Sub = styled.div`
  font-size: 13px;
  color: ${theme.colors.light.dark};
`;

/* layouts */
const Row3 = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(240px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
  > * {
    min-width: 0;
  } /* allow children to shrink */
`;
const Row4 = styled(Row3)`
  grid-template-columns: repeat(4, minmax(240px, 1fr));
`;
const RowInline = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 8px 0 12px;
`;
const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
  > * {
    min-width: 0;
  } /* prevent columns from expanding */
`;

/* key row */
const KeyRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  align-items: end;
  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

/* fields */
const Field = styled.label<{ narrow?: boolean; compact?: boolean }>`
  display: block;
  width: 100%;
  max-width: ${(p) => (p.narrow ? "360px" : "unset")};
  ${(p) => (p.compact ? "margin: 0;" : "")}
`;
const Label = styled.div`
  margin-bottom: 6px;
  font-size: ${theme.sizes.label.md}px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.light.dark};
`;
const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid ${theme.colors.default.lighter};
  background: #fff;
  color: ${theme.colors.light.darker};
  outline: none;
  &:focus {
    border-color: ${theme.colors.primary.base};
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
`;
const Textarea = styled.textarea`
  width: min(100%, 100%);
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid ${theme.colors.default.lighter};
  background: #fff;
  color: ${theme.colors.light.darker};
  outline: none;
  min-height: 120px;
  resize: vertical;
  &:focus {
    border-color: ${theme.colors.primary.base};
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
`;

/* buttons */
const ButtonBase = styled.button`
  padding: ${theme.sizes.buttonPadding.md};
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
`;
const ButtonPrimary = styled(ButtonBase)`
  background: ${theme.colors.primary.base};
  color: #fff;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
const ButtonOutline = styled(ButtonBase)`
  background: transparent;
  border-color: ${theme.colors.default.lighter};
`;
const ButtonGhost = styled(ButtonBase)`
  background: transparent;
  color: ${theme.colors.light.dark};
`;

const BtnPrimary = styled(ButtonBase)`
  background: ${theme.colors.primary.base};
  color: #fff;
`;
const BtnDanger = styled(ButtonBase)`
  background: transparent;
  color: ${theme.colors.danger.dark};
  border: 1px solid ${theme.colors.danger.light};
`;

const Pill = styled.div`
  display: inline-block;
  padding: 6px 8px;
  border-radius: 999px;
  border: 1px solid ${theme.colors.default.lighter};
  font-size: 12px;
  color: ${theme.colors.light.dark};
  text-align: center;
`;
const Status = styled(Pill)<{ $state?: UiState }>`
  border-color: ${(p) => stateColor[p.$state || "idle"].border};
  color: ${(p) => stateColor[p.$state || "idle"].text};
`;
const stateColor: Record<UiState | "idle", { border: string; text: string }> = {
  idle: { border: "#6b7280", text: "#6b7280" },
  requesting: { border: "#2563eb", text: "#2563eb" },
  streaming: { border: "#7c3aed", text: "#7c3aed" },
  done: { border: "#059669", text: "#059669" },
  error: { border: "#dc2626", text: "#dc2626" },
  aborted: { border: "#b45309", text: "#b45309" },
};

const RowBetween = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
`;

const PanelTitle = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: ${theme.colors.light.dark};
`;
const Pre = styled.pre<{ small?: boolean; $fixed?: boolean }>`
  width: 100%;
  max-width: 100%;
  white-space: pre-wrap;
  overflow-wrap: anywhere; /* NEW: break long tokens */
  word-break: break-word; /* NEW: break long tokens */
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New";
  font-size: 13px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid ${theme.colors.default.lighter};
  background: #fff;
  color: ${theme.colors.light.darker};
  min-height: ${(p) => (p.$fixed ? "360px" : p.small ? "120px" : "140px")};
  max-height: ${(p) => (p.$fixed ? "360px" : "300px")};
  overflow: auto;
`;
const Hint = styled.div`
  width: 100%;
  font-size: 14px;
  padding: 10px;
  border-radius: 10px;
  background: ${theme.colors.warning.pale};
  border: 1px solid ${theme.colors.warning.light};
  color: ${theme.colors.warning.darker};
  min-height: 140px;
`;
const Small = styled.button`
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid ${theme.colors.default.lighter};
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  text-align: center;
  &:hover {
    background: ${theme.colors.light.pale};
  }
`;
const MiniNote = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: ${theme.colors.light.dark};
  line-height: 1.4;
`;

const Segmented = styled.div`
  display: inline-block;
  border: 1px solid ${theme.colors.default.lighter};
  border-radius: 10px;
  overflow: hidden;
  white-space: nowrap;
`;
const SegBtn = styled.button`
  display: inline-block;
  padding: 8px 12px;
  font-size: 13px;
  border: 0;
  background: transparent;
  cursor: pointer;
  color: ${theme.colors.light.dark};
  &:not(:first-child) {
    border-left: 1px solid ${theme.colors.default.lighter};
  }
  &.active {
    background: ${theme.colors.light.pale};
    color: ${theme.colors.primary.dark};
    font-weight: 700;
  }
`;

/* ===================== helpers ===================== */
function detectParser(ct: string): Parser {
  const c = ct || "";
  if (c.includes("text/event-stream")) return "sse";
  if (c.includes("ndjson") || c.includes("jsonl")) return "ndjson";
  if (c.includes("text/plain")) return "text";
  if (c.includes("application/json")) return "json";
  return "text";
}
function computeStreamGuess(
  mode: Parser,
  _ct: string,
  lenHeader: string | null,
  streamRequested: boolean,
): "yes" | "no" | "unknown" {
  if (mode === "sse" || mode === "ndjson") return "yes";
  if (mode === "text" && streamRequested) return "yes";
  const len = lenHeader ? Number(lenHeader) : NaN;
  if (!Number.isNaN(len) && len > 0 && mode === "json") return "no";
  return "unknown";
}
async function pumpSSE(
  body: ReadableStream<Uint8Array>,
  onChunk: (s: string) => void,
) {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) !== -1) {
      const event = buf.slice(0, i);
      buf = buf.slice(i + 2);
      for (const line of event.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          onChunk(extract(JSON.parse(data)));
        } catch {
          onChunk(data);
        }
      }
    }
  }
  if (buf.trim()) {
    try {
      onChunk(extract(JSON.parse(buf)));
    } catch {
      onChunk(buf);
    }
  }
}
async function pumpNDJSON(
  body: ReadableStream<Uint8Array>,
  onChunk: (s: string) => void,
) {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      try {
        onChunk(extract(JSON.parse(line)));
      } catch {
        onChunk(line);
      }
    }
  }
  if (buf.trim()) {
    try {
      onChunk(extract(JSON.parse(buf)));
    } catch {
      onChunk(buf);
    }
  }
}
async function pumpText(
  body: ReadableStream<Uint8Array>,
  onChunk: (s: string) => void,
) {
  const reader = body.getReader();
  const dec = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    onChunk(dec.decode(value, { stream: true }));
  }
}
function extract(obj: any): string {
  if (obj?.choices?.[0]?.delta?.content) return obj.choices[0].delta.content;
  if (obj?.choices?.[0]?.message?.content)
    return obj.choices[0].message.content;
  if (typeof obj?.content === "string") return obj.content;
  if (typeof obj?.text === "string") return obj.text;
  if (Array.isArray(obj?.content))
    return obj.content.map((p: any) => p?.text || p?.content || "").join("");
  return JSON.stringify(obj);
}
function truncate(s: string, max = 2000) {
  return s.length > max ? s.slice(0, max) + "\n…(truncated)…" : s;
}
function hintFromHttp(status: number, ct: string, body: string): string {
  if (status === 401 || status === 403)
    return "Auth failed (key missing/invalid).";
  if (status === 404) return "Wrong path — verify the proxy route.";
  if (status === 405) return "Wrong method — should be POST.";
  if (status === 415)
    return "Unsupported Media Type — set 'Content-Type: application/json'.";
  if (status === 413)
    return "Payload too large — trim request or raise server limit.";
  if (status >= 500) return "Server error — upstream crashed or unavailable.";
  if (ct.includes("html"))
    return "Got HTML (error page). Check gateway / auth.";
  if (body && /cors|allow-origin|preflight/i.test(body))
    return "CORS — enable CORS or call via same-origin proxy.";
  return "Non-OK HTTP status. Inspect logs and body above.";
}
function hintFromFetchError(e: any): string {
  const msg = e?.message || "";
  if (/Failed to fetch/i.test(msg) || /NetworkError/i.test(msg)) {
    return "Fetch failed — likely CORS or mixed content (http on https). Use a server proxy or enable CORS.";
  }
  if (/timeout/i.test(msg) || e?.name === "AbortError")
    return "Timed out — server slow or blocked.";
  return `Unknown fetch error: ${msg}`;
}
async function safeText(r: Response): Promise<string> {
  try {
    const t = await r.text();
    return t ?? "";
  } catch {
    return "";
  }
}

export default AIEndpointTester;
