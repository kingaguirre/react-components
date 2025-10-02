// src/organisms/ChatWidget/server/workdesk.js
import { makeTabularPlugin } from "../../../common/server/ai/tabularPlugin.js";

export function workdeskPlugin({ baseUrl, cacheTtlMs = 0 }) {
  return makeTabularPlugin({
    baseUrl,
    cacheTtlMs,
    endpoints: {
      list: "/workdesk",
      full: "/workdesk/full",
      byKey: (trn) => `/txn/${trn}`, // TRN details
    },
    memory: {
      datasetName: "Workdesk",
      itemSingular: "transaction",
      itemPlural: "transactions",
      synonyms: ["row", "record", "entry", "txn"],
    },
    shape: {
      // works for both flat rows and { base: {...} } rows
      timestampAccessor: (row) =>
        typeof row?.__receivedAtMs === "number"
          ? row.__receivedAtMs
          : typeof row?.base?.__receivedAtMs === "number"
          ? row.base.__receivedAtMs
          : Date.parse(row?.receivedAt || row?.base?.receivedAt || ""),
      statusAccessor: (row) => {
        const ws =
          row?.workflowStage ??
          row?.base?.workflowStage ??
          "";
        return /Initiated/i.test(ws) ? "PENDING" : "REGISTERED";
      },
      keyAccessor: (row) => row?.trn ?? row?.base?.trn ?? row?.id ?? row?.base?.id,
    },
    // show some extra facets for convenience
    facets: [
      (r) => (r?.product ?? r?.base?.product),
      (r) => (r?.bookingLocation ?? r?.base?.bookingLocation),
      (r) => (r?.workflowStage ?? r?.base?.workflowStage),
      (r) => {
        const ms =
          typeof r?.__receivedAtMs === "number"
            ? r.__receivedAtMs
            : typeof r?.base?.__receivedAtMs === "number"
            ? r.base.__receivedAtMs
            : Date.parse(r?.receivedAt || r?.base?.receivedAt || "");
        if (!Number.isFinite(ms)) return undefined;
        return new Date(ms).getUTCFullYear();
      },
    ],
    // CRUCIAL: keep full dataset available every turn (prevents 50-row fallback)
    alwaysDeepFetchAll: true,
    scopeGuard: "soft",          // "off" | "soft" | "hard"
    allowSmalltalk: true,
    allowGeneric: true,
  });
}
