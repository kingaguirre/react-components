// Lightweight event bus for revealing the ErrorSummary dock
const EVENT = "form:errorSummary:show";

export type ErrorSummaryRevealDetail = {
  // keep collapsed by default (same as submit)
  expand?: boolean; // if you want to auto-expand later, set true when dispatching
};

export const revealErrorSummary = (detail: ErrorSummaryRevealDetail = {}) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<EventDetail>(EVENT as any, { detail } as any),
  );
};

type EventDetail = CustomEvent<ErrorSummaryRevealDetail>;

export const onRevealErrorSummary = (
  handler: (detail: ErrorSummaryRevealDetail) => void,
) => {
  if (typeof window === "undefined") return () => {};
  const wrapped = (e: Event) =>
    handler((e as unknown as EventDetail).detail ?? {});
  window.addEventListener(EVENT, wrapped as EventListener);
  return () => window.removeEventListener(EVENT, wrapped as EventListener);
};
