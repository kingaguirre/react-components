import React, { useMemo, useEffect, useState } from "react";
import type { Meta } from "@storybook/react";
import axios from "axios";
import { StoryWrapper, Title } from "../../../components/StoryWrapper";
import { CodeBlock } from "../../../components/CodeBlock";
import { DataTable } from "../index";
import { ServerSideGuide } from "../docs/ServerSideGuide";
import { ColumnSetting } from "../interface";
import { FormControl } from "../../../atoms/FormControl";
import { Dropdown } from "../../../molecules/Dropdown";

/* -----------------------------------------------------------------------------
   Config: Local API base (run `node server.js`)
----------------------------------------------------------------------------- */
const API_BASE = "http://localhost:4000";

/* -----------------------------------------------------------------------------
   Red notice if local server isn't up
----------------------------------------------------------------------------- */
function ServerStatusNotice() {
  const [alive, setAlive] = useState<boolean | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 1200);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/health`, { signal: abort.signal });
        setAlive(res.ok);
      } catch {
        setAlive(false);
      } finally {
        clearTimeout(timer);
      }
    })();
    return () => {
      abort.abort();
      clearTimeout(timer);
    };
  }, []);

  if (alive !== false) return null;

  return (
    <Card
      tone="danger"
      title="Local API not detected"
      subtitle={`Start it at project root:  node server.js   (listens on ${API_BASE})`}
    >
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <strong>Open a terminal at your project root</strong> and run{" "}
          <code>node server.js</code>. Keep this process running while you use the stories.
        </li>
      </ul>

      <p style={{ marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>
        These stories talk to a small local API (1,000 generated products) so you can demo
        server-side pagination, search, filters, and sorting without external calls.
      </p>

      <p style={{ marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>
        <strong>Simulated latency:</strong> endpoints respond with a small delay to surface loading states.
        Configure via env vars <code>DELAY_MS</code> (base) and <code>DELAY_JITTER</code> (±), e.g.{" "}
        <code>DELAY_MS=400 DELAY_JITTER=200 node server.js</code>. You can also override per request
        with <code>?__delay=800</code>. The <code>/health</code> check is always instant.
      </p>
    </Card>
  );
}

/* -----------------------------------------------------------------------------
   Shared columns (used by all demos)
----------------------------------------------------------------------------- */
const DEMO_COLUMNS: ColumnSetting[] = [
  {
    title: "ID",
    column: "id",
    width: 80,
    draggable: false,
    filter: false, // example on how to disble filter
  },
  { title: "Title", column: "title", width: 280 },
  { title: "Brand", column: "brand", width: 180 },
  {
    title: "Category",
    column: "category",
    width: 180,
    filter: {
      type: "dropdown",
      options: [
        { text: "beauty", value: "beauty" },
        { text: "furniture", value: "furniture" },
        { text: "groceries", value: "groceries" },
      ],
    },
  },
  { title: "Price", column: "price", width: 120, align: "right" },
  { title: "Rating", column: "rating", width: 120, align: "right" },
];

/* -----------------------------------------------------------------------------
   Tiny helpers (filter/sort fallback for demos that need local processing)
----------------------------------------------------------------------------- */
function normalizeFilterValue(input: any): string {
  if (input == null) return "";
  if (Array.isArray(input)) return normalizeFilterValue(input[0]);
  if (typeof input === "object") return String(input.value ?? "").trim();
  return String(input).trim();
}
function includesCI(haystack: unknown, needle: string) {
  if (!needle) return true;
  if (haystack == null) return false;
  return String(haystack).toLowerCase().includes(String(needle).toLowerCase());
}
function localFilterRows(
  rows: any[],
  globalFilter: string,
  columnFilters: any[],
) {
  let out = rows;
  if (globalFilter?.trim()) {
    const q = globalFilter.trim().toLowerCase();
    out = out.filter(
      (r) =>
        String(r.title).toLowerCase().includes(q) ||
        String(r.brand).toLowerCase().includes(q) ||
        String(r.category).toLowerCase().includes(q),
    );
  }
  for (const f of columnFilters ?? []) {
    const v = normalizeFilterValue(f.value);
    if (!v) continue;
    out = out.filter((r) => includesCI((r as any)[f.id], v));
  }
  return out;
}
function localSortRows(rows: any[], sorting: any[]) {
  const s = sorting?.[0];
  if (!s?.id) return rows;
  const dir = s.desc ? -1 : 1;
  return [...rows].sort((a, b) => {
    const va = (a as any)[s.id];
    const vb = (b as any)[s.id];
    if (va == null && vb == null) return 0;
    if (va == null) return -1 * dir;
    if (vb == null) return 1 * dir;
    return (
      (typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb))) * dir
    );
  });
}

/* -----------------------------------------------------------------------------
   Pretty wrapper + code blocks (match ServerSideGuide look & feel)
----------------------------------------------------------------------------- */
function Card({
  title,
  subtitle,
  tone = "info",
  children,
}: {
  title: string;
  subtitle?: string;
  tone?: "info" | "success" | "danger";
  children: React.ReactNode;
}) {
  const theme =
    tone === "info"
      ? {
          bg: "linear-gradient(180deg,#F5FAFF 0%, #F1F5FF 100%)",
          border: "#D6E4FF",
          title: "#1d4ed8",
          shadow: "0 8px 24px rgba(29,78,216,0.06)",
          icon: "🧭",
        }
      : tone === "success"
      ? {
          bg: "linear-gradient(180deg,#F3FFF8 0%, #EBFEF3 100%)",
          border: "#C7F9E0",
          title: "#047857",
          shadow: "0 8px 24px rgba(4,120,87,0.06)",
          icon: "✅",
        }
      : {
          bg: "linear-gradient(180deg,#FFF5F5 0%, #FFEFEF 100%)",
          border: "#F9C2C2",
          title: "#b91c1c",
          shadow: "0 8px 24px rgba(185,28,28,0.06)",
          icon: "⛔",
        };

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 4,
        border: `1px solid ${theme.border}`,
        background: theme.bg,
        boxShadow: theme.shadow,
        margin: "14px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 18 }}>{theme.icon}</span>
        <div>
          <div style={{ fontWeight: 800, color: theme.title }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 12, opacity: 0.8 }}>{subtitle}</div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

/* -----------------------------------------------------------------------------
   Storybook meta
----------------------------------------------------------------------------- */
const meta: Meta<typeof DataTable> = {
  title: "organisms/DataTable/Serve-side Data Rendering",
  component: DataTable,
  tags: ["!autodocs"],
};
export default meta;

/* =============================================================================
   SIMPLE — Pagination only (no column filters, no sorting)
   GET /products/search?q=${globalFilter}&limit=${pageSize}&skip=${pageIndex*pageSize}
============================================================================= */
const fetchProductsSimple = async (params: any) => {
  const { pageIndex, pageSize, globalFilter = "" } = params;
  const qs = new URLSearchParams({
    q: globalFilter ?? "",
    limit: String(pageSize),
    skip: String(pageIndex * pageSize),
  });
  const res = await fetch(`${API_BASE}/products/search?${qs.toString()}`);
  if (!res.ok) throw new Error("Fetch failed");
  const json = await res.json();
  return { rows: json.products ?? [], total: json.total ?? 0 };
};

export const Simple = {
  name: "Simple",
  render: () => {
    const topSnippet = useMemo(
      () => `// 🔎 Pagination against Local API (query string style)
