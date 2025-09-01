import { useMemo, useState, useCallback } from "react";
import type { Meta } from "@storybook/react";
import axios from "axios";
import { DataTable } from "../index";
import { ColumnSetting } from "../interface";
import { StoryWrapper, Title } from "../../../components/StoryWrapper";
import { Guide } from "../../../components/Guide";

/* -----------------------------------------------------------------------------
   Lazy XLSX (avoids type errors if @types/xlsx isn't installed)
----------------------------------------------------------------------------- */
let XLSXMod: typeof import("xlsx") | null = null;
async function getXLSX() {
  if (XLSXMod) return XLSXMod;
  XLSXMod = await import("xlsx"); // normal dynamic import, no vite-ignore needed
  return XLSXMod;
}

/* -----------------------------------------------------------------------------
   Shared columns
----------------------------------------------------------------------------- */
const COLS: ColumnSetting[] = [
  { title: "ID", column: "id", width: 80, draggable: false, filter: false },
  { title: "Title", column: "title", width: 280 },
  { title: "Brand", column: "brand"},
  { title: "Category", column: "category", width: 180 },
  { title: "Price", column: "price", width: 120, align: "right" },
  // keep hidden TRUE to prove exports include hidden columns by default
  { title: "Rating", column: "rating", width: 120, align: "right", hidden: true },
];

/* -----------------------------------------------------------------------------
   Helpers
----------------------------------------------------------------------------- */
function toAOAFromRows(rows: any[], columns: ColumnSetting[]) {
  const header = columns.map((c) => c.title);
  const body = rows.map((r) =>
    columns.map((c) => {
      const v = (r as any)?.[c.column];
      if (Array.isArray(v)) return v.map((x) => (x == null ? "" : String(x))).join(",");
      if (v == null) return "";
      return v instanceof Date ? v.toISOString() : v;
    }),
  );
  return [header, ...body];
}

