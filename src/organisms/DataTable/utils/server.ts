type SpyRow = {
  id: number;
  title: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
};

function normalizeFilterValue(input: any): string {
  if (input == null) return "";
  if (Array.isArray(input)) return normalizeFilterValue(input[0]);
  if (typeof input === "object") return String(input.value ?? "").trim();
  return String(input).trim();
}

/** Returns a spy fetcher that produces rows shaped by incoming params */
export function makeDeterministicServerFetcher() {
  return vi.fn(async (params: any) => {
    const {
      pageIndex = 0,
      pageSize = 10,
      sorting = [],
      columnFilters = [],
      globalFilter = "",
    } = params ?? {};

    // figure out category filter (dropdown may pass {text,value})
    const cat = normalizeFilterValue(
      columnFilters.find((f: any) => f.id === "category")?.value,
    );

    // generate a big enough pool, apply global/category filters and sort
    let pool: SpyRow[] = Array.from({ length: 200 }, (_, i) => ({
      id: i + 1,
      title: `Item ${i + 1}${globalFilter ? " " + globalFilter : ""}`,
      brand: `Brand ${(i % 5) + 1}`,
      category: cat || (i % 2 ? "furniture" : "groceries"), // default mix
      price: 10 + (i % 50),
      rating: (i % 5) + 1,
    }));

    if (cat) pool = pool.filter((r) => r.category === cat);
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      pool = pool.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.brand.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q),
      );
    }

    const s = sorting?.[0];
    if (s?.id) {
      const dir = s.desc ? -1 : 1;
      pool = [...pool].sort((a, b) => {
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

    const total = pool.length;
    const start = pageIndex * pageSize;
    const rows = pool.slice(start, start + pageSize);

    return { rows, total };
  });
}