const fetchProductsSimple = async (params) => {
  const { pageIndex, pageSize, globalFilter = '' } = params
  const qs = new URLSearchParams({
    q: globalFilter ?? '',
    limit: String(pageSize),
    skip: String(pageIndex * pageSize),
  })
  const res = await fetch(\`${API_BASE}/products/search?\${qs.toString()}\`)
  if (!res.ok) throw new Error('Fetch failed')
  const json = await res.json()
  return { rows: json.products ?? [], total: json.total ?? 0 }
}`,
      [],
    );

    const bottomSnippet = useMemo(
      () => `// 🧩 Usage — rows come from your fetcher (dataSource not needed)
<DataTable
  serverMode
  server={{
    fetcher: fetchProductsSimple, // 👈 check above
    debounceMs: 350
  }}
  dataSource={[]} // In server mode, dataSource is ignored (table loads from fetcher)
  columnSettings={DEMO_COLUMNS}
/>`,
      [],
    );

    return (
      <StoryWrapper
        title="Server-side Rendering / Simple"
        subTitle="Manual pagination against a local endpoint. The table runs in serverMode and calls your fetcher when the page (or global search) changes. No column filters or sorting here."
      >
        <ServerStatusNotice />

        <Card
          title="Fetcher Function: fetchProductsSimple"
          subtitle="Pagination-only via Local API"
          tone="info"
        >
          <CodeBlock code={topSnippet} highlighted="fetchProductsSimple" />
        </Card>

        <Title>Products (remote)</Title>
        <DataTable
          serverMode
          server={{ fetcher: fetchProductsSimple, debounceMs: 350 }}
          dataSource={[]} // In server mode, dataSource is ignored (table loads from fetcher)
          enableGlobalFiltering={false}
          enableColumnFiltering={false}
          enableColumnSorting={false}
          enableColumnResizing
          enableColumnPinning
          columnSettings={DEMO_COLUMNS}
        />

        <Card
          title="Usage (wired to your fetcher)"
          subtitle="The DataTable consumes only { rows, total } from your function"
          tone="success"
        >
          <CodeBlock code={bottomSnippet} highlighted="fetchProductsSimple" />
        </Card>
        <ServerSideGuide />
      </StoryWrapper>
    );
  },
};