async function downloadAOA(
  aoa: any[][],
  opts: { fileName: string; format: "xlsx" | "csv" },
) {
  const XLSX = await getXLSX();
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  if (opts.format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = opts.fileName.endsWith(".csv") ? opts.fileName : `${opts.fileName}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    return;
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = opts.fileName.endsWith(".xlsx") ? opts.fileName : `${opts.fileName}.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* -----------------------------------------------------------------------------
   Storybook meta
----------------------------------------------------------------------------- */
const meta: Meta<typeof DataTable> = {
  title: "organisms/DataTable/Upload & Download",
  component: DataTable,
  tags: ["!autodocs"],
};
export default meta;

/* =============================================================================
   1) DOWNLOAD — basic (built-ins only, hide filename/format)
============================================================================= */
export const DownloadBasic = {
  name: "Download (basic)",
  render: () => {
    const rows = useMemo(
      () => [
        { id: 1, title: "Soap", brand: "Clean Co", category: "beauty", price: 4.5, rating: 4.1 },
        { id: 2, title: "Desk", brand: "Oakline", category: "furniture", price: 199, rating: 4.8 },
        { id: 3, title: "Cereal", brand: "Grainy", category: "groceries", price: 6.9, rating: 3.9 },
      ],
      [],
    );

    const downloadControls = useMemo(
      () => ({
        fileName: "products",
        format: "xlsx" as const,
        showConfigSection: false, // hide filename/format UI
        showBuiltinAll: true,
        showBuiltinSelected: true, // actual visibility still depends on enableRowSelection
      }),
      [],
    );

    const tableSnippet = useMemo(
      () => `<DataTable
  dataSource={rows}
  columnSettings={COLS}
  enableRowSelection
  enableDownload
  downloadControls={{
    fileName: 'products',
    format: 'xlsx',
    showConfigSection: false,
    showBuiltinAll: true,
    showBuiltinSelected: true
  }}
/>`,
      [],
    );

    return (
      <StoryWrapper
        title="Download — basic"
        subTitle="Built-in 'Download selected' and 'Download all', with hidden filename/format options."
      >
        <div style={{ marginTop: 0 }}>
          <Guide
            emoji="⬇️"
            title="Basic download menu"
            subtitle="Use built-in actions; hidden columns are included by default."
            sections={[
              {
                heading: "What this shows",
                bullets: [
                  "<b>Download selected</b> is shown when <code>enableRowSelection</code> is true.",
                  "<b>Download all</b> exports all rows currently in the table data model.",
                  "The filename/format section is hidden via <code>showConfigSection: false</code>.",
                ],
              },
              {
                heading: "Tip",
                body:
                  "Users can clear the filename input; when empty, built-in items disable. Next open restores the default name.",
              },
            ]}
          />
        </div>

        <Title>Products</Title>
        <DataTable
          dataSource={rows}
          columnSettings={COLS}
          enableRowSelection
          enableDownload
          downloadControls={downloadControls}
        />

        <Guide
          emoji="📄"
          title="Usage snippet"
          subtitle="Wiring built-ins with hidden filename/format controls."
          sections={[
            {
              heading: "Code",
              code: tableSnippet,
            },
          ]}
        />
      </StoryWrapper>
    );
  },
};

/* =============================================================================
   2) DOWNLOAD — custom menus + filename/format section
============================================================================= */
export const DownloadCustom = {
  name: "Download (custom)",
  render: () => {
    const rows = useMemo(
      () => [
        { id: 1, title: "Soap", brand: "Clean Co", category: "beauty", price: 4.5, rating: 4.1 },
        { id: 2, title: "Desk", brand: "Oakline", category: "furniture", price: 199, rating: 4.8 },
        { id: 3, title: "Cereal", brand: "Grainy", category: "groceries", price: 6.9, rating: 3.9 },
      ],
      [],
    );

    const downloadControls = useMemo(
      () => ({
        fileName: "products_custom",
        format: "xlsx" as const,
        showConfigSection: true, // show filename + format
        showBuiltinAll: false,
        showBuiltinSelected: false,
        extraMenuItems: [
          {
            key: "tmpl",
            icon: "article",
            label: "Export template (headers only)",
            onClick: async ({ fileName, format }: { fileName: string; format: "xlsx" | "csv" }) => {
              const headerOnly = [COLS.map((c) => c.title)];
              await downloadAOA(headerOnly, { fileName, format });
            },
          },
          {
            key: "headers-first",
            icon: "grid_on",
            label: "Export header + 1st row only",
            separatorAbove: true,
            onClick: async ({ fileName, format }: { fileName: string; format: "xlsx" | "csv" }) => {
              const aoa = toAOAFromRows(rows.slice(0, 1), COLS);
              await downloadAOA(aoa, { fileName, format });
            },
          },
        ],
      }),
      [rows],
    );

    const tableSnippet = useMemo(
      () => `<DataTable
  dataSource={rows}
  columnSettings={COLS}
  enableRowSelection
  enableDownload
  downloadControls={{
    fileName: 'products_custom',
    format: 'xlsx',
    showConfigSection: true,
    showBuiltinAll: true,
    showBuiltinSelected: true,
    extraMenuItems: [
      { key: 'tmpl', icon: 'article', label: 'Export template (headers only)', separatorAbove: true, onClick: async ({ fileName, format }) => {/* ... */} },
      { key: 'headers-first', icon: 'grid_on', label: 'Export header + 1st row only', onClick: async ({ fileName, format }) => {/* ... */} }
    ]
  }}
/>`,
      [],
    );

    return (
      <StoryWrapper
        title="Download — with custom items"
        subTitle="Expose filename/format UI and add your own export actions."
      >
        <div style={{ marginTop: 0 }}>
          <Guide
            emoji="🧩"
            title="Custom download menu items"
            subtitle="Extend the menu with bespoke exports."
            sections={[
              {
                heading: "What this shows",
                bullets: [
                  "Filename + format controls are visible (<code>showConfigSection: true</code>).",
                  "Two custom menu items: a <i>template</i> export and a <i>first-row</i> export.",
                ],
              },
              {
                heading: "Notes",
                bullets: [
                  "Use <code>separatorAbove</code> to visually separate custom sections.",
                  "Your handlers receive <code>{ fileName, format }</code> so you can generate any file you want.",
                ],
              },
            ]}
          />
        </div>

        <Title>Products</Title>
        <DataTable
          dataSource={rows}
          columnSettings={COLS}
          enableRowSelection
          enableDownload
          downloadControls={downloadControls}
        />

        <Guide
          emoji="📄"
          title="Usage snippet"
          subtitle="Custom items + filename/format controls."
          sections={[{ heading: "Code", code: tableSnippet }]}
        />
      </StoryWrapper>
    );
  },
};

/* =============================================================================
   3) UPLOAD — downloadable Excel to test validation
============================================================================= */
export const UploadDemo = {
  name: "Upload",
  render: () => {
    const [data, setData] = useState<any[]>([
      { id: 101, title: "Pencil", brand: "HB", category: "stationery", price: 1.2, rating: 4.2 },
    ]);

    const uploadControls = useMemo(
      () => ({
        title: "Upload CSV/XLSX",
        onImport: (rows: Array<Record<string, any>>) =>
          setData((old) => {
            const withIds = rows.map((r, i) => ({ id: 1000 + Date.now() + i, ...r }));
            return [...withIds, ...old];
          }),
      }),
      [],
    );

    const makeSampleWorkbook = useCallback(async () => {
      // intentionally include: 1) an invalid column, 2) an empty row
      const header = COLS.map((c) => c.title);
      const invalidHeader = "invalid_col";
      const headers = [...header, invalidHeader];

      const sample = [
        ["1", "Notebook", "PaperPro", "stationery", "7.5", "4.0", "WILL_BE_IGNORED"],
        ["", "", "", "", "", "", ""], // empty row
        ["2", "Chair", "SeatCo", "furniture", "45", "3.8", "EXTRA"],
      ];

      const XLSX = await getXLSX();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sample");
      const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const blob = new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "sample-upload.xlsx";
      a.click();
      URL.revokeObjectURL(a.href);
    }, []);

    const tableSnippet = useMemo(
      () => `<DataTable
  dataSource={data}
  columnSettings={COLS}
  enableUpload
  uploadControls={{
    title: 'Upload CSV/XLSX',
    onImport: (rows) => setData((old) => [...mapWithIds(rows), ...old])
  }}
/>`,
      [],
    );

    return (
      <StoryWrapper
        title="Upload"
        subTitle="Download the sample Excel, then upload it. The review modal highlights empty rows and unmatched headers before import."
      >
        <div style={{ marginTop: 0 }}>
          <Guide
            emoji="⬆️"
            title="Upload with pre-import review"
            subtitle="Validate empty rows & unmatched headers before importing."
            sections={[
              {
                heading: "What this shows",
                bullets: [
                  "A <b>review modal</b> reports empty rows and unmatched headers before you proceed.",
                  "Empty rows are automatically ignored on import.",
                ],
              },
              {
                heading: "Try it quickly",
                body: (
                  <button
                    onClick={makeSampleWorkbook}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      background: "linear-gradient(180deg,#ffffff,#f9fafb)",
                      boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>📥</span>
                    Download test Excel (empty row + invalid column)
                  </button>
                ) as any,
              },
            ]}
          />
        </div>

        <Title>Products</Title>
        <DataTable
          dataSource={data}
          columnSettings={COLS}
          enableUpload
          uploadControls={uploadControls}
        />

        <Guide
          emoji="📄"
          title="Usage snippet"
          subtitle="Minimal wiring for uploads."
          sections={[{ heading: "Code", code: tableSnippet }]}
        />
      </StoryWrapper>
    );
  },
};

/* =============================================================================
   4) DOWNLOAD — custom rows payload (extras receive objects, not AOA)
============================================================================= */
function rowsToAOA(rows: any[], cols: ColumnSetting[]) {
  const header = cols.map((c) => c.title);
  const body = rows.map((r) =>
    cols.map((c) => {
      const v = r?.[c.column];
      if (Array.isArray(v)) return v.map((x) => (x == null ? "" : String(x))).join(",");
      if (v == null) return "";
      return v instanceof Date ? v.toISOString() : v;
    }),
  );
  return [header, ...body];
}

export const DownloadCustomRowsPayload = {
  name: "Download (custom rows payload)",
  render: () => {
    const rows = useMemo(
      () => [
        { id: 1, title: "Soap", brand: "Clean Co", category: "beauty", price: 4.5, rating: 4.1 },
        { id: 2, title: "Desk", brand: "Oakline", category: "furniture", price: 199, rating: 4.8 },
        { id: 3, title: "Cereal", brand: "Grainy", category: "groceries", price: 6.9, rating: 3.9 },
      ],
      [],
    );

    const downloadControls = useMemo(
      () => ({
        fileName: "rows_payload",
        format: "xlsx" as const,
        showConfigSection: true,
        // Hide built-ins — we’re showcasing custom rows payload only
        showBuiltinAll: false,
        showBuiltinSelected: false,
        // 👉 Your DownloadIconDropdown should pass `selected.rows` and `all.rows` to extras.
        extraMenuItems: [
          {
            key: "json",
            icon: "file-arrow-down",
            label: "Export JSON (uses rows payload)",
            onClick: ({ fileName, selected, all }: any) => {
              const blob = new Blob(
                [JSON.stringify({ selected, all }, null, 2)],
                { type: "application/json;charset=utf-8" },
              );
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `${fileName}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
            },
          },
          {
            key: "xlsx-from-rows",
            icon: "grid_on",
            label: "Export XLSX (convert rows → AOA)",
            onClick: async ({ fileName, format, all }: any) => {
              // assumes `all.rows` is an array of objects
              const aoa = rowsToAOA(all.rows, COLS);
              await downloadAOA(aoa, { fileName, format });
            },
          },
        ],
      }),
      [],
    );

    const snippet = `<DataTable
  dataSource={rows}
  columnSettings={COLS}
  enableRowSelection
  enableDownload
  downloadControls={{
    fileName: 'rows_payload',
    format: 'xlsx',
    showConfigSection: true,
    showBuiltinAll: false,
    showBuiltinSelected: false,
    extraMenuItems: [
      // Selected & All are passed as { rows, count }
      { key: 'json', icon: 'data_object', label: 'Export JSON (uses rows payload)', onClick: ({ fileName, selected, all }) => {/* ... */} },
      { key: 'xlsx-from-rows', icon: 'grid_on', label: 'Export XLSX (convert rows → AOA)', onClick: async ({ fileName, format, all }) => {/* ... */} },
    ]
  }}
/>`;

    return (
      <StoryWrapper
        title="Download — custom rows payload"
        subTitle="Custom menu items receive rows (objects), not AOA—great for JSON pipelines or bespoke exporters."
      >
        <div style={{ marginTop: 0 }}>
          <Guide
            emoji="🧾"
            title="Rows payload for custom exporters"
            subtitle="Use objects for JSON pipelines; convert to AOA on demand."
            sections={[
              {
                heading: "What this shows",
                bullets: [
                  "Built-in items are hidden; we only use <b>custom</b> actions.",
                  "Custom handlers receive <code>{ selected: { rows, count }, all: { rows, count } }</code> payloads.",
                ],
              },
              {
                heading: "Why rows?",
                body:
                  "Object rows are easier to feed into JSON exporters or services that expect key/value records. If you still need sheets, convert rows → AOA on the fly.",
              },
            ]}
          />
        </div>

        <Title>Products</Title>
        <DataTable
          dataSource={rows}
          columnSettings={COLS}
          enableRowSelection
          enableDownload
          downloadControls={downloadControls}
        />

        <Guide
          emoji="📄"
          title="Usage snippet"
          subtitle="Custom extras receiving { rows, count }."
          sections={[{ heading: "Code", code: snippet }]}
        />
      </StoryWrapper>
    );
  },
};

/* =============================================================================
   5) SERVER-SIDE DOWNLOAD — one custom item (no separator)
============================================================================= */
const fetchProductsAdvanced = async (params: any) => {
  const { pageIndex, pageSize, sorting = [], columnFilters = [], globalFilter = "" } = params;
  const s = sorting?.[0];
  const needAggregate = (columnFilters?.length ?? 0) > 0;

  if (needAggregate) {
    const { data } = await axios.get("https://dummyjson.com/products", {
      params: { limit: 0, select: "id,title,brand,category,price,rating" },
    });
    let rows = Array.isArray(data?.products) ? data.products : [];

    const q = (globalFilter ?? "").toLowerCase();
    if (q) {
      rows = rows.filter(
        (r: any) =>
          String(r.title).toLowerCase().includes(q) ||
          String(r.brand).toLowerCase().includes(q) ||
          String(r.category).toLowerCase().includes(q),
      );
    }
    if (s?.id) {
      const dir = s.desc ? -1 : 1;
      rows = rows.sort((a: any, b: any) => {
        const va = a[s.id], vb = b[s.id];
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
    const total = rows.length;
    const start = pageIndex * pageSize;
    const page = rows.slice(start, start + pageSize);
    return { rows: page, total };
  }

  const qs: Record<string, string | number> = {
    q: globalFilter ?? "",
    limit: pageSize,
    skip: pageIndex * pageSize,
  };
  if (s?.id) {
    (qs as any).sortBy = s.id;
    (qs as any).order = s.desc ? "desc" : "asc";
  }
  const { data } = await axios.get("https://dummyjson.com/products/search", { params: qs });
  return { rows: data.products ?? [], total: data.total ?? 0 };
};

export const ServerSideDownload = {
  name: "Server-side Download (custom)",
  render: () => {
    const downloadControls = useMemo(
      () => ({
        fileName: "all_products",
        format: "xlsx" as const,
        showConfigSection: true,
        showBuiltinAll: false,
        showBuiltinSelected: false,
        extraMenuItems: [
          {
            key: "server-all",
            icon: "cloud_download",
            label: "Download ALL from server",
            onClick: async ({ fileName, format }: { fileName: string; format: "xlsx" | "csv" }) => {
              const { data } = await axios.get("https://dummyjson.com/products", {
                params: { limit: 0, select: "id,title,brand,category,price,rating" },
              });
              const rows = Array.isArray(data?.products) ? data.products : [];
              const aoa = toAOAFromRows(rows, COLS);
              await downloadAOA(aoa, { fileName, format });
            },
          },
        ],
      }),
      [],
    );

    const tableSnippet = useMemo(
      () => `<DataTable
  serverMode
  server={{ fetcher: fetchProductsAdvanced, debounceMs: 350 }}
  dataSource={[]}
  columnSettings={COLS}
  enableDownload
  downloadControls={{
    fileName: 'all_products',
    format: 'xlsx',
    showConfigSection: true,
    showBuiltinAll: false,
    showBuiltinSelected: false,
    extraMenuItems: [
      { key: 'server-all', icon: 'cloud_download', label: 'Download ALL from server', onClick: async ({ fileName, format }) => {/* fetch & export */} }
    ]
  }}
/>`,
      [],
    );

    return (
      <StoryWrapper
        title="Server-side Download"
        subTitle="Export via a custom menu action that fetches the full dataset from the API."
      >
        <div style={{ marginTop: 0 }}>
          <Guide
            emoji="☁️"
            title="Custom server exports"
            subtitle="Fetch exactly what you need from your API."
            sections={[
              {
                heading: "What this shows",
                bullets: [
                  "The table runs in <code>serverMode</code> and fetches pages on demand.",
                  "Built-in downloads are hidden; one custom menu item fetches the <i>entire dataset</i> from the API.",
                ],
              },
              {
                heading: "Why custom?",
                body:
                  "Server datasets can be very large; fetching exactly what you need keeps exports fast and memory-friendly.",
              },
            ]}
          />
        </div>

        <Title>Products (remote)</Title>
        <DataTable
          serverMode
          server={{ fetcher: fetchProductsAdvanced, debounceMs: 350 }}
          dataSource={[]} // ignored in serverMode
          columnSettings={COLS}
          enableDownload
          downloadControls={downloadControls}
        />

        <Guide
          emoji="📄"
          title="Usage snippet"
          subtitle="One custom action, no separators."
          sections={[{ heading: "Code", code: tableSnippet }]}
        />
      </StoryWrapper>
    );
  },
};
