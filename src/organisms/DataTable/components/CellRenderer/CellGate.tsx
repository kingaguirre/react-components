import React from "react";

/**
 * CellGate: suspend the render (showing the Suspense fallback) until
 *  - `until` promise resolves OR
 *  - `ready === true`.
 */
export const CellGate: React.FC<{
  ready?: boolean;
  until?: Promise<unknown> | null;
  children?: React.ReactNode;
}> = ({ ready = true, until, children }) => {
  const neverRef = React.useRef<Promise<never> | null>(null);

  if (until) {
    // Let Suspense handle real async (data fetching / dynamic import)
    throw until;
  }
  if (!ready) {
    // Force skeleton via an unresolved promise
    if (!neverRef.current) {
      neverRef.current = new Promise<never>(() => {}); // never resolves
    }
    throw neverRef.current;
  }
  return <>{children}</>;
};