/* =============================================================================
   FILTERING — Pagination + globalFilter + columnFilters (no sorting)
============================================================================= */
const fetchProductsFiltering = async (params: any) => {
  const { pageIndex, pageSize, columnFilters = [], globalFilter = "" } = params;
  const qs = new URLSearchParams({
    limit: "0",
    select: "id,title,brand,category,price,rating",
  });
  const res = await fetch(`${API_BASE}/products?${qs.toString()}`);
  if (!res.ok) throw new Error("Fetch failed");
  const json = await res.json();
  let rows = Array.isArray(json?.products) ? json.products : [];
  rows = localFilterRows(rows, globalFilter, columnFilters);
  const total = rows.length;
  const start = pageIndex * pageSize;
  const page = rows.slice(start, start + pageSize);
  return { rows: page, total };
};

export const Filtering = {
  name: "Filtering",
  render: () => {
    const topSnippet = useMemo(
      () => `// 🧪 Filtering demo: global + per-column (post-filter pagination)
const fetchProductsFiltering = async (params) => {
  const { pageIndex, pageSize, columnFilters = [], globalFilter = '' } = params

  // columnFilters example:
  // [
  //   { id: 'id',    value: 'x' },
  //   { id: 'title', value: 'x' }
  // ]

  const qs = new URLSearchParams({ limit: '0', select: 'id,title,brand,category,price,rating' })
  const res = await fetch(\`${API_BASE}/products?\${qs.toString()}\`)
  if (!res.ok) throw new Error('Fetch failed')
  const json = await res.json()

  let rows = Array.isArray(json?.products) ? json.products : []
  rows = localFilterRows(rows, globalFilter, columnFilters)

  const total = rows.length
  const start = pageIndex * pageSize
  const page = rows.slice(start, start + pageSize)
  return { rows: page, total }
}`,
      [],
    );

    const bottomSnippet = useMemo(
      () => `// 🧩 Usage — rows come from your fetcher (dataSource not needed)
<DataTable
  serverMode
  server={{
    fetcher: fetchProductsFiltering, // 👈 check above
    debounceMs: 350
  }}
  dataSource={[]} // In server mode, dataSource is ignored (table loads from fetcher)
  columnSettings={DEMO_COLUMNS}
/>`,
      [],
    );

    return (
      <StoryWrapper
        title="Server-side Rendering / Filtering"
        subTitle="Combines global search and per-column filters in serverMode. We fetch a minimal set, apply filters locally for correctness, then paginate the filtered results."
      >
        <ServerStatusNotice />

        <Card
          title="Fetcher Function: fetchProductsFiltering"
          subtitle="Global + column filters with post-filter pagination"
          tone="info"
        >
          <CodeBlock code={topSnippet} highlighted="fetchProductsFiltering" />
        </Card>

        <Title>Products (remote)</Title>
        <DataTable
          serverMode
          server={{ fetcher: fetchProductsFiltering, debounceMs: 350 }}
          dataSource={[]} // In server mode, dataSource is ignored (table loads from fetcher)
          enableGlobalFiltering
          enableColumnFiltering
          enableColumnSorting={false}
          enableColumnResizing
          enableColumnPinning
          columnSettings={DEMO_COLUMNS}
        />

        <Card
          title="Usage (wired to your fetcher)"
          subtitle="Filters are mapped by your fetcher; DataTable just sends the state"
          tone="success"
        >
          <CodeBlock
            code={bottomSnippet}
            highlighted="fetchProductsFiltering"
          />
        </Card>
      </StoryWrapper>
    );
  },
};

