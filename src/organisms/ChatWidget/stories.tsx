// src/organisms/ChatWidget/stories.tsx
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import ChatWidget from "./index";
import type { ChatMessage } from "./interfaces";
import { StoryWrapper, Title } from "../../components/StoryWrapper";

/** ----------------------------------------------------------------------
 * Reusable demo container for “empty” areas when the ChatWidget portals out.
 * Provides consistent padding, styling, and helpful guidance.
 * --------------------------------------------------------------------- */
export const DemoContainer: React.FC<{
  height?: number;
  icon?: string;
  title?: string;
  note?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({
  height = 200,
  icon = "💬",
  title = "Demo Area",
  note = (
    <>
      This area looks empty because the chat panel renders via a <b>portal</b>. <br />
      Use the launcher on the right to open the chat.
    </>
  ),
  style,
}) => {
  return (
    <div
      style={{
        position: "relative",
        height,
        border: "1px dashed #cbd5e1",
        borderRadius: 8,
        padding: 16,
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        boxShadow:
          "inset 0 0 0 1px rgba(148,163,184,0.08), 0 1px 2px rgba(0,0,0,0.03)",
        ...style,
      }}
    >
      <div style={{ maxWidth: 640, pointerEvents: "none" }}>
        <div style={{ fontSize: 28, lineHeight: 1 }}>{icon}</div>
        <div style={{ fontWeight: 650, marginTop: 6 }}>{title}</div>
        <div style={{ opacity: 0.9, fontSize: 13, marginTop: 6, lineHeight: 1.45 }}>
          {note}
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof ChatWidget> = {
  title: "Organisms/ChatWidget",
  component: ChatWidget,
  parameters: {
    docs: {
      description: {
        component:
          "Default launcher + pinned examples. Includes a DemoContainer to fill otherwise-empty areas when the chat portals elsewhere.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function* mockStream() {
  const chunks = ["Sure, ", "here’s ", "a ", "streamed ", "reply."];
  for (const c of chunks) {
    await wait(100);
    yield c;
  }
}
const newId = () =>
  (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));

const seed: ChatMessage[] = [
  {
    id: "s1",
    role: "assistant",
    content: "Welcome! Click the launcher to start.",
    status: "sent",
  },
];

/** 1) Default: Floating icon bottom-right */
export const Default: Story = {
  name: "1) Default (Floating Icon, Bottom-right)",
  args: {
    title: "Assistant",
    description: "Click the floating icon to open.",
  },
  tags: ["!dev"],
};

/** 2) Examples: pinned viewport + pinned inside container (with dynamic width reservation) */
export const Examples: Story = {
  tags: ["!autodocs"],
  render: () => {
    // Keep in sync with ChatWidget pinned width.
    const PANEL_WIDTH = 320;

    const PinnedInsideContainer: React.FC = () => {
      const [open, setOpen] = React.useState(false);
      const containerRef = React.useRef<HTMLDivElement | null>(null);

      return (
        <>
          <Title>Pinned (Right of Container, Full Height)</Title>
          <div
            style={{
              position: "relative",
              border: "1px dashed #cbd5e1",
              borderRadius: 8,
              padding: 12,
              overflow: "hidden",
              background: "#f8fafc",
              boxSizing: "border-box",
            }}
          >
            <div style={{ background: '#f1f1f1',  marginBottom: 8, display: "flex", gap: 6, padding: '10px 12px' }}>
              <button onClick={() => setOpen(true)}>Open pinned chat</button>
              <button onClick={() => setOpen(false)}>Close pinned chat</button>
            </div>

            <div
              ref={containerRef}
              style={{
                transition: 'all .3s ease',
                position: 'relative',
                paddingRight: open ? 330 : 0
              }}
            >

              <DemoContainer
                height={320}
                icon="🪟"
                title="Container Portal Root"
                note={
                  <>
                    This dashed box is the <b>portal root</b>. The chat panel pins to
                    this container’s right edge. While <b>closed</b>, this content is
                    full width; when the chat <b>opens</b>, the content shrinks to{" "}
                    <code>calc(100% − {PANEL_WIDTH}px)</code> with a smooth transition.
                  </>
                }
              />

              <ChatWidget
                mode="pinned"
                side="right"
                enablePortal
                portalRoot={containerRef.current}
                open={open}
                toggleOpen={(v) => setOpen(v)}
                title="Pinned (Container)"
                description="Full-height inside this container; right edge."
                defaultMessages={[
                  {
                    id: newId(),
                    role: "assistant",
                    content: (
                      <div>
                        This panel is <b>inside</b> the dashed container. It
                        occupies the container’s full height and pins to the right.
                      </div>
                    ),
                    status: "sent",
                  },
                ]}
                onStreamMessage={async () => mockStream()}
              />
            </div>
          </div>
        </>
      );
    };

    return (
      <StoryWrapper
        title="ChatWidget Examples"
        subTitle="Pinned (viewport) and pinned (inside container via portal)."
      >
        <Title>Pinned (Right of Screen, Full Height)</Title>

        {/* Viewport-pinned chat */}
        <ChatWidget
          mode="pinned"
          side="right"
          title="Pinned (Viewport)"
          description="Pinned to the right edge; full-height."
          defaultMessages={seed}
          onStreamMessage={async () => mockStream()}
          portalRoot={document.body}
        />

        {/* Placeholder so the viewport example canvas isn’t empty */}
        <DemoContainer
          height={220}
          icon="👉"
          title="Try the right-edge launcher"
          note={
            <>
              The chat mounts to <b>document.body</b> and sits on the right.
              Click the launcher to open. Resize to test responsiveness.
            </>
          }
          style={{ marginTop: 12, marginBottom: 16 }}
        />

        <PinnedInsideContainer />
      </StoryWrapper>
    );
  },
};

// --- Streaming story (long reply) ---
export const StreamingAutoReply: Story = {
  name: "Streaming — Auto Reply (onStreamMessage)",
  tags: ["!autodocs"],
  render: () => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const streamFromText = (text: string, signal: AbortSignal, chunk = 8, delay = 14) =>
      (async function* () {
        const header = "Assistant: ";
        for (let i = 0; i < header.length; i++) {
          if (signal.aborted) return;
          await sleep(16);
          yield header[i];
        }
        for (let i = 0; i < text.length; i += chunk) {
          if (signal.aborted) return;
          await sleep(delay);
          yield text.slice(i, i + chunk);
        }
      })();

    const autoStreamer = async ({
      text,
      messages,
      abortController,
      context,
    }: {
      text: string;
      messages: import("./interfaces").ChatMessage[];
      abortController: AbortController;
      context?: any;
    }): Promise<AsyncIterable<string>> => {
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const prevUser = [...messages].reverse().find((m) => m.role === "user");

      const tips = [
        "",
        "— Notes —",
        "• This is a deliberately long reply to exercise your streaming UI.",
        "• Try stopping mid-stream; the partial message should remain.",
        "• Then resend a new prompt and confirm state resets cleanly.",
        "• Watch how the cursor and scrolling behave for long outputs.",
        "• Consider backpressure in your consumer to avoid jank.",
      ].join("\n");

      const tail =
        "\n\nExtra demo content: In real use, you might stream sections, code blocks, or incremental reasoning. " +
        "This sample inflates the length just enough to feel 'a little too long' while staying readable.";

      const reply = [
        `Got it (${words} ${words === 1 ? "word" : "words"}, ${text.length} chars).`,
        "",
        `Echo → "${text}"`,
        prevUser && prevUser.content !== text ? `\nPrev message → "${String(prevUser.content)}"` : "",
        context ? `\nContext keys: ${Object.keys(context).join(", ")}` : "",
        tips,
        tail,
      ].join("");

      return streamFromText(reply, abortController.signal);
    };

    return (
      <StoryWrapper
        title="ChatWidget — Streaming Auto Reply"
        subTitle="Uses onStreamMessage to stream a computed reply; supports Abort via the stop icon."
      >
        <ChatWidget
          mode="pinned"
          side="right"
          title="Streaming Demo"
          description="Type and hit Enter — I’ll stream a response."
          portalRoot={document.body}
          defaultMessages={[
            {
              id: "seed-1",
              role: "assistant",
              content: "Hi! I stream what you type with a bit of extra info.",
              status: "sent",
              createdAt: new Date().toISOString(),
              metadata: { ignoreUnread: true, seeded: true },
            },
          ]}
          onStreamMessage={autoStreamer}
        />

        <DemoContainer
          icon="🧪"
          title="Streaming Playground"
          note={
            <>
              Type anything in the chat. The response is intentionally a little too
              long to stress-test streaming, scrolling, and the stop button behavior.
            </>
          }
          style={{ marginTop: 12 }}
        />
      </StoryWrapper>
    );
  },
};
