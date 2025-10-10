import type { AIAdapter, Msg, RunAdaptersFn } from "./interfaces";

const STOP_SENTINEL = "[[ADAPTER:STOP]]";

export function createRunAdapters(adapters: AIAdapter[]): RunAdaptersFn {
  return async ({ text, messages, context, dataBase }) => {
    const systems: Msg[] = [];

    // 1) memory stage (safe to prepend always)
    for (const a of adapters) {
      if (typeof a.buildMemory === "function") {
        const m = await a.buildMemory();
        if (m) systems.push(m);
      }
    }

    // 2) augment stage (short-circuit on STOP and return ONLY that adapter's output)
    for (const a of adapters) {
      const adds = await a.augment({
        text,
        messages,
        context: { ...(context || {}), dataBase },
      });

      if (!adds?.length) continue;

      const hadStop = adds.some(
        (m) =>
          typeof m?.content === "string" && m.content.includes(STOP_SENTINEL),
      );
      const cleaned = adds.filter(
        (m) =>
          !(
            typeof m?.content === "string" && m.content.includes(STOP_SENTINEL)
          ),
      );

      if (hadStop) {
        // Return ONLY this adapter’s cleaned output to ensure exact control
        return cleaned;
      }

      systems.push(...cleaned);
    }

    return systems;
  };
}

export * from "./interfaces";
export * from "./dataReaderAdapter";
export * from "./uiScreenAdapter";
export * from "./uploadCompareAdapter";
