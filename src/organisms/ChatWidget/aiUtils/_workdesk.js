// src/organisms/ChatWidget/server/workdesk.js
import { makeTabularPlugin } from "../../../common/server/ai/tabularPlugin.js";

export function workdeskPlugin({ baseUrl, cacheTtlMs = 0, makeDownloadLink }) {
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
          row?.status ??
          row?.base?.status ??
          "";
        return /pending|initiated|in[-\s]?progress|awaiting|on[-\s]?hold|review|draft/i.test(ws)
          ? "PENDING" : "REGISTERED";
      },
      keyAccessor: (row) => row?.trn ?? row?.base?.trn ?? row?.id ?? row?.base?.id,
    },
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
    alwaysDeepFetchAll: true,   // keeps full dataset context available
    // no explicit scopeGuard or outOfScopeMessage — rubric-only
    brandNames: ["tradexpress helix", "trade express helix", "helix", "tradeexpress"],
    kb: {
      brand: "TradeXpress Helix",
      title: "About TradeXpress Helix",
      tagline: "A modern, AI-assisted workdesk for trade operations.",
      about: `
        Event-driven, global platform for Trade Finance, simplified.
        TradeXpress is next generation state of the art application developed using event driven
        architecture to support trade finance transaction processing. TradeXpress is a global
        Business, Technology and Operations initiative that will revolutionise the Trade Finance
        world for the Bank. The key objectives of Trade Port are to provide our clients with a
        complete suite of products across all our markets; to become number one Trade Finance
        bank globally. We will re-align our operations model to address market and economic
        pressures implementing a standard global target operating model. And we will deliver a
        fully integrated back end operating platform that will enable greater efficiencies and
        provide comprehensive product offerings across all our markets.

        TradeXpress will drive extensive benefits for our clients as well as our staff. Clients
        will be able to access broader trade product offering delivered consistently in all our
        markets. New products or capabilities will be available sooner across the network. Using
        a single global system with integrated workflow and imaging, processing of clients
        transactions will be completed faster, eliminating the need for cut off times and
        introducing a true 24/7 operating environment. Workflow management will ensure
        transactions will be accurately tracked, traced, monitored and routed based on various
        predefined parameters to different teams for better control and efficiency. With the
        Bank&apos;s global footprint, exporters and importers across all client segments — from
        SME to Global Corporates — will benefit. TradeXpress will enable one-step processing for
        transactions where clients at both ends of the transaction bank with SCB.
      `,
      keyCapabilities: [
        "Unified transaction workdesk (EIF/IIF/SUF and more)",
        "AI summaries and date-range analytics over historical data",
        "Exception visibility and status tracking",
        "Lightweight retrieval APIs for dashboards and bots",
      ],
      whoItServes: ["Trade Operations", "Middle Office", "Risk/Compliance", "Business Ops"],
      dataModelNotes: {
        itemTerminology: "Each row is a transaction",
        latestDefinition: "Latest = highest __receivedAtMs / most recent receivedAt",
      },
      contact: {
        general: "helix-support@tradexpress.example",
        security: "security@tradexpress.example",
        website: "https://example.com/helix"
      },
      ownership: {
        productOwnerTeam: "Helix Platform",
        engineeringTeam: "Helix Engineering",
        maintainerGroup: "Helix Core Services",
      },
      people: [
        { role: "Head, Platform and AI Engineering",   name: "Nox",     email: "nox@sc.com" },
        { role: "Engineering Lead, Application Frameworks",  name: "Neil",    email: "neil@sc.com" },
        { role: "Engineering Lead, Strategic Foundation Services",  name: "Krishna", email: "krishna@sc.com" },
        { role: "Developer",         name: "King",    email: "king@sc.com" },
        { role: "Developer",         name: "Clem",    email: "clem@sc.com" }
      ],
    },
    makeDownloadLink
  });
}