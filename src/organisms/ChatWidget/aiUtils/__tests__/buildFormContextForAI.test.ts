// tests/buildFormContextForAI.test.ts
import { describe, it, expect } from "vitest";
// 🔧 adjust path as needed:
import { buildFormContextForAI } from "../buildFormContextForAI";

// replicate tinyHash to compute expected shapeSig where we want exactness
function tinyHash(s: string) {
  let h = (2166136261 >>> 0);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
function deriveExpectedShapeSig(opts: {
  module?: string;
  screen?: string;
  fs?: any[] | undefined;
  cols?: any[] | undefined;
}) {
  const { module, screen, fs, cols } = opts;
  const fieldNames = Array.isArray(fs)
    ? fs.map((f: any) => f?.name ?? "").join("|")
    : "";
  const colKeys = Array.isArray(cols)
    ? cols
        .map(
          (c: any) =>
            c?.column ??
            c?.field ??
            c?.accessorKey ??
            c?.accessor ??
            c?.dataIndex ??
            c?.key ??
            c?.id ??
            c?.name ??
            "",
        )
        .join("|")
    : "";
  return tinyHash([module || "", screen || "", fieldNames, colKeys].join("~"));
}

describe("buildFormContextForAI — serialization", () => {
  it("converts leaf fields and extracts validationSig; maps select→dropdown", () => {
    const ctx = buildFormContextForAI({
      currentModule: "EIF",
      currentScreen: "General Details",
      description: "Basic form",
      values: { name: "x" },
      fieldSettings: [
        {
          header: "General Details",
          fields: [
            { name: "name", type: "text", label: "Name", validation: "z.string().min(2)" },
            { name: "email", type: "text", label: "Email", validation: (z: any) => z.string().email() },
          ],
        },
        {
          header: "Tabbed",
          tabs: [
            {
              title: "A",
              fields: [
                { name: "code", type: "select", options: [{ value: "X" }, "Y"], validation: "z.string().min(3)" },
              ],
            },
          ],
        },
        {
          header: "Accordion",
          accordion: [
            { header: "Sec1", fields: [{ name: "uuid", type: "text", validation: "z.string().uuid()" }] },
          ],
        },
        // pass-through group with dataTable marker
        { dataTable: true, fields: [{ name: "ignored_in_ai", type: "text" }] },
      ],
    });

    // fieldSettings present
    expect(Array.isArray((ctx as any).fieldSettings)).toBe(true);

    // find leaves by name
    const flat: any[] = [];
    const walk = (arr?: any[]) => {
      (arr || []).forEach((n) => {
        if (!n || typeof n !== "object") return;
        if (Array.isArray(n.fields)) walk(n.fields);
        if (Array.isArray(n.tabs)) n.tabs.forEach((t: any) => walk(t.fields));
        if (Array.isArray(n.accordion)) n.accordion.forEach((a: any) => walk(a.fields));
        if (typeof n.name === "string") flat.push(n);
      });
    };
    walk((ctx as any).fieldSettings);

    // leaves we care about
    const name = flat.find(f => f.name === "name");
    const email = flat.find(f => f.name === "email");
    const code = flat.find(f => f.name === "code");
    const uuid = flat.find(f => f.name === "uuid");

    expect(name?.type).toBe("text");
    expect(name?.validationSig).toBe("z.string().min(2)");

    expect(email?.validationSig && typeof email.validationSig === "string").toBe(true);
    expect(String(email.validationSig)).toMatch(/function|=>/); // stringified function

    expect(code?.type).toBe("dropdown"); // select → dropdown
    expect(code?.validationSig).toBe("z.string().min(3)");
    expect(Array.isArray(code?.options)).toBe(true);
    // buildFormContextForAI preserves raw options; normalization happens downstream in workdesk.js
    expect(code?.options?.[0]).toEqual({ value: "X" });
    expect(code?.options?.[1]).toEqual("Y");

    expect(uuid?.validationSig).toBe("z.string().uuid()");

    // dataTable passthrough on the group (not a leaf)
    const hasDataTableGroup = (ctx as any).fieldSettings.some((n: any) => n?.dataTable === true);
    expect(hasDataTableGroup).toBe(true);
  });

  it("omits fieldSettings when empty/undefined", () => {
    const a = buildFormContextForAI({ values: {}, fieldSettings: [] });
    expect((a as any).fieldSettings).toBeUndefined();

    const b = buildFormContextForAI({ values: {} });
    expect((b as any).fieldSettings).toBeUndefined();
  });

  it("passes through columnSettings unchanged", () => {
    const cols = [
      { accessorKey: "trn", header: "TRN" },
      { key: "amount", label: "Amount" },
      { name: "status", title: "Status" },
    ];
    const ctx = buildFormContextForAI({ values: {}, columnSettings: cols });
    expect((ctx as any).columnSettings).toEqual(cols);
  });

  it("sets both values and data regardless of which key you pass", () => {
    const V = { a: 1 };
    const out1: any = buildFormContextForAI({ values: V });
    expect(out1.values).toBe(V);
    expect(out1.data).toBe(V);

    const D = { b: 2 };
    const out2: any = buildFormContextForAI({ data: D });
    expect(out2.values).toBe(D);
    expect(out2.data).toBe(D);

    // When both provided: values wins for `values`, but `data` remains the explicitly provided `data`
    const out3: any = buildFormContextForAI({ values: V, data: D });
    expect(out3.values).toBe(V);
    expect(out3.data).toBe(D);
  });
});

describe("buildFormContextForAI — shapeSig", () => {
  it("is deterministic and ignores raw values (only module/screen/names/colKeys matter)", () => {
    const cols = [{ accessorKey: "trn" }, { key: "amount" }];
    const fsTopLevel = [
      { name: "alpha", type: "text", validation: "z.string().min(1)" }, // top-level leaf so it counts in fieldNames
    ];

    const base = buildFormContextForAI({
      currentModule: "EIF",
      currentScreen: "General Details",
      values: { alpha: "x" },
      fieldSettings: fsTopLevel,
      columnSettings: cols,
    }) as any;

    const againDifferentValues = buildFormContextForAI({
      currentModule: "EIF",
      currentScreen: "General Details",
      values: { alpha: "different" }, // should NOT impact shapeSig
      fieldSettings: fsTopLevel,
      columnSettings: cols,
    }) as any;

    expect(base.shapeSig).toBe(againDifferentValues.shapeSig);

    // compute expected explicitly using same inputs the impl uses
    const expected = deriveExpectedShapeSig({
      module: "EIF",
      screen: "General Details",
      fs: fsTopLevel.map(f => ({ ...f, type: f.type, validationSig: typeof f.validation === "string" ? f.validation : String(f.validation) })), // emulate serialize leaf projection
      cols,
    });
    expect(base.shapeSig).toBe(expected);
  });

  it("changes when module, screen, field names, or column keys change", () => {
    const fsA = [{ name: "alpha", type: "text" }];
    const fsB = [{ name: "beta", type: "text" }];

    const c1 = buildFormContextForAI({
      currentModule: "EIF",
      currentScreen: "General Details",
      fieldSettings: fsA,
      columnSettings: [{ accessorKey: "trn" }],
    }) as any;

    const c2 = buildFormContextForAI({
      currentModule: "EIF",
      currentScreen: "Other Screen", // screen changed
      fieldSettings: fsA,
      columnSettings: [{ accessorKey: "trn" }],
    }) as any;

    const c3 = buildFormContextForAI({
      currentModule: "LC", // module changed
      currentScreen: "General Details",
      fieldSettings: fsA,
      columnSettings: [{ accessorKey: "trn" }],
    }) as any;

    const c4 = buildFormContextForAI({
      currentModule: "EIF",
      currentScreen: "General Details",
      fieldSettings: fsB, // field name changed (top-level leaf)
      columnSettings: [{ accessorKey: "trn" }],
    }) as any;

    const c5 = buildFormContextForAI({
      currentModule: "EIF",
      currentScreen: "General Details",
      fieldSettings: fsA,
      // switch key precedence from accessorKey→key
      columnSettings: [{ key: "txn" }],
    }) as any;

    expect(c1.shapeSig).not.toBe(c2.shapeSig);
    expect(c1.shapeSig).not.toBe(c3.shapeSig);
    expect(c1.shapeSig).not.toBe(c4.shapeSig);
    expect(c1.shapeSig).not.toBe(c5.shapeSig);
  });

  it("includes only top-level leaf names in fieldNames part (nested groups don't count toward shapeSig)", () => {
    const fsNestedOnly = [
      { header: "Group", fields: [{ name: "alpha" }] },
      { header: "Tabs", tabs: [{ title: "A", fields: [{ name: "beta" }] }] },
    ];
    const withTopLevelLeaf = [
      ...fsNestedOnly,
      { name: "topLeaf", type: "text" },
    ];

    const a = buildFormContextForAI({
      currentModule: "EIF",
      currentScreen: "General",
      fieldSettings: fsNestedOnly,
      columnSettings: [{ accessorKey: "x" }],
    }) as any;

    const b = buildFormContextForAI({
      currentModule: "EIF",
      currentScreen: "General",
      fieldSettings: withTopLevelLeaf,
      columnSettings: [{ accessorKey: "x" }],
    }) as any;

    // shapeSig should differ because top-level leaf adds to fieldNames join
    expect(a.shapeSig).not.toBe(b.shapeSig);
  });
});