/* =============================================================================
   SORTING — Pagination + sorting (no column filters)
============================================================================= */
const fetchProductsSorting = async (params: any) => {
  const { pageIndex, pageSize, sorting = [], globalFilter = "" } = params;
  const s = sorting?.[0];
  const qs = new URLSearchParams({
    q: globalFilter ?? "",
    limit: String(pageSize),
    skip: String(pageIndex * pageSize),
  });
  if (s?.id) {
    qs.set("sortBy", s.id);
    qs.set("order", s.desc ? "desc" : "asc");
  }
  const res = await fetch(`${API_BASE}/products/search?${qs.toString()}`);
  if (!res.ok) throw new Error("Fetch failed");
  const json = await res.json();
  return { rows: json.products ?? [], total: json.total ?? 0 };
};

export const Sorting = {
  name: "Sorting",
  render: () => {
    const topSnippet = useMemo(
      () => `// ⬆️⬇️ Sorting demo (server controls ordering)
const fetchProductsSorting = async (params) => {
  const { pageIndex, pageSize, sorting = [], globalFilter = '' } = params
  const s = sorting?.[0]

  const qs = new URLSearchParams({
    q: globalFilter ?? '',
    limit: String(pageSize),
    skip: String(pageIndex * pageSize),
  })
  if (s?.id) {
    qs.set('sortBy', s.id)
    qs.set('order', s.desc ? 'desc' : 'asc')
  }

  const res = await fetch(\`${API_BASE}/products/search?\${qs.toString()}\`)
  if (!res.ok) throw new Error('Fetch failed')
  const json = await res.json()
  return { rows: json.products ?? [], total: json.total ?? 0 }
}`,
      [],
    );

    const bottomSnippet = useMemo(
      () => `// 🧩 Usage — rows come from your fetcher (dataSource not needed)
<DataTable
  serverMode
  server={{
    fetcher: fetchProductsSorting, // 👈 check above
    debounceMs: 350
  }}
  dataSource={[]} // In server mode, dataSource is ignored (table loads from fetcher)
  columnSettings={DEMO_COLUMNS}
/>`,
      [],
    );

    return (
      <StoryWrapper
        title="Server-side Rendering / Sorting"
        subTitle="Server-controlled sorting with manual pagination. Column filters are disabled in this demo—only page changes and header clicks trigger your fetcher."
      >
        <ServerStatusNotice />

        <Card
          title="Fetcher Function: fetchProductsSorting"
          subtitle="Sorting + pagination via Local API"
          tone="info"
        >
          <CodeBlock code={topSnippet} highlighted="fetchProductsSorting" />
        </Card>

        <Title>Products (remote)</Title>
        <DataTable
          serverMode
          server={{ fetcher: fetchProductsSorting, debounceMs: 350 }}
          dataSource={[]} // In server mode, dataSource is ignored (table loads from fetcher)
          enableGlobalFiltering
          enableColumnFiltering={false}
          enableColumnSorting
          enableColumnResizing
          enableColumnPinning
          columnSettings={DEMO_COLUMNS}
        />

        <Card
          title="Usage (wired to your fetcher)"
          subtitle="Sorting params are passed as sorting[0] = { id, desc }"
          tone="success"
        >
          <CodeBlock code={bottomSnippet} highlighted="fetchProductsSorting" />
        </Card>
      </StoryWrapper>
    );
  },
};

