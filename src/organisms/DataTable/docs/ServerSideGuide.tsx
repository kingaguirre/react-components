import React from "react";

export function ServerSideGuide() {
  const s = styles();
  return (
    <div style={s.wrapper} aria-label="DataTable Server Mode – Quick Guide">
      <header style={s.header}>
        <span style={s.headerIcon}>🧭</span>
        <div>
          <div style={s.title}>Server-side DataTable: Quick Guide</div>
          <div style={s.subtitle}>
            Drive pagination, search, filters & sorting via your fetcher.
          </div>
        </div>
      </header>

      <section style={s.section}>
        <div style={s.sectionTitle}>⚙️ Enable server mode</div>
        <pre style={s.code}>
          {`<DataTable
  serverMode
  server={{ fetcher: myFetcher, debounceMs: 300 }}
  columnSettings={[/* your columns */]}
/>`}
        </pre>
        <ul style={s.ul}>
          <li>
            <b>serverMode</b> — turn on server behavior
          </li>
          <li>
            <b>server.fetcher</b> — your async loader (required)
          </li>
          <li>
            <b>debounceMs</b> — debounce global search input
          </li>
        </ul>
      </section>

      <hr style={s.hr} />

      <section style={s.section}>
        <div style={s.sectionTitle}>🧪 Fetcher contract</div>
        <pre style={s.code}>
          {`type Params = {
  pageIndex: number
  pageSize: number
  sorting: { id: string; desc: boolean }[]
  columnFilters: { id: string; value: any }[]
  globalFilter: string
}

type Result<T> = { rows: T[]; total: number } // rows = current page; total = post-filter count`}
        </pre>
        <Callout tone="info">
          Return <b>only</b> the current page in <b>rows</b> and the correct{" "}
          <b>total</b> after filters.
        </Callout>
      </section>

      <hr style={s.hr} />

      <section style={s.section}>
        <div style={s.sectionTitle}>🔗 Example endpoint</div>
        <pre style={s.code}>
          {`// Search + pagination (DummyJSON)
GET /products/search?q=\${globalFilter}&limit=\${pageSize}&skip=\${pageIndex*pageSize}`}
        </pre>
      </section>
    </div>
  );
}

function Callout({
  children,
  tone = "info",
}: React.PropsWithChildren<{ tone?: "info" | "tip" | "note" }>) {
  const s = styles();
  const palette =
    tone === "info"
      ? {
          background: rgba("#1ea7fd", 0.06),
          borderColor: rgba("#1ea7fd", 0.35),
        }
      : tone === "tip"
        ? {
            background: "rgba(0,200,0,0.06)",
            borderColor: "rgba(0,200,0,0.35)",
          }
        : { background: "rgba(0,0,0,0.03)", borderColor: s.border };
  return (
    <div style={{ ...s.callout, ...palette }}>
      <span style={s.calloutIcon}>ℹ️</span>
      <div>{children}</div>
    </div>
  );
}

/* ——— styles ——— */
function styles() {
  const varOr = (name: string, fallback: string) => `var(${name}, ${fallback})`;
  const primary = varOr("--color-primary", "#1ea7fd");
  const fg = varOr("--color-text", "#0b0c0f");
  const fgSubtle = varOr("--color-text-muted", "#4b5563");
  const bg = varOr("--sb-doc-bg", "#ffffff");
  const panel = varOr("--panel-bg", "#f7f7f9");
  const border = varOr("--color-border", "#e5e7eb");

  return {
    wrapper: {
      marginTop: 16,
      padding: 16,
      border: `1px solid ${border}`,
      borderRadius: 4,
      background: `linear-gradient(180deg, ${panel}, ${bg})`,
      color: fg,
      fontSize: 13,
      lineHeight: 1.55,
    } as React.CSSProperties,
    header: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      paddingBottom: 8,
      borderBottom: `1px dashed ${border}`,
      marginBottom: 12,
    } as React.CSSProperties,
    headerIcon: { fontSize: 22 } as React.CSSProperties,
    title: {
      fontWeight: 800,
      fontSize: 14,
      letterSpacing: 0.2,
    } as React.CSSProperties,
    subtitle: { fontSize: 12, color: fgSubtle } as React.CSSProperties,
    section: { marginTop: 10 } as React.CSSProperties,
    sectionTitle: { fontWeight: 700, marginBottom: 6 } as React.CSSProperties,
    code: {
      background: "rgba(11,12,15,0.04)",
      border: `1px solid ${border}`,
      padding: 12,
      borderRadius: 4,
      overflowX: "auto",
      margin: "8px 0",
      whiteSpace: "pre",
      fontSize: 12,
    } as React.CSSProperties,
    ul: { margin: "6px 0 0 0", paddingLeft: 18 } as React.CSSProperties,
    hr: {
      border: 0,
      borderTop: `1px dashed ${border}`,
      margin: "12px 0",
    } as React.CSSProperties,
    callout: {
      display: "grid",
      gridTemplateColumns: "20px 1fr",
      alignItems: "start",
      gap: 8,
      padding: 10,
      borderRadius: 4,
      border: `1px solid ${border}`,
      marginTop: 8,
    } as React.CSSProperties,
    calloutIcon: { fontSize: 14, lineHeight: "20px" } as React.CSSProperties,
    border,
    primary,
  };
}

function rgba(hexOrVar: string, alpha: number) {
  if (!hexOrVar.startsWith("#"))
    return `color-mix(in srgb, ${hexOrVar} ${alpha * 100}%, transparent)`;
  const hex = hexOrVar.replace("#", "");
  const n = parseInt(hex.length === 3 ? hex.repeat(2) : hex, 16);
  const r = hex.length === 3 ? ((n >> 8) & 0xf) * 17 : (n >> 16) & 255;
  const g = hex.length === 3 ? ((n >> 4) & 0xf) * 17 : (n >> 8) & 255;
  const b = hex.length === 3 ? (n & 0xf) * 17 : n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
