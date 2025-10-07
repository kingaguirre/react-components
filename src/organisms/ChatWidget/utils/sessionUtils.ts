import React from "react";
import type { ChatMessage, ChatRole } from "../interfaces";
import { createId, nowIso } from "./";

export type MutateOptions = {
  /** Persist changes against this specific session id (pin streaming to origin). */
  persistToSessionId?: string | null;
  /** Do not update sessions list (no reorder, no title/updatedAt bump). */
  silent?: boolean;
};

export const messagesForPersistence = (msgs: ChatMessage[]) =>
  msgs
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        !m.metadata?.seeded &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({ ...m, content: String(m.content) as any }));

export const makeTitle = (msgs: ChatMessage[]) => {
  const pick = (roles: ChatRole[]) =>
    msgs.find(
      (m) =>
        roles.includes(m.role) &&
        typeof m.content === "string" &&
        m.content.trim().length > 0 &&
        !m.metadata?.seeded,
    );

  const firstUser = pick(["user"]);
  const firstAssistant = pick(["assistant"]);
  const src =
    (firstUser?.content as string) || (firstAssistant?.content as string) || "";

  const title = src.replace(/\s+/g, " ").trim().slice(0, 48);
  return title || "New chat";
};

export const upperFirst = (s: string) =>
  typeof s === "string" && s.length ? s[0].toUpperCase() + s.slice(1) : s;

export const makeTitleCap = (msgs: ChatMessage[]) =>
  upperFirst(makeTitle(msgs));

export const normalizeInitialMessage = (
  seedAny:
    | string
    | React.ReactElement
    | Partial<ChatMessage>
    | null
    | undefined,
): ChatMessage => {
  const seed = seedAny;
  if (typeof seed === "string" || React.isValidElement(seed)) {
    return {
      id: createId("assistant"),
      role: "assistant",
      content: seed as any,
      createdAt: nowIso(),
      status: "sent",
      metadata: { ignoreUnread: true, seeded: true },
    };
  }
  const base = (seed ?? null) as Partial<ChatMessage> | null;
  if (!base) {
    return {
      id: createId("assistant"),
      role: "assistant",
      content: "" as any,
      createdAt: nowIso(),
      status: "sent",
      metadata: { ignoreUnread: true, seeded: true },
    };
  }
  return {
    id: base.id ?? createId("assistant"),
    role: (base.role as any) ?? "assistant",
    content: (base.content as any) ?? "",
    createdAt: base.createdAt ?? nowIso(),
    status: (base.status as any) ?? "sent",
    metadata: { ...(base.metadata ?? {}), ignoreUnread: true, seeded: true },
    error: base.error,
  };
};
