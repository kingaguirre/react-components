// src/organisms/ChatWidget/stories/streaming-via-open-ai-proxy.stories.tsx
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import ChatWidget from "..";
import type { ChatSession } from "../interfaces";
import { StoryWrapper } from "../../../components/StoryWrapper";
import { DemoContainer } from "../../../components/DemoContainer";
import { GradientText } from "../../../components/GradientText";
import {
  fetchWorkdeskFull,
  summarizeFullWorkdesk,
  TERMINOLOGY,
  type FullRow,
  type WorkdeskSummary,
  type RunAdaptersFn,
  // Screen-aware UI adapter + details
  memory, shape, facets, brandNames, kb,
  streamFromAI,
  makeDataReaderAdapter,
  createRunAdapters,
  makeUiScreenAdapter,
  makeUploadCompareAdapter,
  buildFormContextForAI
} from "../aiUtils";
import { COLUMN_SETTINGS, DATA_SOURCE } from "../aiUtils/data";

const meta: Meta<typeof ChatWidget> = {
  title: "organisms/ChatWidget",
  component: ChatWidget,
  tags: ["!autodocs"],
};
export default meta;

// Used only for demo DB snapshot + adapter data fetches (NOT for AI settings/key endpoints).
const API_BASE = "http://localhost:4000";

// LocalStorage key used by AI Tester & aiClient
const LS_DEV_API_BASE = "aiTester:devApiBase";

function getDevApiBaseFromLS(): string {
  try {
    const v = localStorage.getItem(LS_DEV_API_BASE);
    return typeof v === "string" ? v : "";
  } catch {
    return "";
  }
}

