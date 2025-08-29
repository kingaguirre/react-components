import React, { useMemo } from "react";
import type { Meta } from "@storybook/react";
import axios from "axios";
import { StoryWrapper, Title } from "../../../components/StoryWrapper";
import { CodeBlock } from "../../../components/CodeBlock";
import { DataTable } from "../index";
import { ServerSideGuide } from "../docs/ServerSideGuide";
import { ColumnSetting } from "../interface";

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
  tone?: "info" | "success";
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
      : {
          bg: "linear-gradient(180deg,#F3FFF8 0%, #EBFEF3 100%)",
          border: "#C7F9E0",
          title: "#047857",
          shadow: "0 8px 24px rgba(4,120,87,0.06)",
          icon: "✅",
        };

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
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
  title: "organisms/DataTable/Server Side Rendering",
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
  const res = await fetch(
    `https://dummyjson.com/products/search?${qs.toString()}`,
  );
  if (!res.ok) throw new Error("Fetch failed");
  const json = await res.json();
  return { rows: json.products ?? [], total: json.total ?? 0 };
};

export const Simple = {
  name: "Simple",
  render: () => {
    const topSnippet = useMemo(
      () => `// 🔎 Pagination against DummyJSON (query string style)
const fetchProductsSimple = async (params) => {
  const { pageIndex, pageSize, globalFilter = '' } = params
  const qs = new URLSearchParams({
    q: globalFilter ?? '',
    limit: String(pageSize),
    skip: String(pageIndex * pageSize),
  })
  const res = await fetch(\`https://dummyjson.com/products/search?\${qs.toString()}\`)
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
        subTitle="Manual pagination against a remote endpoint. The table runs in serverMode and calls your fetcher when the page (or global search) changes. No column filters or sorting here."
      >
        <Card
          title="Fetcher Function: fetchProductsSimple"
          subtitle="Pagination-only via DummyJSON’s query string API"
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
  const res = await fetch(`https://dummyjson.com/products?${qs.toString()}`);
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
  const res = await fetch(\`https://dummyjson.com/products?\${qs.toString()}\`)
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
  const res = await fetch(
    `https://dummyjson.com/products/search?${qs.toString()}`,
  );
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

  const res = await fetch(\`https://dummyjson.com/products/search?\${qs.toString()}\`)
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
        <Card
          title="Fetcher Function: fetchProductsSorting"
          subtitle="Sorting + pagination via DummyJSON search"
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
  const { data } = await axios.get("https://dummyjson.com/products/search", {
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
  const { data } = await axios.get('https://dummyjson.com/products/search', {
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
    const { data } = await axios.get("https://dummyjson.com/products", {
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
  const { data } = await axios.get("https://dummyjson.com/products/search", {
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
    const { data } = await axios.get('https://dummyjson.com/products', {
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
  const { data } = await axios.get('https://dummyjson.com/products/search', { params: qs })
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
