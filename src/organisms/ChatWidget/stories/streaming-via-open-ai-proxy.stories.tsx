// src/organisms/ChatWidget/stories/streaming-via-open-ai-proxy.stories.tsx
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import ChatWidget from "..";
import type { ChatSession } from "../interfaces";
import { StoryWrapper } from "../../../components/StoryWrapper";
import { DemoContainer } from "../../../components/DemoContainer";
import { streamFromExpress } from "../../../common/server/ai/expressClient";
import { GradientText } from '../../../components/GradientText'
import {
  fetchWorkdeskFull,
  summarizeFullWorkdesk,
  TERMINOLOGY,
  type FullRow,
  type WorkdeskSummary,
} from "../aiUtils/workdeskUtils";
import { buildFormContextForAI } from "../aiUtils/buildFormContextForAI";
import { COLUMN_SETTINGS, DATA_SOURCE } from '../aiUtils/data'

const meta: Meta<typeof ChatWidget> = {
  title: "organisms/ChatWidget",
  component: ChatWidget,
  tags: ["!autodocs"],
};
export default meta;

const API_BASE = "http://localhost:4000";

export const StreamingViaOpenAIProxy: StoryObj = {
  name: "Streaming — OpenAI via Express Proxy",
  tags: ["!autodocs"],
  render: () => {
    const STORAGE_KEY = "chatwidget:sessions:streaming-demo";
    const CONVO_KEY = "chatwidget:conversationId:streaming-demo";

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

    const [sessions, setSessions] = React.useState<ChatSession[]>(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as ChatSession[]) : [];
      } catch { return []; }
    });
    React.useEffect(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); } catch {}
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
            content: "**📊 TradeExpress Helix — Daily Snapshot**\n\n- Data is unavailable right now. I’ll still answer your questions.\n",
            createdAt: new Date().toISOString(),
            status: "sent",
            metadata: { seeded: true, ignoreUnread: true },
          });
        }
      })();
      return () => { cancelled = true; };
    }, []);

    return (
      <StoryWrapper
        title="ChatWidget — OpenAI Streaming"
        subTitle="Streams from an Express proxy; auto-uses saved settings (model/baseUrl/key)."
      >
        <ChatWidget
          mode="pinned"
          side="right"
          title="Helix Assistant"
          description={(
            <>
              Information provided by <GradientText bold>Helix Assistant</GradientText> is for guidance only and may not always be accurate. Always double-check before making key decisions.
            </>
          )}
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
          context={{
            sessionId: conversationId,
            memory: { stats, terminology: TERMINOLOGY },
          }}
          onStreamMessage={async ({ text, messages, abortController, context }) => {
            const aiForm = buildFormContextForAI({
              currentModule: "Transaction Workdesk",
              currentScreen: "Transaction Workdesk Catalog",
              values: DATA_SOURCE,
              columnSettings: COLUMN_SETTINGS,
              description: "This screen contains a table of the Transaction Workdesk catalog.",
            });

            // MINIMAL: rely on saved settings & saved key on the server
            return streamFromExpress({
              text,
              history: messages,
              signal: abortController.signal,
              context: { ...(context || {}), tabId: conversationId, form: aiForm },

              // You *can* override, but you don't have to:
              // model: "tradeexpress-gpt4o",
              // baseUrl: "https://gateway.scaifactory.dev.azure.scbdev.net/v1",
              // proxyUrl: "http://localhost:4000/api/ai/stream",
              // settingsEndpoint: "http://localhost:4000/api/dev/openai-settings",
              // devKeyEndpoint: "http://localhost:4000/api/dev/openai-key",
            })}
          }
        />

        <DemoContainer
          icon="⚡"
          title="Proxy Streaming with Memory"
          note={
            <>
              Uses saved settings from <code>/api/dev/openai-settings</code> and a saved key from{" "}
              <code>/api/dev/openai-key</code>. Pass overrides only if you need them.
            </>
          }
          style={{ marginTop: 12 }}
        />
      </StoryWrapper>
    );
  },
};
