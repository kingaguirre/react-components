let activeId: number | null = null;
const emitter = new EventTarget();
let installed = false;

export const getActiveTable = () => activeId;

export const setActiveTable = (id: number | null) => {
  if (activeId === id) return;
  activeId = id;
  emitter.dispatchEvent(new CustomEvent("change", { detail: activeId }));
};

export const subscribeActiveTable = (fn: (id: number | null) => void) => {
  const handler = (e: Event) => fn((e as CustomEvent<number | null>).detail);
  emitter.addEventListener("change", handler);
  return () => emitter.removeEventListener("change", handler);
};

export const ensureActiveTableGlobalListeners = () => {
  if (installed) return;
  installed = true;

  const WRAP_SELECTOR = ".data-table-wrapper";

  const findWrapper = (target: EventTarget | null): HTMLElement | null => {
    const el = target as any;
    const path: EventTarget[] =
      typeof el?.composedPath === "function" ? el.composedPath() : [];
    for (const n of path) {
      if (n instanceof HTMLElement && n.matches(WRAP_SELECTOR)) return n;
    }
    return (target as Element | null)?.closest?.(WRAP_SELECTOR) ?? null;
  };

  const setFromTarget = (t: EventTarget | null) => {
    const wrap = findWrapper(t);
    if (!wrap) {
      setActiveTable(null);
      return;
    }
    const idAttr = wrap.getAttribute("data-table-instanceid");
    const id = idAttr ? Number(idAttr) : NaN;
    setActiveTable(Number.isNaN(id) ? null : id);
  };

  // Track last pointer timestamp so we can tell mouse-induced focus vs keyboard focus
  let lastPointerTs = 0;
  document.addEventListener(
    "pointerdown",
    () => {
      lastPointerTs = performance.now();
    },
    true,
  );

  // Keyboard/programmatic focus only: if focus happens right after pointer, skip (it’s a mouse click)
  document.addEventListener(
    "focusin",
    (e) => {
      if (performance.now() - lastPointerTs < 250) return; // mouse-triggered; let click activation handle it
      setFromTarget(e.target);
    },
    true,
  );

  // Deactivate after a completed click outside any table
  document.addEventListener(
    "click",
    (e) => {
      const wrap = findWrapper(e.target);
      if (!wrap) queueMicrotask(() => setActiveTable(null));
    },
    true,
  );

  // ⛔️ No global pointerdown activation (that’s what was breaking first clicks)
};