/* =============================================================================
   AXIOS — Pagination only (axios transport)
============================================================================= */
const fetchProductsAxios = async (params: any) => {
  const { pageIndex, pageSize, globalFilter = "" } = params;
  const { data } = await axios.get(`${API_BASE}/products/search`, {
    params: {
      q: globalFilter,
      limit: pageSize,
      skip: pageIndex * pageSize,
    },
  });
  return { rows: data.products ?? [], total: data.total ?? 0 };
};

export const Axios = {
  name: "Axios",
  render: () => {
    const topSnippet = useMemo(
      () => `import axios from 'axios'

// 📦 Same as Simple (pagination-only), using axios
const fetchProductsAxios = async (params) => {
  const { pageIndex, pageSize, globalFilter = '' } = params
  const { data } = await axios.get('${API_BASE}/products/search', {
    params: {
      q: globalFilter,
      limit: pageSize,
      skip: pageIndex * pageSize,
    },
  })
  return { rows: data.products ?? [], total: data.total ?? 0 }
}`,
      [],
    );

    const bottomSnippet = useMemo(
      () => `// 🧩 Usage — rows come from your fetcher (dataSource not needed)
<DataTable
  serverMode
  server={{
    fetcher: fetchProductsAxios, // 👈 check above
    debounceMs: 350
  }}
  dataSource={[]} // In server mode, dataSource is ignored (table loads from fetcher)
  columnSettings={DEMO_COLUMNS}
/>`,
      [],
    );

    return (
      <StoryWrapper
        title="Server-side Rendering / Axios"
        subTitle="Same as Simple (pagination-only) but implemented with axios—ideal if you use interceptors or a shared HTTP client."
      >
        <ServerStatusNotice />

        <Card
          title="Fetcher Function: fetchProductsAxios"
          subtitle="Pagination-only via axios transport"
          tone="info"
        >
          <CodeBlock code={topSnippet} highlighted="fetchProductsAxios" />
        </Card>

        <Title>Products (remote)</Title>
        <DataTable
          serverMode
          server={{ fetcher: fetchProductsAxios, debounceMs: 350 }}
          dataSource={[]} // In server mode, dataSource is ignored (table loads from fetcher)
          enableGlobalFiltering
          enableColumnFiltering={false}
          enableColumnSorting={false}
          enableColumnResizing
          enableColumnPinning
          columnSettings={DEMO_COLUMNS}
        />

        <Card
          title="Usage (wired to your fetcher)"
          subtitle="Identical wiring; only the transport changes"
          tone="success"
        >
          <CodeBlock code={bottomSnippet} highlighted="fetchProductsAxios" />
        </Card>
      </StoryWrapper>
    );
  },
};

/* =============================================================================
   ADVANCED — Axios + pagination + sorting + global & column filters
============================================================================= */
const fetchProductsAdvanced = async (params: any) => {
  const {
    pageIndex,
    pageSize,
    sorting = [],
    columnFilters = [],
    globalFilter = "",
  } = params;
  const s = sorting?.[0];
  const needAggregate = (columnFilters?.length ?? 0) > 0;

  if (needAggregate) {
    // Aggregate fallback: fetch minimal → filter/sort locally → slice
    const { data } = await axios.get(`${API_BASE}/products`, {
      params: { limit: 0, select: "id,title,brand,category,price,rating" },
    });
    let rows = Array.isArray(data?.products) ? data.products : [];
    rows = localFilterRows(rows, globalFilter, columnFilters);
    rows = localSortRows(rows, sorting);
    const total = rows.length;
    const start = pageIndex * pageSize;
    const page = rows.slice(start, start + pageSize);
    return { rows: page, total };
  }

  // Fast path: combine search + sort server-side
  const qs: Record<string, string | number> = {
    q: globalFilter ?? "",
    limit: pageSize,
    skip: pageIndex * pageSize,
  };
  if (s?.id) {
    (qs as any).sortBy = s.id;
    (qs as any).order = s.desc ? "desc" : "asc";
  }
  const { data } = await axios.get(`${API_BASE}/products/search`, {
    params: qs,
  });
  return { rows: data.products ?? [], total: data.total ?? 0 };
};

