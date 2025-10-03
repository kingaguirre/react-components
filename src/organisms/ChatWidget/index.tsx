"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import * as S from "./styled";
import type {
  ChatMessage,
  ChatWidgetProps,
  ChatSession,
} from "./interfaces";
import { createId, isBrowser, nowIso, scrollToBottom } from "./utils";

// DS primitives
import { Panel } from "../../molecules/Panel";
import { FormControl } from "../../atoms/FormControl";
import { Button } from "../../atoms/Button";
import { Icon } from "../../atoms/Icon";
import { Modal } from "../../organisms/Modal";
import { timeAgo } from "../AppShell/components/NotificationDropdown/utils";

// Local splits
import {
  DEFAULT_INITIAL_MESSAGE,
  REPLY_CANCEL_MESSAGE,
  TIMEAGO_TICK_MS,
} from "./constants";
import MarkdownContent, { toPlainText } from "./components/MarkdownContent";
import {
  useStorage,
  readSessionsFromStorage,
  writeSessionsToStorage,
  useFlushOnExit,
  makeTitle,
  messagesForPersistence,
  normalizeInitialMessage,
  MutateOptions,
  useControlled
} from "./utils";

// -------------------------------

const ChatWidget: React.FC<ChatWidgetProps> = ({
  // Behavior
  mode = "floating", // "floating" | "pinned"
  side = "right",
  showLauncher = true,

  open,
  toggleOpen,

  // Copy / visuals
  title = "Assistant",
  description = "Ask anything.",

  // Floating position props
  position = "bottom-right",
  offset = 20,
  zIndex = 999,

  // Sizing
  maxWidth = 320,

  // Lifecycle
  enablePortal = true,
  shouldUnmountOnClose = true,

  // Data / callbacks
  messages: messagesProp,
  defaultMessages = [],
  onMessagesChange,
  onSendMessage,
  onStreamMessage,
  onLoadHistory,
  onEvent,

  // Input
  placeholder = "Ask something... (Shift + Enter for a new line)",
  inputBehavior = { submitOnEnter: true, clearOnSend: true },

  // Misc
  context,

  // Streaming
  streamByDefault = true,

  // Fixed message view height (used in floating; “comfort min” in pinned)
  historyHeight = 280,

  /** Initial assistant/admin message (seed if empty) */
  initialMessage,

  /** Simple in-memory history controls */
  sessions: sessionsProp,
  defaultSessions = [],
  onSessionsChange,
  maxSessions = 20,

  /** Where to portal the widget. If omitted/falsy, render in place (no fallback to body). */
  portalRoot = document.body,
}) => {
  // ---------- Built-in persistence config ----------
  const persistKey: string =
    (context as any)?.storageKey ?? "chatwidget:sessions:streaming-demo";
  const persistStorage: "local" | "session" =
    (context as any)?.storage ?? "local";
  const persistWhenControlled: boolean = !!(context as any)
    ?.persistWhenControlled;

  // Storage hooks
  const { storageRef, resolveStorage } = useStorage(persistStorage);

  // Storage IO
  const readFromStore = useCallback(
    (): ChatSession[] => readSessionsFromStorage(persistKey, storageRef, resolveStorage),
    [persistKey, storageRef, resolveStorage],
  );
  const writeToStore = useCallback(
    (sessions: ChatSession[]) =>
      writeSessionsToStorage(persistKey, sessions, storageRef, resolveStorage),
    [persistKey, storageRef, resolveStorage],
  );

  // =========================
  // Seed resolver
  // =========================
  const resolveSeed = useCallback(():
    | string
    | React.ReactElement
    | Partial<ChatMessage>
    | null => {
    if (initialMessage === null) return null;
    if (initialMessage !== undefined) return initialMessage;
    const seededFromDefaults =
      defaultMessages?.find?.(
        (m) => m.role === "assistant" && m.metadata?.seeded,
      ) ?? defaultMessages?.[0];
    return seededFromDefaults ?? DEFAULT_INITIAL_MESSAGE;
  }, [initialMessage, defaultMessages]);

  // Controlled open
  const [isOpenState, setIsOpenState] = useControlled<boolean>(open, false);
  const isOpen = !!isOpenState;
  const setOpen = useCallback(
    (next: boolean) => {
      setIsOpenState(next);
      toggleOpen?.(next);
    },
    [setIsOpenState, toggleOpen],
  );

  const [isExiting, setIsExiting] = useState(false);
  const [rendered, setRendered] = useState<boolean>(!!isOpen);

  const [messagesState, setMessagesState] = useControlled<ChatMessage[]>(
    messagesProp,
    defaultMessages,
  );

  // Always-fresh snapshot for async code paths
  const messagesRef = useRef<ChatMessage[]>(messagesState);
  useEffect(() => {
    messagesRef.current = messagesState;
  }, [messagesState]);

  // ---------- Sessions with built-in persistence ----------
  const isUncontrolledSessions = sessionsProp === undefined;

  // hydrate once for uncontrolled usage
  const hydratedDefaultSessions = useMemo<ChatSession[]>(() => {
    if (!isUncontrolledSessions) return defaultSessions;
    if (!isBrowser) return defaultSessions;
    const fromStore = readFromStore();
    return fromStore.length ? fromStore : defaultSessions;
  }, [isUncontrolledSessions, defaultSessions, readFromStore]);

  const [sessionsState, setSessionsState] = useControlled<ChatSession[]>(
    sessionsProp,
    hydratedDefaultSessions,
  );

  useEffect(() => {
    return () => {
      // snapshot-safe flush
      if (sessionsState?.length) writeToStore(sessionsState);
    };
  }, [sessionsState, writeToStore]);

  const persistIfNeeded = useCallback(
    (sessions: ChatSession[]) => {
      if (isUncontrolledSessions || persistWhenControlled) {
        writeToStore(sessions);
      }
    },
    [isUncontrolledSessions, persistWhenControlled, writeToStore],
  );

  const mutateSessions = (next: ChatSession[]) => {
    const limited = next.slice(0, maxSessions);
    setSessionsState(limited);
    onSessionsChange?.(limited);
    persistIfNeeded(limited);
  };

  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // keep active session id in sync for immediate reads during the same tick
  const activeSessionIdRef = useRef<string | null>(activeSessionId);
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);
  const setActiveSession = (id: string | null) => {
    activeSessionIdRef.current = id;
    setActiveSessionId(id);
  };

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);

  // Refs
  const listRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const historyWrapRef = useRef<HTMLDivElement | null>(null);
  const initialSeededRef = useRef(false);
  const suppressNextAutoScrollRef = useRef(false);
  const stoppedByUserRef = useRef(false);

  // Pinned-only layout refs (for dynamic height calc)
  const sidePanelRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null); // S.Footer
  const messagesDivRef = useRef<HTMLDivElement | null>(null);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [renameState, setRenameState] = useState<{
    id: string;
    value: string;
  } | null>(null);

  // rename modal focusing and Enter handling
  const renameModalRef = useRef<HTMLDivElement | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const isRenaming = !!renameState;

  const focusRename = () => {
    const el =
      renameInputRef.current ??
      (renameModalRef.current?.querySelector("input,textarea") as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null);
    el?.focus();
  };

  const openRename = (id: string, value: string) => {
    setRenameState({ id, value });
    // Wait one frame so the modal/input exists, then focus
    requestAnimationFrame(focusRename);
  };

  // ========= destructive actions =========
  const deleteSessionById = (id: string) => {
    const next = sessionsState.filter((s) => s.id !== id);
    mutateSessions(next);

    if (activeSessionId === id) {
      // Reset the editor to a fresh seeded chat
      setActiveSession(null);

      const seed = resolveSeed();
      if (seed != null) {
        const msg = normalizeInitialMessage(seed);
        initialSeededRef.current = true;
        // seed without reordering sessions
        mutateMessages([msg], { silent: true });
      } else {
        initialSeededRef.current = false;
        mutateMessages([], { silent: true });
      }

      // Refocus editor textarea
      requestAnimationFrame(() => {
        taRef.current?.focus();
        autosize();
      });
    }

    onEvent?.("history_delete", { sessionId: id });
  };

  const renameSessionById = (id: string, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const now = nowIso();

    // Keep ordering stable; only update the item
    const next = sessionsState.map((s) =>
      s.id === id ? { ...s, title: trimmed, updatedAt: now } : s,
    );

    mutateSessions(next);
    onEvent?.("history_rename", { sessionId: id, title: trimmed });
  };

  const autosize = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const max = 160; // px
    const next = Math.min(max, ta.scrollHeight);
    ta.style.height = `${next}px`;
    ta.style.overflowY = ta.scrollHeight > max ? "auto" : "hidden";
    if (ta.scrollHeight > max) ta.scrollTop = ta.scrollHeight; // keep caret visible
  }, []);

  /** Open/close orchestration (render gate + exit animation) */
  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      setIsExiting(false);
      setUnread(0);
    } else {
      if (shouldUnmountOnClose) {
        setIsExiting(true);
        const t = setTimeout(() => {
          setIsExiting(false);
          setRendered(false);
        }, 200);
        return () => clearTimeout(t);
      } else {
        setIsExiting(false);
      }
    }
  }, [isOpen, shouldUnmountOnClose]);

  /** Focus textarea on open, and ESC to close */
  useEffect(() => {
    if (!isOpen || !rendered) return;

    let raf1 = 0,
      raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const ta = taRef.current;
        if (ta) {
          ta.focus();
          autosize();
        }
        const el = listRef.current;
        if (el) scrollToBottom(el);
      });
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, rendered, autosize, setOpen]);

  /** Close history dropdown when clicking anywhere outside */
  useEffect(() => {
    if (!historyOpen) return;
    const onDocDown = (e: MouseEvent | TouchEvent) => {
      const root = historyWrapRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) setHistoryOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
    };
  }, [historyOpen]);

  /** Unread: exclude "ignoreUnread" messages (e.g., seeded welcome) */
  useEffect(() => {
    if (!messagesState) return;
    if (!isOpen) {
      const inc = messagesState.filter(
        (m) => m.role !== "user" && !m.metadata?.ignoreUnread,
      ).length;
      setUnread(inc);
    }
  }, [messagesState, isOpen]);

  /** Auto-refresh "time ago" labels */
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(
      () => setNowTick((t) => t + 1),
      TIMEAGO_TICK_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  /** Auto-scroll to bottom on new messages (except when loading history) */
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (suppressNextAutoScrollRef.current) {
      suppressNextAutoScrollRef.current = false;
      return;
    }
    requestAnimationFrame(() => scrollToBottom(el));
  }, [messagesState]);

  /** While typing, keep list pinned to bottom too */
  useEffect(() => {
    if (!isOpen) return;
    const el = listRef.current;
    if (!el) return;
    requestAnimationFrame(() => scrollToBottom(el));
  }, [text, isOpen]);

  // --- session-aware mutateMessages with silent option ---
  const mutateMessages = (next: ChatMessage[], opts?: MutateOptions) => {
    setMessagesState(next);
    onMessagesChange?.(next);

    const targetSid =
      (opts?.persistToSessionId ?? activeSessionIdRef.current) || null;
    if (!targetSid) return;

    const persistable = messagesForPersistence(next);
    if (!persistable.length) return;

    if (opts?.silent) return;

    let idx = sessionsState.findIndex((s) => s.id === targetSid);
    const now = nowIso();

    // Provisional upsert (session not yet in state this tick)
    if (idx < 0) {
      const provisional: ChatSession = {
        id: targetSid,
        title: makeTitle(persistable),
        createdAt: now,
        updatedAt: now,
        messages: persistable,
      };
      mutateSessions([
        provisional,
        ...sessionsState.filter((s) => s.id !== targetSid),
      ]);
      return;
    }

    const prev = sessionsState[idx];

    const contentChanged =
      JSON.stringify(prev.messages ?? []) !== JSON.stringify(persistable);

    const updated: ChatSession = {
      ...prev,
      messages: persistable,
      title: prev.title || makeTitle(persistable),
      updatedAt: now,
    };

    if (contentChanged) {
      const nextSessions = [
        updated,
        ...sessionsState.filter((s) => s.id !== targetSid),
      ];
      mutateSessions(nextSessions);
    } else {
      const nextSessions = sessionsState.map((s) =>
        s.id === targetSid ? updated : s,
      );
      mutateSessions(nextSessions);
    }
  };

  // Flush latest in-flight snapshot on unload/hidden
  const flushSnapshot = useCallback(() => {
    try {
      const sid = activeSessionIdRef.current;
      if (!sid) return;

      const persistable = messagesForPersistence(messagesRef.current);
      if (!persistable.length) return;

      const idx = sessionsState.findIndex((s) => s.id === sid);
      const now = nowIso();

      const updated: ChatSession =
        idx >= 0
          ? {
              ...sessionsState[idx],
              messages: persistable,
              updatedAt: now,
              title:
                sessionsState[idx].title?.trim() || makeTitle(persistable),
            }
          : {
              id: sid,
              title: makeTitle(persistable),
              createdAt: now,
              updatedAt: now,
              messages: persistable,
            };

      const nextSessions = [updated, ...sessionsState.filter((s) => s.id !== sid)];
      writeToStore(nextSessions);
    } catch {
      /* ignore */
    }
  }, [sessionsState, writeToStore]);

  useFlushOnExit(flushSnapshot);

  /** Seed initial assistant message ONCE if thread is empty; do not affect unread badge */
  useEffect(() => {
    if (initialSeededRef.current) return;

    const hasAny = (messagesState?.length ?? 0) > 0;
    const seed = resolveSeed();
    if (hasAny || seed == null) {
      initialSeededRef.current = true;
      return;
    }

    const msg = normalizeInitialMessage(seed);
    mutateMessages([msg, ...messagesState]);
    initialSeededRef.current = true;
    onEvent?.("initial_message_seeded", { id: msg.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolveSeed, messagesState]);

  // Replace/insert seed if `initialMessage` arrives later and no real messages yet
  useEffect(() => {
    // If there's any non-seeded message, do nothing (user has started chatting)
    const hasNonSeed = messagesState?.some?.((m) => !m?.metadata?.seeded) ?? false;
    if (hasNonSeed) return;

    const nextSeed = resolveSeed();
    if (nextSeed == null) return;

    const nextMsg = normalizeInitialMessage(nextSeed);

    // If empty thread, just insert the new seed
    if ((messagesState?.length ?? 0) === 0) {
      mutateMessages([nextMsg], { silent: true });
      initialSeededRef.current = true;
      return;
    }

    // Otherwise, replace the first bubble if it was the old seed and content changed
    const first = messagesState[0];
    if (!first?.metadata?.seeded) return;

    const currText =
      typeof first.content === "string" || typeof first.content === "number"
        ? String(first.content)
        : toPlainText((first as any)?.content?.props?.children);

    const nextText =
      typeof nextMsg.content === "string" || typeof nextMsg.content === "number"
        ? String(nextMsg.content)
        : toPlainText((nextMsg as any)?.content?.props?.children);

    if ((currText || "").trim() !== (nextText || "").trim()) {
      const updated = [...messagesState];
      // keep original id to avoid flicker and keep tests stable
      updated[0] = { ...nextMsg, id: first.id };
      mutateMessages(updated, { silent: true });
    }
  }, [initialMessage, messagesState, resolveSeed]); // react when prop changes


  const handleKeyDown = (e: React.KeyboardEvent) => {
    const submitOnEnter = inputBehavior.submitOnEnter ?? true;
    if (!submitOnEnter) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /** History/infinite scroll up */
  const onScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    if (!onLoadHistory) return;
    const el = e.currentTarget;
    if (el.scrollTop <= 0) {
      const cursor = messagesState[0]?.id ?? null;
      const res = await onLoadHistory(cursor);
      if (res?.messages?.length) {
        const prevHeight = el.scrollHeight;
        const merged = [...res.messages, ...messagesState];
        suppressNextAutoScrollRef.current = true; // don't jump to bottom after prepend
        mutateMessages(merged);
        requestAnimationFrame(() => {
          const diff = el.scrollHeight - prevHeight;
          el.scrollTop = diff;
        });
      }
    }
  };

  // preserve title and reorder only on content change
  const saveOrUpdateCurrentSession = useCallback(
    (snapshot?: ChatMessage[]) => {
      const msgs = snapshot ?? messagesRef.current;

      const persistable = messagesForPersistence(msgs);
      if (persistable.length === 0) return null;

      const now = nowIso();

      const sid = activeSessionIdRef.current;
      if (sid) {
        const idx = sessionsState.findIndex((s) => s.id === sid);
        if (idx >= 0) {
          const prev = sessionsState[idx];

          const contentChanged =
            JSON.stringify(prev.messages ?? []) !== JSON.stringify(persistable);

          const updated: ChatSession = {
            ...prev,
            title: prev.title?.trim() ? prev.title : makeTitle(persistable),
            updatedAt: now,
            messages: persistable,
          };

          if (contentChanged) {
            const next = [
              updated,
              ...sessionsState.filter((s) => s.id !== sid),
            ];
            mutateSessions(next);
          } else {
            const next = sessionsState.map((s) => (s.id === sid ? updated : s));
            mutateSessions(next);
          }

          onEvent?.("history_update", {
            sessionId: updated.id,
            size: persistable.length,
          });
          return updated.id;
        }
      }

      // Create new session
      const title = makeTitle(persistable);
      const sess: ChatSession = {
        id: createId("session"),
        title,
        createdAt: now,
        updatedAt: now,
        messages: persistable,
      };
      mutateSessions([sess, ...sessionsState]);
      setActiveSession(sess.id);
      onEvent?.("history_create", {
        sessionId: sess.id,
        size: persistable.length,
      });
      return sess.id;
    },
    [sessionsState, onEvent],
  );

  // abort in-flight stream, save current, load target silently
  const loadSession = useCallback(
    (id: string) => {
      if (id === activeSessionIdRef.current) {
        setHistoryOpen(false);
        return;
      }

      if (abortRef.current) {
        stoppedByUserRef.current = true;
        abortRef.current.abort();
        abortRef.current = null;
      }

      saveOrUpdateCurrentSession(messagesRef.current);

      const s = sessionsState.find((x) => x.id === id);
      if (!s) return;

      setActiveSession(id);
      mutateMessages(s.messages, { silent: true });
      setHistoryOpen(false);
      onEvent?.("history_load", { sessionId: id });
    },
    [sessionsState, onEvent, saveOrUpdateCurrentSession],
  );

  // pin streaming persistence to the origin session
  const handleSend = useCallback(async () => {
    if (isRenaming) return; // Do nothing while rename modal is open

    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userId = createId("user");
    const userMsg: ChatMessage = {
      id: userId,
      role: "user",
      content: trimmed as any,
      createdAt: nowIso(),
      status: "sending",
    };

    let next = [...messagesState, userMsg];

    // Capture the session that this message belongs to
    let targetSid: string | null = activeSessionIdRef.current;

    // Echo the user message immediately
    mutateMessages(next, { persistToSessionId: targetSid });

    // Ensure a session exists as soon as the user sends the first message
    if (!targetSid) {
      const createdId = saveOrUpdateCurrentSession(next);
      if (createdId) {
        setActiveSession(createdId);
        targetSid = createdId;
      }
    }

    setLoading(true);
    if (inputBehavior.clearOnSend ?? true) setText("");
    onEvent?.("send", { length: trimmed.length });

    try {
      if (onStreamMessage || (streamByDefault && onSendMessage)) {
        const aId = createId("assistant");
        const abort = new AbortController();
        abortRef.current = abort;

        // assistant placeholder
        next = [
          ...next,
          {
            id: aId,
            role: "assistant",
            content: "" as any,
            createdAt: nowIso(),
            status: "sending",
          },
        ];
        mutateMessages(next, { persistToSessionId: targetSid });

        // mark user as sent
        next = next.map((m) =>
          m.id === userId ? { ...m, status: "sent" } : m,
        );
        mutateMessages(next, { persistToSessionId: targetSid });

        let iterable: AsyncIterable<string>;

        if (onStreamMessage) {
          iterable = await onStreamMessage({
            text: trimmed,
            messages: next,
            abortController: abort,
            context,
          });
        } else {
          const res = await onSendMessage!({
            text: trimmed,
            messages: next,
            context,
          });
          const content = (res as any)?.content ?? "";
          async function* streamFromText(s: string, chunk = 12, delay = 16) {
            for (let i = 0; i < s.length; i += chunk) {
              await new Promise((r) => setTimeout(r, delay));
              yield s.slice(i, i + chunk);
            }
          }
          iterable = streamFromText(String(content));
        }

        for await (const chunk of iterable) {
          if (abort.signal.aborted) break;
          next = next.map((m) =>
            m.id === aId
              ? { ...m, content: ((m.content as any) ?? "") + chunk }
              : m,
          );
          mutateMessages(next, { persistToSessionId: targetSid });
        }

        // finalize
        const aIdx = next.findIndex((m) => m.id === aId);
        const aMsgNow = aIdx >= 0 ? next[aIdx] : undefined;

        if (stoppedByUserRef.current) {
          const partial = String(aMsgNow?.content ?? "");
          if (partial.length === 0) {
            next = next.filter((m) => m.id !== aId);
          } else {
            next[aIdx] = { ...aMsgNow!, status: "sent" };
          }

          const hasNotice = next.some((m) => m.metadata?.stoppedByUser);
          if (!hasNotice) {
            next = [
              ...next,
              {
                id: createId("notice"),
                role: "assistant",
                content: REPLY_CANCEL_MESSAGE,
                createdAt: nowIso(),
                status: "sent",
                metadata: { notice: true, stoppedByUser: true },
              },
            ];
          }
        } else {
          if (!aMsgNow || String(aMsgNow.content ?? "").length === 0) {
            next = next.map((m) => (m.id === aId ? { ...m, content: "…" } : m));
          }
          next = next.map((m) => (m.id === aId ? { ...m, status: "sent" } : m));
        }

        mutateMessages(next, { persistToSessionId: targetSid });
        requestAnimationFrame(() => {
          taRef.current?.focus();
          autosize();
        });
      } else if (onSendMessage) {
        const res = await onSendMessage({
          text: trimmed,
          messages: next,
          context,
        });
        next = next.map((m) =>
          m.id === userId ? { ...m, status: "sent" } : m,
        );
        if (res)
          next = [
            ...next,
            { ...(res as any), status: (res as any)?.error ? "error" : "sent" },
          ];
        mutateMessages(next, { persistToSessionId: targetSid });
        requestAnimationFrame(() => {
          taRef.current?.focus();
          autosize();
        });
      } else {
        // Local echo fallback
        next = next.map((m) =>
          m.id === userId ? { ...m, status: "sent" } : m,
        );
        next = [
          ...next,
          {
            id: createId("assistant"),
            role: "assistant",
            content: `You said: ${trimmed}` as any,
            createdAt: nowIso(),
            status: "sent",
          },
        ];
        mutateMessages(next, { persistToSessionId: targetSid });
        requestAnimationFrame(() => {
          taRef.current?.focus();
          autosize();
        });
      }
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      const isAbort =
        stoppedByUserRef.current ||
        err?.name === "AbortError" ||
        /aborted|AbortError|The user aborted/i.test(msg);

      if (isAbort) {
        let nextLocal = [...messagesRef.current];
        const revIdx = [...nextLocal]
          .reverse()
          .findIndex((m) => m.role === "assistant" && m.status === "sending");
        const aIdx = revIdx >= 0 ? nextLocal.length - 1 - revIdx : -1;

        if (aIdx >= 0) {
          const partial = String(nextLocal[aIdx]?.content ?? "");
          if (partial.length === 0) nextLocal.splice(aIdx, 1);
          else nextLocal[aIdx] = { ...nextLocal[aIdx], status: "sent" };
        }

        const hasNotice = nextLocal.some((m) => m.metadata?.stoppedByUser);
        if (!hasNotice) {
          nextLocal.push({
            id: createId("notice"),
            role: "assistant",
            content: REPLY_CANCEL_MESSAGE,
            createdAt: nowIso(),
            status: "sent",
            metadata: { notice: true, stoppedByUser: true },
          });
        }

        mutateMessages(nextLocal, { persistToSessionId: targetSid });
        requestAnimationFrame(() => {
          taRef.current?.focus();
          autosize();
        });
      } else {
        // Real error → convert any streaming placeholder to an error bubble and surface message
        const msg = String(err?.message ?? err ?? "");

        // Start from latest snapshot so we don't lose in-flight updates
        let nextLocal = [...messagesRef.current];

        // Mark the triggering user message as error (optional but keeps meta consistent)
        nextLocal = nextLocal.map((m) =>
          m.id === userId ? { ...m, status: "error" } : m,
        );

        // Find the most recent assistant bubble that was streaming
        const revIdx = [...nextLocal]
          .reverse()
          .findIndex((m) => m.role === "assistant" && m.status === "sending");
        const aIdx = revIdx >= 0 ? nextLocal.length - 1 - revIdx : -1;

        const errorNode = (
          <>
            <Icon icon="error" />
            <span> Something went wrong{msg ? ` — ${msg}` : ""}.</span>
          </>
        );

        if (aIdx >= 0) {
          // Replace the streaming placeholder so the typing dots go away
          nextLocal[aIdx] = {
            ...nextLocal[aIdx],
            content: errorNode as any,
            status: "error",
            error: true,
            metadata: { ...(nextLocal[aIdx].metadata ?? {}), error: msg },
          };
        } else {
          // No placeholder (non-stream path) → append a dedicated error bubble
          nextLocal.push({
            id: createId("error"),
            role: "assistant",
            content: errorNode as any,
            createdAt: nowIso(),
            status: "error",
            error: true,
            metadata: { error: msg },
          });
        }

        mutateMessages(nextLocal);
        onEvent?.("error", { error: msg });

        requestAnimationFrame(() => {
          taRef.current?.focus();
          autosize();
        });
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
      stoppedByUserRef.current = false;
    }
  }, [
    text,
    loading,
    messagesState,
    inputBehavior.clearOnSend,
    onStreamMessage,
    onSendMessage,
    streamByDefault,
    onMessagesChange,
    onEvent,
    context,
    saveOrUpdateCurrentSession,
    setActiveSession,
    autosize,
    isRenaming,
  ]);

  const handleNewChat = () => {
    const prevId = saveOrUpdateCurrentSession(messagesRef.current); // snapshot-safe

    let seeded: ChatMessage[] = [];
    const seed = resolveSeed(); // unified logic

    if (seed != null) {
      seeded = [normalizeInitialMessage(seed)];
      initialSeededRef.current = true;
    } else {
      initialSeededRef.current = false;
    }

    setActiveSession(null);
    mutateMessages(seeded, { silent: true });
    setText("");
    onEvent?.("new_chat", { prevSessionId: prevId });

    const el = listRef.current;
    if (el) requestAnimationFrame(() => scrollToBottom(el));
    requestAnimationFrame(() => {
      taRef.current?.focus();
      autosize();
    });
  };

  /** ------- Dynamic height (pinned) ------- */
  const recalcPinnedHeights = useCallback(() => {
    if (mode !== "pinned") return;

    const root = sidePanelRef.current;
    const messagesDiv = messagesDivRef.current;
    const footer = footerRef.current;
    if (!root || !messagesDiv || !footer) return;

    const rootRect = root.getBoundingClientRect();
    const msgRect = messagesDiv.getBoundingClientRect();

    const cs = getComputedStyle(root);
    const padTop = parseFloat(cs.paddingTop) || 0;
    const padBottom = parseFloat(cs.paddingBottom) || 0;

    const topGap = Math.max(
      0,
      Math.round(msgRect.top - (rootRect.top + padTop)),
    );
    const footerH = Math.ceil(footer.getBoundingClientRect().height);

    let available =
      Math.floor(root.clientHeight - topGap - footerH - padBottom) - 12;
    if (!Number.isFinite(available)) return;
    available = Math.max(0, available);

    messagesDiv.style.height = `${available}px`;
    messagesDiv.style.maxHeight = `${available}px`;
  }, [mode]);

  useEffect(() => {
    if (mode !== "pinned") return;
    const ta = taRef.current;
    if (!ta || typeof ResizeObserver === "undefined") return;

    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => recalcPinnedHeights());
    });

    ro.observe(ta);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [mode, recalcPinnedHeights]);

  useLayoutEffect(() => {
    autosize();
    if (mode === "pinned") {
      requestAnimationFrame(() => recalcPinnedHeights());
    }
  }, [text, autosize, mode, recalcPinnedHeights]);

  useLayoutEffect(() => {
    recalcPinnedHeights();
  }, [isOpen, rendered, recalcPinnedHeights, text]);

  useEffect(() => {
    if (mode !== "pinned") return;
    const observers: ResizeObserver[] = [];
    const addRO = (el: Element | null) => {
      if (!el || typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(() => recalcPinnedHeights());
      ro.observe(el);
      observers.push(ro);
    };

    addRO(sidePanelRef.current);
    addRO(footerRef.current);
    addRO(messagesDivRef.current);

    if (portalRoot instanceof Element) addRO(portalRoot); // container height changes

    return () => observers.forEach((ro) => ro.disconnect());
  }, [mode, portalRoot, recalcPinnedHeights]);

  /** Compute header title: append active chat name if present */
  const activeTitle = useMemo(
    () =>
      sessionsState.find((s) => s.id === activeSessionId)?.title?.trim() || "",
    [sessionsState, activeSessionId],
  );
  const headerTitle = activeTitle ? `${title} (${activeTitle})` : title;

  /** Messages panel content (shared) */
  const PanelContent = (
    <>
      {description && (
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
          {description}
        </div>
      )}

      <S.Messages
        $fixedH={mode === "pinned" ? undefined : historyHeight}
        ref={(el) => {
          messagesDivRef.current = el;
          listRef.current = el;
        }}
        onScroll={onScroll}
        data-now={nowTick}
      >
        {messagesState.map((m) => (
          <div key={m.id}>
            <S.Row $mine={m.role === "user"}>
              <S.Bubble
                $mine={m.role === "user"}
                $error={m.error}
                $notice={!!m.metadata?.notice}
              >
                {m.role === "assistant" &&
                m.status === "sending" &&
                String(m.content ?? "").length === 0 ? (
                  <S.TypingIndicator aria-label="Assistant is typing">
                    <S.Dot $variant="light" $delay={0} />
                    <S.Dot $variant="base" $delay={120} />
                    <S.Dot $variant="dark" $delay={240} />
                  </S.TypingIndicator>
                ) : typeof m.content === "string" || typeof m.content === "number" ? (
                  <MarkdownContent value={String(m.content)} />
                ) : React.isValidElement(m.content) ? (
                  m.content
                ) : (m as any)?.content?.props ? (
                  <MarkdownContent value={toPlainText((m as any).content.props?.children)} />
                ) : (
                  <span style={{ opacity: 0.7, fontStyle: "italic" }}>
                    [unsupported content]
                  </span>
                )}
              </S.Bubble>
            </S.Row>
            <S.MetaLine $mine={m.role === "user"}>
              {timeAgo(m.createdAt)} •{" "}
              {m.status === "sending"
                ? "sending"
                : m.status === "sent"
                ? "sent"
                : m.status === "error"
                ? "error"
                : ""}
            </S.MetaLine>
          </div>
        ))}
      </S.Messages>
      <S.Footer
        ref={footerRef as any}
        onSubmit={(e) => {
          e.preventDefault();
          if (isRenaming) return;
          handleSend();
        }}
      >
        <S.InputWrap>
          <S.ChatTextarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={2}
            disabled={loading || isRenaming}
            readOnly={loading || isRenaming}
          />

          <S.IconDock>
            <S.IconGhostBtn
              type="button"
              title="Attach file (coming soon)"
              disabled
              aria-disabled="true"
            >
              <Icon icon="attach_file" />
            </S.IconGhostBtn>

            <div>
              {onStreamMessage && loading && (
                <S.TypingIndicator aria-label="Assistant is typing">
                  <S.Dot $variant="light" $delay={0} />
                  <S.Dot $variant="base" $delay={120} />
                  <S.Dot $variant="dark" $delay={240} />
                </S.TypingIndicator>
              )}
              {onStreamMessage && loading ? (
                <S.IconGhostBtn
                  type="button"
                  onClick={() => {
                    stoppedByUserRef.current = true;
                    abortRef.current?.abort();
                    abortRef.current = null;
                    setLoading(false);
                    onEvent?.("cancel_stream");
                  }}
                  title="Stop streaming"
                  disabled={isRenaming}
                >
                  <Icon icon="stop" />
                </S.IconGhostBtn>
              ) : (
                <S.IconGhostBtn
                  type="submit"
                  disabled={loading || !text.trim() || isRenaming}
                  title="Send"
                >
                  <Icon icon="send" />
                </S.IconGhostBtn>
              )}
            </div>
          </S.IconDock>
        </S.InputWrap>
      </S.Footer>
    </>
  );

  /** Right side controls: ICON-ONLY (no background buttons in header) */
  const RightClusterContent = () => (
    <S.RightCluster>
      <span
        role="button"
        aria-label="New chat"
        title="New chat"
        onClick={handleNewChat}
        style={{
          display: "inline-flex",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <Icon icon="add" />
      </span>

      <S.HistoryWrap ref={historyWrapRef}>
        <span
          role="button"
          aria-label="History"
          title="History"
          onClick={() => setHistoryOpen((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            cursor: "pointer",
          }}
          aria-expanded={historyOpen}
        >
          <Icon icon="history" />
        </span>

        {historyOpen && (
          <S.HistoryDropdown role="menu">
            {sessionsState.length === 0 ? (
              <S.DropdownEmpty>(No saved chats)</S.DropdownEmpty>
            ) : (
              sessionsState.map((s) => (
                <S.DropdownItem
                  key={s.id}
                  role="menuitem"
                  onClick={() => loadSession(s.id)}
                  title={`${s.title} • ${timeAgo(s.updatedAt)}`}
                  className={s.id === activeSessionId ? "active" : undefined}
                >
                  <div className="dropdown-title">
                    {s.title}
                    <div className="meta">{timeAgo(s.updatedAt)}</div>
                  </div>
                  <div
                    className="item-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <S.ActionIcon
                      role="button"
                      title="Rename"
                      onClick={() => openRename(s.id, s.title)}
                    >
                      <Icon icon="create" size={14} />
                    </S.ActionIcon>

                    <S.ActionIcon
                      className="danger"
                      role="button"
                      title="Delete"
                      onClick={() => setDeleteTargetId(s.id)}
                    >
                      <Icon icon="delete_forever" size={14} />
                    </S.ActionIcon>
                  </div>
                </S.DropdownItem>
              ))
            )}
          </S.HistoryDropdown>
        )}
      </S.HistoryWrap>
    </S.RightCluster>
  );

  /** Floating panel */
  const floatingPanel = !rendered ? null : (
    <S.WindowMount
      $position={position}
      $maxW={maxWidth}
      $zIndex={zIndex + 1}
      $offset={offset}
    >
      <S.AnimatedPanel
        $entering={!!isOpen && !isExiting}
        $exiting={!isOpen && isExiting}
        $pos={position}
      >
        <Panel
          title={headerTitle}
          leftIcon={{ icon: "chat" }}
          rightIcons={[
            {
              icon: "clear",
              onClick: () => setOpen(false),
              tooltip: "Close",
            },
          ]}
          rightContent={<RightClusterContent />}
        >
          <S.PanelFill>{PanelContent}</S.PanelFill>
        </Panel>
      </S.AnimatedPanel>
    </S.WindowMount>
  );

  /** Pinned handle INSIDE portal/container */
  const pinnedHandle =
    mode === "pinned" ? (
      <S.PinnedHandleLayer
        $zIndex={zIndex}
        $fixed={portalRoot === document.body}
      >
        <S.PinnedHandle
          $side={side}
          $offset={offset}
          aria-label={isOpen ? "Hide chat" : "Show chat"}
          title={isOpen ? "Hide chat" : "Show chat"}
          onClick={() => setOpen(!isOpen)}
        >
          <Icon
            icon={
              isOpen
                ? side === "right"
                  ? "keyboard_arrow_right"
                  : "keyboard_arrow_left"
                : "chat"
            }
            size={18}
          />
        </S.PinnedHandle>
      </S.PinnedHandleLayer>
    ) : null;

  const pinnedPanel =
    mode === "pinned" && rendered ? (
      <S.PinnedMount
        $side={side}
        $maxW={maxWidth}
        $zIndex={zIndex}
        $fixed={portalRoot === document.body}
      >
        <S.SidePanel
          ref={sidePanelRef}
          $side={side}
          $entering={!!isOpen && !isExiting}
          $exiting={!isOpen && isExiting}
        >
          <Panel
            title={headerTitle}
            leftIcon={{ icon: "chat" }}
            rightIcons={[
              { icon: "clear", onClick: () => setOpen(false), tooltip: "Hide" },
            ]}
            rightContent={<RightClusterContent />}
          >
            <S.PanelFill>{PanelContent}</S.PanelFill>
          </Panel>
        </S.SidePanel>
      </S.PinnedMount>
    ) : null;

  /** Floating launcher FAB (icon-only). Fully unmounted while open. */
  const showFab = mode === "floating" && showLauncher && !isOpen;
  const launcherFab = showFab ? (
    <S.RootPortalWrap $position={position} $offset={offset} $zIndex={zIndex}>
      <S.LauncherFab
        aria-expanded={isOpen}
        aria-controls="chatwidget"
        onClick={() => setOpen(true)}
        title="Open chat"
      >
        <Icon icon="chat" size={18} />
        {unread > 0 && (
          <S.UnreadDot aria-label={`${unread} unread`}>{unread}</S.UnreadDot>
        )}
      </S.LauncherFab>
    </S.RootPortalWrap>
  ) : null;

  const content = (
    <>
      {mode === "floating" && floatingPanel}
      {launcherFab}
      {pinnedHandle}
      {pinnedPanel}

      <Modal
        show={!!deleteTargetId}
        title="Delete chat"
        leftIcon={{ icon: "delete_forever" }}
        color="danger"
        isSubHeader
        onClose={() => setDeleteTargetId(null)}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#991b1b",
            }}
          >
            <Icon icon="warning" />
            <div>
              <b>Heads up:</b> This will permanently remove the chat and its
              messages.
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#4b5563" }}>
            You can’t undo this action. If you just want to hide it, consider
            renaming instead.
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 8,
            }}
          >
            <Button color="default" onClick={() => setDeleteTargetId(null)}>
              Cancel
            </Button>
            <Button
              color="danger"
              onClick={() => {
                deleteSessionById(deleteTargetId!);
                setDeleteTargetId(null);
              }}
            >
              <Icon icon="delete_forever" /> Delete
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        show={!!renameState}
        title="Rename chat"
        onClose={() => {
          setRenameState(null);
          requestAnimationFrame(() => {
            taRef.current?.focus();
            autosize();
          });
        }}
        leftIcon={{ icon: "edit" }}
      >
        {/* Capture Enter inside modal; prevent leaking to chat */}
        <div
          ref={renameModalRef}
          style={{ display: "grid", gap: 12 }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.stopPropagation();
              if (renameState?.value?.trim()) {
                renameSessionById(renameState.id, renameState.value);
                setRenameState(null);
                requestAnimationFrame(() => {
                  taRef.current?.focus();
                  autosize();
                });
              }
            }
          }}
        >
          <div style={{ fontSize: 13, color: "#4b5563" }}>
            Give this conversation a short, descriptive name so you can find it
            later.
          </div>

          {/* If your DS supports inputRef/onKeyDown props, they’re passed here. */}
          <FormControl
            name="chatTitle"
            label="Chat name"
            type="text"
            value={renameState?.value}
            onChange={(e: any) =>
              setRenameState({
                id: renameState?.id ?? "",
                value: e.target?.value ?? e,
              })
            }
            placeholder="e.g., Refund flow discussion"
            // @ts-ignore
            inputRef={renameInputRef}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 8,
            }}
          >
            <Button
              color="default"
              onClick={() => {
                setRenameState(null);
                requestAnimationFrame(() => {
                  taRef.current?.focus();
                  autosize();
                });
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={() => {
                renameSessionById(
                  renameState?.id ?? "",
                  renameState?.value ?? "",
                );
                setRenameState(null);
                requestAnimationFrame(() => {
                  taRef.current?.focus();
                  autosize();
                });
              }}
              disabled={!renameState?.value?.trim()}
            >
              <Icon icon="check" /> Save
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );

  // Only portal if a *real* portalRoot was provided.
  const shouldPortal = enablePortal && isBrowser && !!portalRoot;
  if (shouldPortal) return createPortal(content, portalRoot as Element);
  return content;
};

export default ChatWidget;
export type { ChatMessage } from "./interfaces";
