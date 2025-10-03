import { useCallback, useEffect, useRef } from "react";
import type { ChatSession } from "../interfaces";
import { isBrowser } from "./";

/** Provide stable, synchronous access to the desired storage. */
export const useStorage = (persistStorage: "local" | "session") => {
  const resolveStorage = useCallback((): Storage | null => {
    if (!isBrowser) return null;
    return persistStorage === "session"
      ? window.sessionStorage
      : window.localStorage;
  }, [persistStorage]);

  const storageRef = useRef<Storage | null>(resolveStorage());

  useEffect(() => {
    storageRef.current = resolveStorage();
  }, [resolveStorage]);

  return { storageRef, resolveStorage };
};

export const readSessionsFromStorage = (
  persistKey: string,
  storageRef: React.MutableRefObject<Storage | null>,
  resolveStorage: () => Storage | null,
): ChatSession[] => {
  try {
    const store = storageRef.current ?? resolveStorage();
    if (!store) return [];
    const raw = store.getItem(persistKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    const clean = parsed.map((s) => ({
      ...s,
      messages: (s.messages ?? [])
        .filter(
          (m: any) =>
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim().length > 0 &&
            !m.metadata?.seeded,
        )
        .map((m: any) => ({ ...m, content: String(m.content) })),
    }));
    return clean;
  } catch {
    return [];
  }
};

export const writeSessionsToStorage = (
  persistKey: string,
  sessions: ChatSession[],
  storageRef: React.MutableRefObject<Storage | null>,
  resolveStorage: () => Storage | null,
) => {
  try {
    const store = storageRef.current ?? resolveStorage();
    if (!store) return;
    const clean = sessions.map((s) => ({
      ...s,
      messages: (s.messages ?? [])
        .filter(
          (m: any) =>
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim().length > 0 &&
            !m.metadata?.seeded,
        )
        .map((m: any) => ({ ...m, content: String(m.content) })),
    }));
    store.setItem(persistKey, JSON.stringify(clean));
  } catch {
    /* ignore */
  }
};

/** Call `flush` on unload/visibility-hidden. */
export const useFlushOnExit = (flush: () => void) => {
  useEffect(() => {
    const onUnload = () => flush();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flush]);
};