export const StreamingViaOpenAIProxy: StoryObj = {
  name: "Streaming — Direct Upstream (Saved Settings)",
  tags: ["!autodocs"],
  render: () => {
    const STORAGE_KEY = "chatwidget:sessions:streaming-demo";
    const CONVO_KEY = "chatwidget:conversationId:streaming-demo";

    // Stable per-tab conversationId
    const conversationIdRef = React.useRef<string | null>(null);
    if (!conversationIdRef.current) {
      try {
        let id = sessionStorage.getItem(CONVO_KEY);
        if (!id) {
          id =
            (typeof crypto !== "undefined" &&
              (crypto as any).randomUUID &&
              (crypto as any).randomUUID()) ||
            Math.random().toString(36).slice(2) + Date.now().toString(36);
          sessionStorage.setItem(CONVO_KEY, id!);
        }
        conversationIdRef.current = id;
      } catch {
        conversationIdRef.current =
          Math.random().toString(36).slice(2) + Date.now().toString(36);
      }
    }
    const conversationId = conversationIdRef.current!;

    // Persist ChatWidget sessions in localStorage
    const [sessions, setSessions] = React.useState<ChatSession[]>(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as ChatSession[]) : [];
      } catch {
        return [];
      }
    });
    React.useEffect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      } catch { }
    }, [sessions]);

    // Seed snapshot
    const [stats, setStats] = React.useState<WorkdeskSummary | null>(null);
    const [seed, setSeed] = React.useState<any>(null);

    React.useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          const rows: FullRow[] = await fetchWorkdeskFull(API_BASE);
          if (cancelled) return;
          const s = summarizeFullWorkdesk(rows);
          if (cancelled) return;
          setStats(s);
          setSeed({
            id: "seed-memory",
            role: "assistant",
            content: s.seedMarkdown,
            createdAt: new Date().toISOString(),
            status: "sent",
            metadata: { seeded: true, ignoreUnread: true },
          });
        } catch {
          if (cancelled) return;
          setSeed({
            id: "seed-memory",
            role: "assistant",
            content:
              "**📊 TradeExpress Helix — Daily Snapshot**\n\n- Data is unavailable right now. I’ll still answer your questions.\n",
            createdAt: new Date().toISOString(),
            status: "sent",
            metadata: { seeded: true, ignoreUnread: true },
          });
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []);

    // --- Build adapters -> runAdapters (memoized) ---
    const dataReader = React.useMemo(
      () =>
        makeDataReaderAdapter({
          baseUrl: API_BASE,
          endpoints: {
            list: "/workdesk",
            full: "/workdesk/full",
            byKey: (id: string) => `/txn/${encodeURIComponent(id)}`,
          },
          memory,
          shape,
          facets,
          brandNames,
          kb,
        }),
      []
    );

    // upload-compare adapter (owns "compare/diff" + export-it for its aggregation + export uploaded)
    const uploadCompare = React.useMemo(
      () =>
        makeUploadCompareAdapter({
          baseUrl: API_BASE,
          endpoints: {
            list: "/workdesk",
            full: "/workdesk/full",
            byKey: (id: string) => `/txn/${encodeURIComponent(id)}`,
          },
        }),
      []
    );

    // dedicated screen-aware UI adapter
    const uiScreenAdapter = React.useMemo(
      () =>
        makeUiScreenAdapter({
          getFormContext: () =>
            buildFormContextForAI({
              currentModule: "Transaction Workdesk",
              currentScreen: "Transaction Workdesk Catalog",
              values: DATA_SOURCE,
              columnSettings: COLUMN_SETTINGS,
              description:
                "This screen contains a table of the Transaction Workdesk catalog.",
            }),
        }),
      []
    );

    const runAdapters: RunAdaptersFn = React.useMemo(
      () => createRunAdapters([uploadCompare, uiScreenAdapter, dataReader]),
      [uploadCompare, uiScreenAdapter, dataReader]
    );

    const devApiBase = getDevApiBaseFromLS();

    return (
      <StoryWrapper
        title="ChatWidget — Direct Upstream Streaming"
        subTitle="Directly calls <baseUrl>/chat/completions; reads saved model/baseUrl/key from your dev endpoints (Dev API Base from localStorage)."
      >
        <ChatWidget
          mode="pinned"
          side="right"
          title="Helix Assistant"
          description={
            <>
              Information provided by <GradientText bold>Helix Assistant</GradientText> is for
              guidance only and may not always be accurate. Always double-check before making key
              decisions.
            </>
          }
          portalRoot={document.body}
          sessions={sessions}
          onSessionsChange={setSessions}
          initialMessage={
            seed ?? {
              id: "seed",
              role: "assistant",
              content: "Hi! I’m wired to OpenAI directly (no proxy).",
              status: "sent",
              createdAt: new Date().toISOString(),
              metadata: { ignoreUnread: true, seeded: true },
            }
          }
          context={{
            sessionId: conversationId,
            memory: { stats, terminology: TERMINOLOGY },
          }}
          onStreamMessage={async ({ text, messages, abortController, context }) => {
            const attachments = Array.isArray(context?.attachments) ? context.attachments : [];
            return streamFromAI({
              text,
              history: messages,
              signal: abortController.signal,
              context: { ...(context || {}), tabId: conversationId, attachments },
              runAdapters,
              dataBase: API_BASE,
              devApiBase,
              maxContext: 24,
            });
          }}
        />

        <DemoContainer
          icon="⚡"
          title="Direct Streaming with Saved Settings"
          note={
            <>
              Reads <code>baseUrl</code> &amp; <code>model</code> from{" "}
              <code>{devApiBase || ""}/api/dev/openai-settings</code> (same-origin if blank) and a key
              from <code>{devApiBase || ""}/api/dev/openai-key</code>. Then calls{" "}
              <code>{`<baseUrl>/chat/completions`}</code> directly with <code>Authorization: Bearer ...</code>.
              <br />
              <strong>Adapters:</strong>{" "}
              <em>UI Screen</em> (screen context) → <em>Upload Compare</em> (CSV/XLSX diff + export uploaded) →{" "}
              <em>Data Reader</em> (ranges/top-N/oldest + exports).
              <br />
              <small>
                Dev API Base (localStorage <code>aiTester:devApiBase</code>):{" "}
                <code>{devApiBase || "(same-origin)"}</code>
              </small>
            </>
          }
          style={{ marginTop: 12 }}
        />
      </StoryWrapper>
    );
  },
};
