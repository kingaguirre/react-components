// src/organisms/ChatWidget/stories/streaming-via-open-ai-proxy.stories.tsx
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import ChatWidget from "..";
import type { ChatSession } from "../interfaces";
import { StoryWrapper } from "../../../components/StoryWrapper";
import { DemoContainer } from "../../../components/DemoContainer";
import { streamFromExpress } from "../../../common/server/ai/expressClient";
import {
  fetchWorkdeskFull,
  summarizeFullWorkdesk,
  TERMINOLOGY,
  type FullRow,
  type WorkdeskSummary,
} from "../aiUtils/workdeskUtils";
import { buildFormContextForAI } from "../aiUtils/buildFormContextForAI";
import {
  // FIELD_SETTINGS,
  // VALUES,
  COLUMN_SETTINGS,
  DATA_SOURCE
} from '../aiUtils/data'
/* -----------------------------------------------------------------------------
   Storybook meta
----------------------------------------------------------------------------- */
const meta: Meta<typeof ChatWidget> = {
  title: "organisms/ChatWidget",
  component: ChatWidget,
  tags: ["!autodocs"],
};
export default meta;

export const StreamingViaOpenAIProxy: StoryObj = {
  name: "Streaming — OpenAI via Express Proxy",
  tags: ["!autodocs"],
  render: () => {
    const STORAGE_KEY = "chatwidget:sessions:streaming-demo";
    const CONVO_KEY = "chatwidget:conversationId:streaming-demo";

    // ---- Stable per-tab conversationId (used as context.sessionId) ----
    const conversationIdRef = React.useRef<string | null>(null);
    if (!conversationIdRef.current) {
      try {
        let id = sessionStorage.getItem(CONVO_KEY);
        if (!id) {
          // Prefer crypto UUID, fallback to random string
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

    // ---- Persist ChatWidget sessions in localStorage for the story ----
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
      } catch {}
    }, [sessions]);

    // Optional: if you ever decide to add a “New chat” UI here,
    // you can also reset the conversationId like this:
    // const resetConversationId = () => {
    //   try { sessionStorage.removeItem(CONVO_KEY); } catch {}
    //   conversationIdRef.current =
    //     ((crypto as any)?.randomUUID?.() as string) ||
    //     Math.random().toString(36).slice(2) + Date.now().toString(36);
    //   sessionStorage.setItem(CONVO_KEY, conversationIdRef.current);
    // };

    // ---- “default memory” fetched from your backend ----
    const [stats, setStats] = React.useState<WorkdeskSummary | null>(null);

    const [seed, setSeed] = React.useState<null | {
      id: string;
      role: "assistant";
      content: string;
      createdAt: string;
      status: "sent";
      metadata: { seeded: true; ignoreUnread: true };
    }>(null);

    React.useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          // Full dataset → summary + seed
          const rows: FullRow[] = await fetchWorkdeskFull("http://localhost:4000");
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
          const fallback =
            "**📊 TradeExpress Helix — Daily Snapshot**\n\n" +
            "- Data is unavailable right now. I’ll still answer your questions.\n";
          setSeed({
            id: "seed-memory",
            role: "assistant",
            content: fallback,
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

    return (
      <StoryWrapper
        title="ChatWidget — OpenAI Streaming"
        subTitle="Streams from an Express proxy; seeds with live DB snapshot and persists sessions via localStorage."
      >
        <ChatWidget
          mode="pinned"
          side="right"
          title="Helix Assistant"
          description="Information provided by Helix Assistant is for guidance only and may not always be accurate. Always double-check before making key decisions."
          portalRoot={document.body}
          sessions={sessions}
          onSessionsChange={setSessions}
          initialMessage={
            seed ?? {
              id: "seed",
              role: "assistant",
              content: "Hi! I’m wired to an Express proxy hitting OpenAI.",
              status: "sent",
              createdAt: new Date().toISOString(),
              metadata: { ignoreUnread: true, seeded: true },
            }
          }
          // Forward minimal memory + sessionId; the server/plugin uses context.sessionId
          // to remember your last range/top-N for follow-up exports.
          context={{
            sessionId: conversationId,
            memory: { stats, terminology: TERMINOLOGY },
          }}
          onStreamMessage={async ({ text, messages, abortController, context }) => {
            // const values = formRef.current?.getValues?.() ?? {};
            const aiForm = buildFormContextForAI({
              currentModule: "Transaction Workdesk",
              currentScreen: "Transaction Workdesk Catalog",
              // values: VALUES,
              // fieldSettings: FIELD_SETTINGS as any,
              values: DATA_SOURCE,
              columnSettings: COLUMN_SETTINGS,
              description: "This screen contains a table of the Transaction Workdesk catalog.",
            });
            return streamFromExpress({
              text,
              history: messages,
              signal: abortController.signal,
              model: "gpt-4o-mini",
              proxyUrl: "http://localhost:4000/api/ai/stream",

              // Base URL override (keep in localStorage to tweak in Storybook)
              baseUrl: localStorage.getItem("ai:baseUrl") || "https://api.openai.com/v1",

              // Dev parity—pull the saved key from server and forward as header
              useServerKeyHeader: true,
              devKeyEndpoint: "http://localhost:4000/api/dev/openai-key",

              context: {
                ...(context || {}),
                tabId: conversationId,
                form: aiForm,
              },
            })}
          }
        />

        <DemoContainer
          icon="⚡"
          title="Proxy Streaming with Memory"
          note={
            <>
              The assistant seeds a “Daily snapshot” from <code>/workdesk/full?limit=0</code>.
              The server-side plugin always deep-fetches the full dataset or any requested date range,
              so there’s no 50-row hotset fallback.
              <br />
              <strong>Tip:</strong> The session-scoped exports rely on{" "}
              <code>context.sessionId</code> — which this story sets via{" "}
              <code>sessionStorage</code>.
            </>
          }
          style={{ marginTop: 12 }}
        />
      </StoryWrapper>
    );
  },
};
