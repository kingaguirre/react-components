// src/organisms/ChatWidget/stories/streaming-via-open-ai-proxy.stories.tsx
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import ChatWidget from "..";
import type { ChatSession } from "../interfaces";
import { StoryWrapper } from "../../../components/StoryWrapper";
import { DemoContainer } from "../stories";
import { streamFromExpress } from "../../../common/server/ai/expressClient";
import {
  fetchWorkdeskFull,
  summarizeFullWorkdesk,
  TERMINOLOGY,
  type FullRow,
  type WorkdeskSummary,
} from "../server/workdeskUtils";

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
          description="Type and press Enter to stream from OpenAI."
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
          // Forward minimal memory; server plugin will ALWAYS deep-fetch full/range data.
          context={{ memory: { stats, terminology: TERMINOLOGY } }}
          onStreamMessage={async ({ text, messages, abortController, context }) =>
            streamFromExpress({
              text,
              history: messages,
              signal: abortController.signal,
              model: "gpt-4o-mini",
              context,
              proxyUrl: "http://localhost:4000/api/ai/stream",
            })
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
            </>
          }
          style={{ marginTop: 12 }}
        />
      </StoryWrapper>
    );
  },
};