export const Advanced = {
  name: "Advanced",
  render: () => {
    const topSnippet = useMemo(
      () => `import axios from 'axios'

// 🧩 Full serverMode: pagination + sorting + global & column filtering
const fetchProductsAdvanced = async (params) => {
  const { pageIndex, pageSize, sorting = [], columnFilters = [], globalFilter = '' } = params
  const s = sorting?.[0]
  const needAggregate = (columnFilters?.length ?? 0) > 0

  if (needAggregate) {
    // Aggregate fallback: fetch minimal → filter/sort locally → slice
    const { data } = await axios.get('${API_BASE}/products', {
      params: { limit: 0, select: 'id,title,brand,category,price,rating' },
    })
    let rows = Array.isArray(data?.products) ? data.products : []
    rows = localFilterRows(rows, globalFilter, columnFilters)
    rows = localSortRows(rows, sorting)
    const total = rows.length
    const start = pageIndex * pageSize
    const page = rows.slice(start, start + pageSize)
    return { rows: page, total }
  }

  // Fast path: combine search + sort server-side
  const qs = {
    q: globalFilter ?? '',
    limit: pageSize,
    skip: pageIndex * pageSize,
    ...(s?.id ? { sortBy: s.id, order: s.desc ? 'desc' : 'asc' } : {})
  }
  const { data } = await axios.get('${API_BASE}/products/search', { params: qs })
  return { rows: data.products ?? [], total: data.total ?? 0 }
}`,
      [],
    );

    const bottomSnippet = useMemo(
      () => `// 🧩 Usage — rows come from your fetcher (dataSource not needed)
<DataTable
  serverMode
  server={{
    fetcher: fetchProductsAdvanced, // 👈 check above
    debounceMs: 350
  }}
  dataSource={[]} // In server mode, dataSource is ignored (table loads from fetcher)
  columnSettings={DEMO_COLUMNS}
/>`,
      [],
    );

    return (
      <StoryWrapper
        title="Server-side Rendering / Advanced"
        subTitle="Full serverMode: pagination + sorting + global & column filtering using axios. If the API can’t combine constraints, we switch to an aggregate fallback (fetch minimal, filter/sort locally, paginate)."
      >
        <ServerStatusNotice />

        <Card
          title="Fetcher Function: fetchProductsAdvanced"
          subtitle="Axios transport + smart fallback when API can’t combine constraints"
          tone="info"
        >
          <CodeBlock code={topSnippet} highlighted="fetchProductsAdvanced" />
        </Card>

        <Title>Products (remote)</Title>
        <DataTable
          serverMode
          server={{ fetcher: fetchProductsAdvanced, debounceMs: 350 }}
          dataSource={[]} // In server mode, dataSource is ignored (table loads from fetcher)
          enableGlobalFiltering
          enableColumnFiltering
          enableColumnSorting
          enableColumnResizing
          enableColumnPinning
          columnSettings={DEMO_COLUMNS}
        />

        <Card
          title="Usage (wired to your fetcher)"
          subtitle="Server mode consumes exactly { rows, total }"
          tone="success"
        >
          <CodeBlock code={bottomSnippet} highlighted="fetchProductsAdvanced" />
        </Card>
      </StoryWrapper>
    );
  },
};

