// src/AIEndpointTester.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { theme } from "../styles";

type Parser = "auto" | "sse" | "ndjson" | "text" | "json";
type UiState = "idle" | "requesting" | "streaming" | "done" | "error" | "aborted";

/**
 * NOTE: This version does NOT use any Express/proxy.
 * The Send button performs a DIRECT fetch to the upstream URL.
 * It builds the exact same request as the cURL shown in the UI.
 * Be aware that most upstreams (e.g., api.openai.com) block browser calls via CORS.
 * This is purely for parity with your cURL request.
 */

const LS_KEY = "aiTester:key";
const LS_SETTINGS = "aiTester:settings";

export default function AIEndpointTester() {
  // ---------- Auth (Authorization: Bearer ...) ----------
  const [openaiKey, setOpenaiKey] = useState("");

  // ---------- Saved settings (localStorage only) ----------
  const [settingsSaved, setSettingsSaved] = useState(false);

  // ---- Tweakable settings (persisted) ----
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [model, setModel] = useState("gpt-4o-mini");
  const [stream, setStream] = useState(true);
  const [payloadMode, setPayloadMode] = useState<"messages" | "input">("messages");
  const [parser, setParser] = useState<Parser>("auto");
  const [prompt, setPrompt] = useState("say hello in 3 words");

  // UI state
  const [state, setState] = useState<UiState>("idle");
  const [httpStatus, setHttpStatus] = useState("");
  const [ctype, setCtype] = useState("");
  const [output, setOutput] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [hint, setHint] = useState("");
  const [streamGuess, setStreamGuess] = useState<"yes" | "no" | "unknown">("unknown");
  const [copiedOut, setCopiedOut] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // ---------- Load from localStorage on boot ----------
  useEffect(() => {
    try {
      const k = localStorage.getItem(LS_KEY);
      if (k) setOpenaiKey(k);
    } catch {}
    try {
      const raw = localStorage.getItem(LS_SETTINGS);
      if (raw) {
        const s = JSON.parse(raw);
        applySettings(s);
        setSettingsSaved(true);
      }
    } catch {}
  }, []);

  // ---------- Helpers ----------
  const appendLog = useCallback((line: string) => setLogs((prev) => [...prev, line]), []);

  // ---------- Build + apply settings (non-secret) ----------
  const makeSettings = useCallback(
    () => ({
      baseUrl,
      model,
      stream,
      payloadMode,
      parser,
      prompt,
    }),
    [baseUrl, model, stream, payloadMode, parser, prompt],
  );

  const DEFAULTS = useMemo(
    () => ({
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
      stream: true,
      payloadMode: "messages" as const,
      parser: "auto" as Parser,
      prompt: "say hello in 3 words",
    }),
    [],
  );

  const applySettings = useCallback((s: any) => {
    if (!s || typeof s !== "object") return;
    if (typeof s.baseUrl === "string") setBaseUrl(s.baseUrl);
    if (typeof s.model === "string") setModel(s.model);
    if (typeof s.stream === "boolean") setStream(!!s.stream);
    if (s.payloadMode === "messages" || s.payloadMode === "input") setPayloadMode(s.payloadMode);
    if (["auto", "sse", "ndjson", "text", "json"].includes(s.parser)) setParser(s.parser);
    if (typeof s.prompt === "string") setPrompt(s.prompt);
  }, []);

  const saveAllSettings = useCallback(() => {
    const settings = makeSettings();
    try {
      localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
      setSettingsSaved(true);
      appendLog(`[settings] saved: ${JSON.stringify(settings)}`);
      setHint("Saved settings (localStorage).");
    } catch (e: any) {
      appendLog(`[settings] save error: ${e?.message || String(e)}`);
      setHint("Failed to save settings to localStorage.");
    }
  }, [makeSettings, appendLog]);

  const loadAllSettings = useCallback(() => {
    try {
      const raw = localStorage.getItem(LS_SETTINGS);
      if (!raw) {
        setSettingsSaved(false);
        setHint("No saved settings in localStorage.");
        return;
      }
      const d = JSON.parse(raw);
      applySettings(d);
      setSettingsSaved(true);
      appendLog(`[settings] loaded: ${JSON.stringify(d)}`);
      setHint("Loaded settings from localStorage.");
    } catch (e: any) {
      appendLog(`[settings] load error: ${e?.message || String(e)}`);
      setHint("Failed to load settings from localStorage.");
    }
  }, [applySettings, appendLog]);

  const resetToDefaults = useCallback(() => {
    applySettings(DEFAULTS);
    setHint("Reset to defaults.");
    appendLog("[settings] reset to defaults");
  }, [applySettings, DEFAULTS]);

  // Save/Clear key (localStorage)
  const saveKey = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, openaiKey);
      appendLog("[key] saved to localStorage");
      setHint("Saved Bearer token (localStorage).");
    } catch (e: any) {
      appendLog(`[key] save error: ${e?.message || String(e)}`);
      setHint("Failed to save key to localStorage.");
    }
  }, [openaiKey, appendLog]);

  const clearKey = useCallback(() => {
    setOpenaiKey("");
    try {
      localStorage.removeItem(LS_KEY);
      appendLog("[key] cleared from localStorage");
      setHint("Cleared key (localStorage).");
    } catch (e: any) {
      appendLog(`[key] clear error: ${e?.message || String(e)}`);
      setHint("Failed to clear key in localStorage.");
    }
  }, [appendLog]);

  // ---------- Exact upstream URL + payload (matches cURL) ----------
  const directUrl = useMemo(() => joinUrl(baseUrl, "/chat/completions"), [baseUrl]);

  const directWirePayload = useMemo(() => {
    const core =
      payloadMode === "messages"
        ? { messages: [{ role: "user", content: prompt }] }
        : { input: prompt };
    const out: any = { model, ...core };
    if (stream) out.stream = true;
    return out;
  }, [model, payloadMode, prompt, stream]);

  // ---------- Exact cURL (the source of truth) ----------
  const curl = useMemo(() => {
    const authHeader = openaiKey ? `-H "Authorization: Bearer ${openaiKey}"` : "";
    const hdrs = ['-H "Content-Type: application/json"', authHeader].filter(Boolean).join(" ");
    const body = JSON.stringify(JSON.stringify(directWirePayload));
    // EXACT order to mirror your working example
    return `curl -X POST ${JSON.stringify(directUrl)} ${hdrs} -d ${body}`;
  }, [openaiKey, directWirePayload, directUrl]);

  // ---------- Derived request parts for fetch (MUST match cURL) ----------
  const headers = useMemo(() => {
    // IMPORTANT: Do NOT add Accept: text/event-stream to match cURL exactly
    const h: Record<string, string> = { "Content-Type": "application/json" };
    const key = openaiKey.trim();
    if (key) h["Authorization"] = `Bearer ${key}`;
    return h;
  }, [openaiKey]);

  // ---------- Send (direct fetch to upstream) ----------
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

    let resp: Response | null = null;
    try {
      appendLog(`[req] POST ${directUrl}`);
      appendLog(`[req] headers ${JSON.stringify(headers)}`);
      appendLog(`[req] payload ${JSON.stringify(directWirePayload)}`);

      resp = await fetch(directUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(directWirePayload),
        signal: controller.signal,
      });

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

      const modeParser: Parser = parser === "auto" ? detectParser(ct) : parser;
      appendLog(`[resp] content-type: ${ct} → parser: ${modeParser}`);

      const len = resp.headers.get("content-length");
      const guess = computeStreamGuess(modeParser, ct, len, stream);
      setStreamGuess(guess);
      appendLog(`[resp] stream? ${guess} (ct=${ct}, len=${len || "—"}, mode=${modeParser})`);

      setState("streaming");
      const onChunk = (s: string) => setOutput((prev) => prev + s);

      if (!resp.body) {
        const text = await safeText(resp);
        onChunk(text);
        setState("done");
        return;
      }

      if (modeParser === "sse") await pumpSSE(resp.body, onChunk);
      else if (modeParser === "ndjson") await pumpNDJSON(resp.body, onChunk);
      else if (modeParser === "text") await pumpText(resp.body, onChunk);
      else {
        const text = await safeText(resp);
        try { onChunk(extract(JSON.parse(text)) || text); } catch { onChunk(text); }
      }
      setState("done");
    } catch (e: any) {
      setState("error");
      appendLog(`[err] ${e?.message || String(e)}`);
      setHint(hintFromFetchError(e));
    }
  }, [directUrl, headers, directWirePayload, parser, stream, appendLog]);

  const abort = useCallback(() => { abortRef.current?.abort?.(); setState("aborted"); }, []);

  const copy = useCallback(async (text: string, which: "out" | "curl") => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "out") { setCopiedOut(true); setTimeout(() => setCopiedOut(false), 1200); }
      else { setCopiedCurl(true); setTimeout(() => setCopiedCurl(false), 1200); }
    } catch {}
  }, []);

  return (
    <Wrap>
      {/* Header */}
      <HeaderCard>
        <Badge>AI</Badge>
        <HeadText>
          <Title>AI Endpoint Tester (Direct)</Title>
          <Sub>Send button == EXACT same request as the cURL shown</Sub>
        </HeadText>
      </HeaderCard>

      {/* KEY PANEL — Save/Clear key (localStorage) */}
      <KeyCard>
        <Field compact>
          <Label>Server Key / JWT (Authorization: Bearer)</Label>
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              type="password"
              placeholder="<JWT or sk-...>"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
            />
            <BtnPrimary onClick={saveKey} disabled={!openaiKey.trim()}>
              Save
            </BtnPrimary>
            <BtnDanger onClick={clearKey}>Clear</BtnDanger>
          </div>
          <MiniNote>Stored in localStorage only.</MiniNote>
        </Field>
      </KeyCard>

      {/* SETTINGS PANEL — Save/Load/Reset (localStorage) */}
      <KeyCard>
        <Row4>
          <Field>
            <Label>Upstream Base URL</Label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
            <MiniNote>Final URL: <code>{joinUrl(baseUrl, "/chat/completions")}</code></MiniNote>
          </Field>
          <Field>
            <Label>Model</Label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} />
          </Field>
          <Field>
            <Label>Stream</Label>
            <Segmented>
              <SegBtn className={stream ? "active" : ""} onClick={() => setStream(true)}>true</SegBtn>
              <SegBtn className={!stream ? "active" : ""} onClick={() => setStream(false)}>false</SegBtn>
            </Segmented>
          </Field>
          <Field>
            <Label>Parser</Label>
            <Segmented>
              {(["auto","sse","ndjson","text","json"] as Parser[]).map((p) => (
                <SegBtn key={p} className={parser === p ? "active" : ""} onClick={() => setParser(p)}>
                  {p}
                </SegBtn>
              ))}
            </Segmented>
          </Field>
        </Row4>

        <Row3>
          <Field>
            <Label>Payload</Label>
            <Segmented>
              <SegBtn className={payloadMode === "messages" ? "active" : ""} onClick={() => setPayloadMode("messages")}>
                messages[]
              </SegBtn>
              <SegBtn className={payloadMode === "input" ? "active" : ""} onClick={() => setPayloadMode("input")}>
                input
              </SegBtn>
            </Segmented>
          </Field>
          <Field>
            <Label>Save / Load / Reset</Label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <BtnPrimary onClick={saveAllSettings}>Save Settings</BtnPrimary>
              <BtnOutline onClick={loadAllSettings}>Load Settings</BtnOutline>
              <BtnDanger onClick={resetToDefaults}>Reset Defaults</BtnDanger>
            </div>
            <MiniNote>{settingsSaved ? "Settings saved in localStorage" : "No saved settings"}</MiniNote>
          </Field>
          <Field>
            <Label>Note</Label>
            <MiniNote>
              Clicking <b>Send</b> issues a direct <code>fetch</code> to the exact URL shown in cURL with the same headers and JSON body.
              Many upstreams block browser calls via CORS; use for parity testing only.
            </MiniNote>
          </Field>
        </Row3>
      </KeyCard>

      {/* Controls */}
      <Card>
        <Field>
          <Label>Prompt / Input</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); start(); }
            }}
          />
        </Field>

        <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
          <RowInline>
            <ButtonPrimary onClick={start} disabled={state === "streaming" || state === "requesting"}>
              {state === "streaming" || state === "requesting" ? "Running…" : "Send"}
            </ButtonPrimary>
            <ButtonOutline onClick={abort} disabled={state !== "streaming" && state !== "requesting"}>Abort</ButtonOutline>
            <ButtonGhost onClick={reset}>Reset</ButtonGhost>
          </RowInline>
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
            <Small onClick={() => copy(output, "out")}>{copiedOut ? "✓ Copied" : "Copy"}</Small>
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
            <Small onClick={() => copy(curl, "curl")}>{copiedCurl ? "✓ Copied" : "Copy"}</Small>
          </RowBetween>
          <Pre small>{curl || "(will generate after you change settings)"}</Pre>
        </Card>
      </TwoCol>
    </Wrap>
  );
}

