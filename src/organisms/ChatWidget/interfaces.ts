export type ChatRole = "user" | "assistant" | "system" | "tool";
export type ChatStatus = "sending" | "sent" | "error";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string | React.ReactNode | null;
  createdAt?: Date | string;
  status?: ChatStatus;
  metadata?: Record<string, any>;
  error?: boolean;
}

/** Lightweight saved transcript */
export interface ChatSession {
  id: string;
  title: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  messages: ChatMessage[];
}

export type HistoryLoader = (cursor?: string | null) => Promise<{
  messages: ChatMessage[];
  nextCursor?: string | null;
}>;

export type SendHandler = (args: {
  text: string;
  messages: ChatMessage[];
  abortSignal?: AbortSignal;
  context?: Record<string, any>;
}) => Promise<ChatMessage | void> | ChatMessage | void;

export type StreamHandler = (args: {
  text: string;
  messages: ChatMessage[];
  abortController: AbortController;
  context?: Record<string, any>;
}) => AsyncIterable<string> | Promise<AsyncIterable<string>>;

export interface ChatWidgetProps {
  /** Behavior & layout */
  mode?: "floating" | "pinned";
  /** For pinned mode only */
  side?: "right" | "left";
  /** Show bottom-right floating launcher (floating mode). Default true. */
  showLauncher?: boolean;

  /** Controlled open; if omitted uses internal state */
  open?: boolean;
  toggleOpen?: (open: boolean) => void;

  /** Copy / visuals */
  title?: string;
  description?: string;
  assistantName?: string;

  /** Floating position */
  position?: "bottom-right" | "bottom-left";
  offset?: number;
  zIndex?: number;

  /** Sizing */
  maxWidth?: number;
  maxHeight?: number;

  /** Lifecycle */
  enablePortal?: boolean;
  shouldUnmountOnClose?: boolean;

  /** Data */
  messages?: ChatMessage[];
  defaultMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;

  /** I/O hooks */
  onSendMessage?: SendHandler; // non-streaming
  onStreamMessage?: StreamHandler; // streaming
  onLoadHistory?: HistoryLoader; // infinite scroll up
  onEvent?: (name: string, payload?: any) => void;

  /** Input config */
  placeholder?: string;
  inputBehavior?: {
    submitOnEnter?: boolean;
    clearOnSend?: boolean;
  };

  /** Misc */
  context?: Record<string, any>;

  /** Stream even when onStreamMessage is not provided (fallback streams onSendMessage result). */
  streamByDefault?: boolean;

  /** Fixed min height (px) for the message list on mount to avoid layout jump. */
  historyHeight?: number;

  /** Initial assistant message to seed when widget is mounted and thread is empty. */
  initialMessage?: string | ChatMessage | null;

  /** Simple in-memory history controls (uncontrolled by default). */
  sessions?: ChatSession[];
  defaultSessions?: ChatSession[];
  onSessionsChange?: (sessions: ChatSession[]) => void;
  maxSessions?: number;

  /** Where to portal the widget. If omitted, falls back to document.body. */
  portalRoot?: HTMLElement | null;
}
