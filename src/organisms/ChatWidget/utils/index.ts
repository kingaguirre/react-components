// src/organisms/ChatWidget/utils/index.ts
export const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

export const createId = (prefix = "msg") =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const nowIso = () => new Date().toISOString();

export const scrollToBottom = (el: HTMLElement) => {
  el.scrollTop = el.scrollHeight;
};

export * from './persistence'
export * from './sessionUtils'
export * from './useControlled'