/* ===================== styled ===================== */

const Wrap = styled.div`
  color-scheme: light;
  font-family: ${theme.fontFamily};
  color: ${theme.colors.light.darker};
  max-width: 1080px;
  margin: 0 auto;
  padding: 16px;
  &, * { box-sizing: border-box; }
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid ${theme.colors.default.lighter};
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(2, 8, 23, 0.08);
  padding: 12px;
  min-width: 0;
`;

const HeaderCard = styled(Card)`
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 12px;
  align-items: center;
`;
const KeyCard = styled(Card)` margin: 12px 0; `;

const Badge = styled.div`
  width: 36px; height: 36px; border-radius: 10px; color: ${theme.colors.primary.base}; font-weight: 800;
  border: 1px solid ${theme.colors.default.lighter}; background: linear-gradient(135deg, #eaf2ff, #efe9ff); text-align: center; line-height: 36px;
`;

const HeadText = styled.div``;
const Title = styled.div` font-size: 18px; font-weight: 800; `;
const Sub = styled.div` font-size: 13px; color: ${theme.colors.light.dark}; `;

/* layouts */
const Row3 = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(240px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
  > * { min-width: 0; }
`;
const Row4 = styled(Row3)` grid-template-columns: repeat(4, minmax(240px, 1fr)); `;
const RowInline = styled.div` display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 8px 0 12px; `;
const TwoCol = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;
  @media (max-width: 900px) { grid-template-columns: 1fr; } > * { min-width: 0; }
`;

const Field = styled.label<{ narrow?: boolean; compact?: boolean }>`
  display: block; width: 100%;
  max-width: ${(p) => (p.narrow ? "360px" : "unset")};
  ${(p) => (p.compact ? "margin: 0;" : "")}
`;
const Label = styled.div`
  margin-bottom: 6px; font-size: ${theme.sizes.label.md}px;
  text-transform: uppercase; letter-spacing: 0.04em; color: ${theme.colors.light.dark};
`;
const Input = styled.input`
  width: 100%; padding: 10px 12px; border-radius: 10px;
  border: 1px solid ${theme.colors.default.lighter}; background: #fff; color: ${theme.colors.light.darker};
  outline: none;
  &:focus { border-color: ${theme.colors.primary.base}; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }
`;
const Textarea = styled.textarea`
  width: min(100%, 100%); padding: 10px 12px; border-radius: 10px;
  border: 1px solid ${theme.colors.default.lighter}; background: #fff; color: ${theme.colors.light.darker};
  outline: none; min-height: 120px; resize: vertical;
  &:focus { border-color: ${theme.colors.primary.base}; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
`;

const ButtonBase = styled.button`
  padding: ${theme.sizes.buttonPadding.md}; border-radius: 10px; font-size: 14px; cursor: pointer; border: 1px solid transparent;
`;
const ButtonPrimary = styled(ButtonBase)` background: ${theme.colors.primary.base}; color: #fff; &:disabled { opacity: .6; cursor: not-allowed; }`;
const ButtonOutline = styled(ButtonBase)` background: transparent; border-color: ${theme.colors.default.lighter}; `;
const ButtonGhost = styled(ButtonBase)` background: transparent; color: ${theme.colors.light.dark}; `;
const BtnPrimary = styled(ButtonBase)` background: ${theme.colors.primary.base}; color: #fff; `;
const BtnOutline = styled(ButtonBase)` background: transparent; border: 1px solid ${theme.colors.default.lighter}; `;
const BtnDanger = styled(ButtonBase)` background: transparent; color: ${theme.colors.danger.dark}; border: 1px solid ${theme.colors.danger.light}; `;

const Pill = styled.div`
  display: inline-block; padding: 6px 8px; border-radius: 999px; border: 1px solid ${theme.colors.default.lighter};
  font-size: 12px; color: ${theme.colors.light.dark}; text-align: center;
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
const RowBetween = styled.div` display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; `;
const PanelTitle = styled.div` font-size: 13px; font-weight: 800; color: ${theme.colors.light.dark}; `;
const Pre = styled.pre<{ small?: boolean; $fixed?: boolean }>`
  width: 100%; max-width: 100%; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New";
  font-size: 13px; padding: 10px; border-radius: 10px; border: 1px solid ${theme.colors.default.lighter};
  background: #fff; color: ${theme.colors.light.darker};
  min-height: ${(p) => (p.$fixed ? "360px" : p.small ? "120px" : "140px")}; max-height: ${(p) => (p.$fixed ? "360px" : "300px")};
  overflow: auto;
`;
const Hint = styled.div`
  width: 100%; font-size: 14px; padding: 10px; border-radius: 10px;
  background: ${theme.colors.warning.pale}; border: 1px solid ${theme.colors.warning.light}; color: ${theme.colors.warning.darker};
  min-height: 140px;
`;
const Small = styled.button`
  padding: 6px 10px; border-radius: 8px; border: 1px solid ${theme.colors.default.lighter};
  background: transparent; cursor: pointer; font-size: 12px; text-align: center;
  &:hover { background: ${theme.colors.light.pale}; }
`;
const MiniNote = styled.div`
  word-break: break-word;
  margin-top: 6px; font-size: 12px; color: ${theme.colors.light.dark}; line-height: 1.4;
`;
const Segmented = styled.div`
  display: inline-block; border: 1px solid ${theme.colors.default.lighter}; border-radius: 10px; overflow: hidden; white-space: nowrap;
`;
const SegBtn = styled.button`
  display: inline-block; padding: 8px 12px; font-size: 13px; border: 0; background: transparent; cursor: pointer; color: ${theme.colors.light.dark};
  &:not(:first-child) { border-left: 1px solid ${theme.colors.default.lighter}; }
  &.active { background: ${theme.colors.light.pale}; color: ${theme.colors.primary.dark}; font-weight: 700; }
`;

/* ===================== helpers ===================== */
function joinUrl(base: string, p: string) {
  const left = base.replace(/\/+$/, "");
  const right = (p || "/").replace(/^\/+/, "");
  return `${left}/${right}`;
}
function detectParser(ct: string): Parser {
  const c = ct || "";
  if (c.includes("text/event-stream")) return "sse";
  if (c.includes("ndjson") || c.includes("jsonl")) return "ndjson";
  if (c.includes("text/plain")) return "text";
  if (c.includes("application/json")) return "json";
  return "text";
}
function computeStreamGuess(mode: Parser, _ct: string, lenHeader: string | null, streamRequested: boolean) {
  if (mode === "sse" || mode === "ndjson") return "yes";
  if (mode === "text" && streamRequested) return "yes";
  const len = lenHeader ? Number(lenHeader) : NaN;
  if (!Number.isNaN(len) && len > 0 && mode === "json") return "no";
  return "unknown";
}
async function pumpSSE(body: ReadableStream<Uint8Array>, onChunk: (s: string) => void) {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true }).replace(/\r\n/g, "\n");
    let i;
    while ((i = buf.indexOf("\n\n")) !== -1) {
      const event = buf.slice(0, i);
      buf = buf.slice(i + 2);
      for (const line of event.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") return;
        try { onChunk(extract(JSON.parse(data))); } catch { onChunk(data); }
      }
    }
  }
  if (buf.trim()) { try { onChunk(extract(JSON.parse(buf))); } catch { onChunk(buf); } }
}
async function pumpNDJSON(body: ReadableStream<Uint8Array>, onChunk: (s: string) => void) {
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
      try { onChunk(extract(JSON.parse(line))); } catch { onChunk(line); }
    }
  }
  if (buf.trim()) { try { onChunk(extract(JSON.parse(buf))); } catch { onChunk(buf); } }
}
async function pumpText(body: ReadableStream<Uint8Array>, onChunk: (s: string) => void) {
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
  if (obj?.choices?.[0]?.message?.content) return obj.choices[0].message.content;
  if (typeof obj?.content === "string") return obj.content;
  if (typeof obj?.text === "string") return obj.text;
  if (Array.isArray(obj?.content)) return obj.content.map((p: any) => p?.text || p?.content || "").join("");
  return JSON.stringify(obj);
}
function truncate(s: string, max = 2000) { return s.length > max ? s.slice(0, max) + "\n…(truncated)…" : s; }
async function safeText(r: Response): Promise<string> { try { const t = await r.text(); return t ?? ""; } catch { return ""; } }
function hintFromHttp(status: number, ct: string, body: string): string {
  if (status === 401 || status === 403) return "Auth failed (key missing/invalid).";
  if (status === 404) return "Wrong path.";
  if (status === 405) return "Wrong method — should be POST.";
  if (status === 415) return "Unsupported Media Type — set 'Content-Type: application/json'.";
  if (status === 413) return "Payload too large.";
  if (status >= 500) return "Upstream server error.";
  if (ct.includes("html")) return "Got HTML (likely a gateway or block page).";
  if (body && /cors|allow-origin|preflight/i.test(body)) return "CORS block — browsers cannot call this upstream directly.";
  return "Non-OK HTTP status. Inspect logs and body above.";
}
function hintFromFetchError(e: any): string {
  const msg = e?.message || "";
  if (/Failed to fetch/i.test(msg) || /NetworkError/i.test(msg)) return "Fetch failed — likely CORS or mixed content.";
  if (/timeout/i.test(msg) || e?.name === "AbortError") return "Timed out — server slow or blocked.";
  return `Unknown fetch error: ${msg}`;
}