/* =============================================================================
   UPLOAD & DOWNLOAD — Full demo on top of serverMode
============================================================================= */
export const UploadAndDownload = {
  name: "Upload & Download (server mode)",
  render: () => {
    // Reuse the advanced fetcher so sorting/filtering/pagination all work
    // (You already defined fetchProductsAdvanced above)
    const fetcher = fetchProductsAdvanced;

    // Column set: hide "Rating" to demonstrate that exports can still include hidden cols
    const COLS_WITH_HIDDEN: ColumnSetting[] = useMemo(
      () =>
        DEMO_COLUMNS.map((c) =>
          c.column === "rating" ? { ...c, hidden: true } : c,
        ),
      [],
    );

    // Upload controls: show how to wire events. onImport just logs here.
    const uploadControls = useMemo(
      () => ({
        title: "Upload CSV/XLSX",
        onOpen: () => console.log("[Upload] picker opened"),
        onUpload: (file: File) => console.log("[Upload] selected:", file?.name),
        onUploading: (busy: boolean) => console.log("[Upload] busy:", busy),
        onImport: (rows: Array<Record<string, any>>) => {
          // In real app, you'd prepend/merge rows into your data source.
          console.log("[Upload] aligned rows ready:", rows.length, rows.slice(0, 3));
        },
        onComplete: ({ importedCount }: { importedCount: number }) =>
          console.log(`[Upload] complete: imported ${importedCount} rows`),
        onError: (err: any) => console.error("[Upload] error:", err),
      }),
      [],
    );

    // Download controls: custom labels/icons, defaults, and event hooks.
    const downloadControls = useMemo(
      () => ({
        fileName: "products",
        format: "xlsx" as const,
        labels: { selected: "Export selected", all: "Export all" },
        icons: { selected: "download_done", all: "file_download" },
        onOpen: () => console.log("[Download] menu open"),
        onClose: () => console.log("[Download] menu close"),
        onConfigChange: (cfg: { fileName: string; format: "xlsx" | "csv" }) =>
          console.log("[Download] config:", cfg),
        onDownloading: (
          kind: "selected" | "all",
          meta: { fileName: string; format: "xlsx" | "csv"; count: number },
        ) => console.log(`[Download] ${kind}:`, meta),
        onComplete: (
          kind: "selected" | "all",
          meta: { fileName: string; format: "xlsx" | "csv"; count: number },
        ) => console.log(`[Download] ${kind} complete:`, meta),
        onError: (err: any) => console.error("[Download] error:", err),
        // Note: visibility of “Download selected” is controlled by enableRowSelection on the table
      }),
      [],
    );

    return (
      <StoryWrapper
        title="Server-side Rendering / Upload & Download"
        subTitle="End-to-end demo of the import/export controls in server mode. Sorting, filtering and pagination are server-driven; exports include hidden columns by default."
      >
        <ServerStatusNotice />

        <Card
          title="What this shows"
          subtitle="Upload with review modal • custom export labels/icons • hidden column included in export • selected/all downloads"
          tone="info"
        >
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>
              <strong>Row selection enabled</strong> so “Download selected” appears (and disables with 0 selected).
            </li>
            <li>
              <strong>Hidden column</strong> (<code>Rating</code>) is not visible, but is included in exported files.
            </li>
            <li>
              Upload uses your web-worker + review modal; events are logged to the console.
            </li>
          </ul>
        </Card>

        <Title>Products (remote)</Title>
        <DataTable
          serverMode
          server={{ fetcher, debounceMs: 350 }}
          dataSource={[]} // ignored in serverMode
          enableGlobalFiltering
          enableColumnFiltering
          enableColumnSorting
          enableColumnResizing
          enableColumnPinning
          enableRowSelection
          enableUpload
          enableDownload
          uploadControls={uploadControls}
          downloadControls={downloadControls}
          columnSettings={COLS_WITH_HIDDEN}
        />

        <Card
          title="Notes"
          tone="success"
          subtitle="A few helpful details for wiring in your app"
        >
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>
              <code>enableRowSelection</code> controls visibility of “Download selected”. You set it to{" "}
              <strong>true</strong> here.
            </li>
            <li>
              The default export includes <em>hidden</em> columns. In this demo, <code>Rating</code> is hidden on
              the grid but present in the exported file.
            </li>
            <li>
              Upload’s <code>onImport</code> gives you aligned rows; merge them with your data in your app’s state.
            </li>
          </ul>
        </Card>
      </StoryWrapper>
    );
  },
};

// -----------------------------------------------------------------------------
// External filter options
// -----------------------------------------------------------------------------
const EXT_BRANDS = [
  "Acme","Nova","Atlas","Zenith","Lumina","Nimbus","Vertex","Solace","Polaris","Aether",
];
const RATING_OPTS = [
  { value: "", text: "All ratings" },
  { value: "1", text: "≥ 1.0" },
  { value: "2", text: "≥ 2.0" },
  { value: "3", text: "≥ 3.0" },
  { value: "4", text: "≥ 4.0" },
  { value: "4.5", text: "≥ 4.5" },
];

/* =============================================================================
   ADVANCED + EXTERNAL FILTERS (SIMPLE)
   - Uses FormControl + Dropdown (brand, minRating)
   - Fetcher is intentionally minimal (no local fallback)
============================================================================= */
const fetchProductsAdvancedExternalSimple = async (
  params: any,
  brand?: string,
  minRating?: number
) => {
  const { pageIndex, pageSize, sorting = [], globalFilter = "" } = params;
  const s = sorting?.[0];

  const qs: Record<string, any> = {
    q: globalFilter ?? '',
    limit: pageSize,
    skip: pageIndex * pageSize,
    ...(s?.id ? { sortBy: s.id, order: s.desc ? 'desc' : 'asc' } : {}),
    ...(brand ? { brand } : {}),
    ...(Number.isFinite(minRating) ? { minRating } : {})
  };

  const { data } = await axios.get(`${API_BASE}/products/search`, { params: qs });
  return { rows: data.products ?? [], total: data.total ?? 0 };
};

export const ExternalFiltersSimple = {
  name: "Advanced + External Filters (Simple)",
  render: () => {
    // --- external UI state
    const [brand, setBrand] = useState<string>("");
    const [minRating, setMinRating] = useState<string>("");

    // --- curry external state into fetcher; keep DataTable API unchanged
    const fetcher = useMemo(() => (params: any) =>
      fetchProductsAdvancedExternalSimple(
        params,
        brand || undefined,
        minRating ? Number(minRating) : undefined
      ), [brand, minRating]);

    // --- code block for the fetcher (like other stories)
    const topSnippet = useMemo(
      () => `// Minimal external-filters fetcher (server does the work)
const fetchProductsAdvancedExternalSimple = async (params, brand, minRating) => {
  const { pageIndex, pageSize, sorting = [], globalFilter = '' } = params
  const s = sorting?.[0]

  const qs = {
    q: globalFilter ?? '',
    limit: pageSize,
    skip: pageIndex * pageSize,
    ...(s?.id ? { sortBy: s.id, order: s.desc ? 'desc' : 'asc' } : {}),
    ...(brand ? { brand } : {}),
    ...(Number.isFinite(minRating) ? { minRating } : {})
  }

  const { data } = await axios.get('${API_BASE}/products/search', { params: qs })
  return { rows: data.products ?? [], total: data.total ?? 0 }
}`,
      []
    );

    return (
      <StoryWrapper
        title="Server-side Rendering / Advanced + External Filters (Simple)"
        subTitle="External Brand and Min Rating live above the grid. We curry them into the fetcher; DataTable stays the same."
      >
        <ServerStatusNotice />

        <Card title="Fetcher Function" subtitle="Highlighted for quick copy/paste" tone="info">
          <CodeBlock code={topSnippet} highlighted="fetchProductsAdvancedExternalSimple" />
        </Card>

        <Title>Products (remote)</Title>
        {/* External filters: directly above the table */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(220px, 1fr) minmax(220px, 1fr)",
            gap: 12,
            alignItems: "end",
            margin: "8px 0 16px",
            maxWidth: 400
          }}
        >
          <Dropdown
            label="Brand"
            options={[{ value: "", text: "All brands" }, ...EXT_BRANDS.map((b) => ({ value: b, text: b }))]}
            value={brand}
            onChange={(v: any) => setBrand(typeof v === "string" ? v : v?.value ?? "")}
          />

          <Dropdown
            label="Min rating"
            options={RATING_OPTS}
            value={minRating}
            onChange={(v: any) => setMinRating(typeof v === "string" ? v : v?.value ?? "")}
            clearable
          />
        </div>

        <DataTable
          serverMode
          server={{ fetcher, debounceMs: 350 }}
          dataSource={[]} // ignored in serverMode
          enableGlobalFiltering
          enableColumnFiltering={false} // keep simple; column filters off
          enableColumnSorting
          enableColumnResizing
          enableColumnPinning
          columnSettings={DEMO_COLUMNS}
        />
      </StoryWrapper>
    );
  },
};
