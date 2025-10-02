// src/organisms/FormRenderer/utils.ts
import {
  z,
  ZodRawShape,
  ZodType,
  ZodTypeAny,
  ZodOptional,
  ZodNullable,
  ZodEffects,
} from "zod";
import type {
  SettingsItem,
  FieldGroup,
  FieldSetting,
  AccordionSection,
  DataTableSection,
} from "./interface";
import type { ErrorSummaryItem } from "./components/ErrorSummary";
// ------------------------------------------------------------------
// helpers & schema builder (including proper flattening through tabs)
// ------------------------------------------------------------------

/**
 * Flattens a nested SettingsItem[] into an array of FieldSetting
 * (you should already have this implemented; just ensure it returns
 * every FieldSetting in the tree, regardless of groups/tabs).
 */
export function flattenForSchema(items?: SettingsItem[]): FieldSetting[] {
  const out: FieldSetting[] = [];

  function visit(arr?: SettingsItem[]) {
    if (!Array.isArray(arr)) return; // ← guard

    for (const it of arr) {
      if (!it) continue;

      // 1) Skip DataTable wrapper; callers decide when to handle its fields
      if ("dataTable" in it && (it as any).dataTable) {
        continue;
      }

      // 2) Standard groups
      if ("fields" in it && Array.isArray((it as any).fields)) {
        visit((it as any).fields);
        continue;
      }

      // 3) Tabs
      if ("tabs" in it && Array.isArray((it as any).tabs)) {
        (it as any).tabs.forEach((tab: any) => {
          if (tab && Array.isArray(tab.fields)) visit(tab.fields); // ← guard
        });
        continue;
      }

      // 4) Accordion
      if ("accordion" in it && Array.isArray((it as any).accordion)) {
        (it as any).accordion.forEach((sec: any) => {
          if (sec && Array.isArray(sec.fields)) visit(sec.fields); // ← guard
        });
        continue;
      }

      // 5) Leaf field
      out.push(it as FieldSetting);
    }
  }

  visit(items);
  return out;
}

/**
 * Build a Zod schema for the entire form, feeding each field's validation
 * function both z (the zod namespace) and the full rowData for conditional logic.
 */
export function buildSchema(
  fields: FieldSetting[],
  rowData?: Record<string, any>,
): ZodTypeAny {
  type TreeNode = Record<string, any> & { __self?: ZodTypeAny };
  const tree: TreeNode = {};

  // 1) Build a nested tree that can hold BOTH a parent schema and children
  for (const fs of fields) {
    const key = fs.name;
    if (!key) continue;

    const schema = fs.validation ? fs.validation(z as any, rowData) : z.any();
    const parts = key.split(".");
    let cur: TreeNode = tree;

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const isLeaf = i === parts.length - 1;

      if (isLeaf) {
        const existing = cur[p];

        if (
          existing &&
          typeof existing === "object" &&
          !(existing instanceof ZodType)
        ) {
          // Already a container → store parent schema as __self for later merge
          (existing as TreeNode).__self = schema;
        } else {
          // Either unset or previously a plain schema (parent-only); overwrite is fine
          cur[p] = schema;
        }
      } else {
        const existing = cur[p];

        if (existing instanceof ZodType) {
          // Previously a schema at the parent → convert to container and keep that schema as __self
          cur[p] = { __self: existing } as TreeNode;
        } else if (!existing) {
          cur[p] = {} as TreeNode;
        }

        cur = cur[p] as TreeNode;
      }
    }
  }

  // 2) Convert the tree into Zod types, merging __self when present
  const toZod = (node: any): ZodTypeAny => {
    if (node instanceof ZodType) return node; // plain schema leaf

    const entries = Object.entries(node).filter(([k]) => k !== "__self");
    const keys = entries.map(([k]) => k);

    // Handle arrays when all keys are numeric
    if (keys.length && keys.every((k) => /^\d+$/.test(k))) {
      const firstChild = (node as any)[keys[0]];
      return z.array(toZod(firstChild));
    }

    const shape: ZodRawShape = Object.fromEntries(
      entries.map(([k, v]) => [k, toZod(v)]),
    ) as ZodRawShape;

    let base = z.object(shape);

    // Merge or intersect any parent-level schema stored in __self
    const self: ZodTypeAny | undefined = (node as any).__self;
    if (self) {
      const isSelfObj = (self as any)?._def?.typeName === "ZodObject";
      const isBaseObj = (base as any)?._def?.typeName === "ZodObject";
      base =
        isSelfObj && isBaseObj ? (base as any).merge(self) : base.and(self);
    }

    return base;
  };

  return toZod(tree);
}

/**
 * Given any ZodType, unwrap Optionals, Nullables, and Effects (refines)
 * down to the core schema.
 */
function unwrapSchema(schema: ZodTypeAny): ZodTypeAny {
  // Optional or Nullable
  if (schema instanceof ZodOptional || schema instanceof ZodNullable) {
    // @ts-ignore
    return unwrapSchema(schema._def.innerType);
  }
  // Effects (e.g. from refine or nonempty)
  if (schema instanceof ZodEffects) {
    // @ts-ignore
    return unwrapSchema(schema._def.schema);
  }
  return schema;
}

/**
 * Return true if the given Zod schema would reject `undefined`.
 * Honors your `.required()` extension via the `_required` flag,
 * and also catches built-in `min` / `nonempty` checks.
 */
export function isZodRequired(schema: ZodTypeAny): boolean {
  const core = unwrapSchema(schema);

  // 1) If our custom `.required()` flag is set, bingo:
  if ((core as any)._required) {
    return true;
  }

  // 2) Otherwise, look for built-in checks (min, nonempty):
  const checks = (core as any)?._def?.checks;
  if (Array.isArray(checks)) {
    if (checks.some((c: any) => ["min", "nonempty"].includes(c.code))) {
      return true;
    }
  }

  // 3) If neither, it’s optional:
  return false;
}

export function resolveDisabled(
  disabledProp: boolean | ((data?: Record<string, any>) => boolean) = false,
  data: Record<string, any>,
  globalDisabled: boolean,
): boolean {
  if (globalDisabled) return true;
  if (typeof disabledProp === "function") {
    return disabledProp(data);
  }
  return disabledProp;
}

// Utility to get a deep value. If the path doesn't have dots, it directly returns the value.
export const getDeepValue = <T = unknown>(
  obj: any,
  path?: string,
): T | undefined => {
  if (obj == null || path == null || path === "") return undefined;

  if (!path.includes(".")) {
    return obj ? (obj as any)[path] : undefined;
  }

  return path.split(".").reduce<any>((acc, key) => {
    if (acc == null) return undefined;

    const arrayMatch = key.match(/^\[(\d+)\]$/);
    if (arrayMatch) {
      const index = parseInt(arrayMatch[1], 10);
      return Array.isArray(acc) ? acc[index] : undefined;
    }

    return (acc as any)[key];
  }, obj) as T | undefined;
};

export const setDeepValue = (obj: any, path?: string, value?: unknown): any => {
  // No-op when path is undefined/empty
  if (path == null || path === "") return obj;

  const segments = path.split(".").filter(Boolean);
  const [first, ...rest] = segments;

  // Case A: bracket-only segment -> "[3]"
  const bracketOnly = first.match(/^\[(\d+)\]$/);
  if (bracketOnly) {
    const idx = parseInt(bracketOnly[1], 10);
    const arr = Array.isArray(obj) ? [...obj] : [];
    arr[idx] = rest.length
      ? setDeepValue(arr[idx] ?? {}, rest.join("."), value)
      : value;
    return arr;
  }

  // Case B: prop[index] -> "items[3]"
  const propIndex = first.match(/^(.+)\[(\d+)\]$/);
  if (propIndex) {
    const [, prop, idxStr] = propIndex;
    const idx = parseInt(idxStr, 10);
    const currProp = obj?.[prop];
    const arr = Array.isArray(currProp) ? [...currProp] : [];
    arr[idx] = rest.length
      ? setDeepValue(arr[idx] ?? {}, rest.join("."), value)
      : value;
    return { ...(obj ?? {}), [prop]: arr };
  }

  // Case C: bare numeric -> "0"
  if (/^\d+$/.test(first)) {
    const idx = Number(first);
    const arr = Array.isArray(obj) ? [...obj] : [];
    arr[idx] = rest.length
      ? setDeepValue(arr[idx] ?? {}, rest.join("."), value)
      : value;
    return arr;
  }

  // Case D: normal object key
  if (!rest.length) {
    return { ...(obj ?? {}), [first]: value };
  }

  const next = obj?.[first];
  const seed = Array.isArray(next)
    ? [...next]
    : next != null && typeof next === "object"
      ? { ...next }
      : {};
  return {
    ...(obj ?? {}),
    [first]: setDeepValue(seed, rest.join("."), value),
  };
};

export const hash = (v: unknown) => {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

/** ───────── small util: debounce ───────── */
export const debounce = <F extends (...args: any[]) => void>(
  fn: F,
  ms = 150,
) => {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

// Safe CSS selector escaper (fallback if window.CSS?.escape is unavailable)
export const cssEscape = (s: string) => {
  try {
    // @ts-ignore
    return (window as any)?.CSS?.escape
      ? (window as any).CSS.escape(s)
      : s.replace(/["\\#.:>+~*^$[\]()'=]/g, "\\$&");
  } catch {
    return s.replace(/["\\#.:>+~*^$[\]()'=]/g, "\\$&");
  }
};

// Centering helpers — place right below `cssEscape`
// ───────── scrolling helpers ─────────
export const getScrollableAncestor = (el: HTMLElement): HTMLElement => {
  let p: HTMLElement | null = el.parentElement;
  while (p) {
    const { overflowY } = window.getComputedStyle(p);
    const isScrollable =
      (overflowY === "auto" || overflowY === "scroll") &&
      p.scrollHeight > p.clientHeight;
    if (isScrollable) return p;
    p = p.parentElement;
  }
  const se = document.scrollingElement;
  return se && se instanceof HTMLElement
    ? se
    : (document.documentElement as HTMLElement);
};

export const scrollToCenter = (el: HTMLElement, container?: HTMLElement) => {
  const c = container ?? getScrollableAncestor(el);
  const cRect = c.getBoundingClientRect();
  const eRect = el.getBoundingClientRect();

  const current = c.scrollTop;
  const delta = eRect.top - cRect.top - (c.clientHeight - eRect.height) / 2;

  // keep in bounds
  const targetTop = Math.max(
    0,
    Math.min(current + delta, c.scrollHeight - c.clientHeight),
  );
  c.scrollTo({ top: targetTop, behavior: "smooth" });
};

export const waitForStableLayout = (
  container: HTMLElement,
  stableFrames = 3,
  maxFrames = 90,
) =>
  new Promise<void>((resolve) => {
    let last = -1;
    let stable = 0;
    let frames = 0;
    const tick = () => {
      frames++;
      const h = container.scrollHeight;
      if (Math.abs(h - last) < 2) {
        stable++;
      } else {
        stable = 0;
        last = h;
      }
      if (stable >= stableFrames || frames >= maxFrames) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });

export const FOCUSABLE_SEL =
  'input, textarea, select, button, [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

type Hidden = boolean | ((v: any) => boolean);
type Tab = { title: string; fields: SettingsItem[]; hidden?: Hidden };

// ───────── Type guards ─────────
export const isFieldGroup = (item: SettingsItem): item is FieldGroup =>
  ("fields" in item && Array.isArray(item.fields)) ||
  ("tabs" in item && Array.isArray(item.tabs)) ||
  ("accordion" in item && Array.isArray(item.accordion));
export const hasAccordion = (
  item: SettingsItem,
): item is FieldGroup & { accordion: AccordionSection[] } =>
  isFieldGroup(item) &&
  Array.isArray(item.accordion) &&
  item.accordion.length > 0;
export const hasTabs = (
  item: SettingsItem,
): item is FieldGroup & { tabs: Tab[] } =>
  Array.isArray((item as any).tabs) && (item as any).tabs.length > 0;
export const hasFields = (item: SettingsItem): item is FieldGroup =>
  isFieldGroup(item) && Array.isArray(item.fields) && item.fields.length > 0;
export const hasDataTable = (
  item: SettingsItem,
): item is { dataTable: DataTableSection } => Boolean((item as any).dataTable);

export const toLeafFieldSettings = (items: SettingsItem[]) => {
  const flat = (flattenForSchema(items) as any[]).filter(
    (fs: any) => typeof fs?.name === "string",
  ) as Array<FieldSetting & { name: string }>;
  return flat.filter(
    (fs) =>
      !flat.some(
        (other) => other !== fs && other.name.startsWith(fs.name + "."),
      ),
  );
};

export const isItemHidden = (item: SettingsItem, values: any): boolean => {
  const anyIt: any = item;
  // DataTable `hidden` lives under dataTable
  if (anyIt?.dataTable) {
    const h = anyIt.dataTable.hidden;
    return typeof h === "function" ? !!h(values) : !!h;
  }
  // Groups/fields can have `hidden` directly
  const h = anyIt.hidden;
  return typeof h === "function" ? !!h(values) : !!h;
};

export function filterVisibleSettings(
  items?: SettingsItem[], // ← make optional
  values?: any,
): SettingsItem[] {
  if (!Array.isArray(items)) return []; // ← guard top-level

  const out: SettingsItem[] = [];

  for (const it of items) {
    if (!it) continue;

    // Respect per-item hidden
    if (isItemHidden(it, values)) continue;

    // ── DataTable ───────────────────────────────────────────────────────────
    if (hasDataTable(it)) {
      const dt = (it as any).dataTable as DataTableSection | undefined;
      if (!dt) continue; // misconfigured, skip safely

      const dtFields = Array.isArray(dt.fields) ? dt.fields : []; // guard
      out.push({
        ...(it as any),
        dataTable: {
          ...dt,
          fields: filterVisibleSettings(dtFields, values),
        },
      } as any);
      continue;
    }

    // ── Group with fields ──────────────────────────────────────────────────
    if (hasFields(it)) {
      const grp = it as FieldGroup;
      const grpFields = Array.isArray((grp as any).fields)
        ? (grp as any).fields
        : [];
      out.push({ ...grp, fields: filterVisibleSettings(grpFields, values) });
      continue;
    }

    // ── Accordion ──────────────────────────────────────────────────────────
    if (hasAccordion(it)) {
      const grp = it as FieldGroup & { accordion?: AccordionSection[] };
      const acc = Array.isArray(grp.accordion) ? grp.accordion : [];
      const visSecs = acc
        .filter((sec) => {
          const h: any = (sec as any)?.hidden;
          return typeof h === "function" ? !h(values) : !h;
        })
        .map((sec) => {
          const secFields = Array.isArray(sec?.fields) ? sec.fields : [];
          return { ...sec, fields: filterVisibleSettings(secFields, values) };
        });
      if (visSecs.length) out.push({ ...grp, accordion: visSecs } as any);
      continue;
    }

    // ── Tabs ───────────────────────────────────────────────────────────────
    if (hasTabs(it)) {
      const grp = it as FieldGroup & { tabs?: Tab[] };
      const tabs = Array.isArray(grp.tabs) ? grp.tabs : [];
      const visTabs = tabs
        .filter((tab) => {
          const h: any = (tab as any)?.hidden;
          return typeof h === "function" ? !h(values) : !h;
        })
        .map((tab) => {
          const tabFields = Array.isArray(tab?.fields) ? tab.fields : [];
          return { ...tab, fields: filterVisibleSettings(tabFields, values) };
        });
      if (visTabs.length) out.push({ ...grp, tabs: visTabs } as any);
      continue;
    }

    // ── Leaf field ─────────────────────────────────────────────────────────
    out.push(it);
  }

  return out;
}

export function containsFieldPath(
  items: SettingsItem[],
  fullPath: string,
): boolean {
  const flat = (flattenForSchema(items) as any[])
    .filter((fs: any) => typeof fs?.name === "string")
    .map((fs: any) => fs.name as string);

  // match exact or “endsWith” to cover table prefixes like table.0.foo.bar
  return flat.some((n) => fullPath === n || fullPath.endsWith(`.${n}`));
}

export function firstTabIndexContainingPath(
  tabs: { title: string; fields: SettingsItem[] }[],
  fullPath: string,
): number {
  for (let i = 0; i < tabs.length; i++) {
    if (containsFieldPath(tabs[i].fields, fullPath)) return i;
  }
  return -1;
}

export function collectAbsoluteLeafFields(
  items?: SettingsItem[], // ← make optional
  basePath = "",
): Array<{ name: string; fs: FieldSetting & { name: string } }> {
  const out: Array<{ name: string; fs: FieldSetting & { name: string } }> = [];
  const prefix = (p: string) => (basePath ? `${basePath}.${p}` : p);

  if (!Array.isArray(items)) return out; // ← guard

  for (const it of items) {
    if (!it) continue;

    // DataTable wrapper
    if (hasDataTable(it)) {
      const dt = (it as any).dataTable as DataTableSection | undefined;
      const tableKey = dt?.config?.dataSource;
      if (!tableKey) {
        // misconfigured DT: can't compute absolute names; skip safely
        continue;
      }

      const dtFields = Array.isArray(dt?.fields) ? dt!.fields : []; // ← guard
      const leafs = toLeafFieldSettings(dtFields);

      // DRAFT inputs
      for (const lf of leafs) {
        const nm = (lf as any)?.name;
        if (typeof nm === "string" && nm.trim()) {
          out.push({ name: `${prefix(tableKey)}.${nm}`, fs: lf as any });
        }
      }

      // Nested content under the table rows
      out.push(...collectAbsoluteLeafFields(dtFields as any, prefix(tableKey)));
      continue;
    }

    // Standard group
    if (hasFields(it)) {
      const grp = (it as any).fields;
      out.push(
        ...collectAbsoluteLeafFields(Array.isArray(grp) ? grp : [], basePath),
      );
      continue;
    }

    // Accordion
    if (hasAccordion(it)) {
      const acc = (it as any).accordion;
      if (Array.isArray(acc)) {
        for (const sec of acc) {
          const secFields = Array.isArray(sec?.fields) ? sec.fields : [];
          out.push(...collectAbsoluteLeafFields(secFields, basePath));
        }
      }
      continue;
    }

    // Tabs
    if (hasTabs(it)) {
      const tabs = (it as any).tabs;
      if (Array.isArray(tabs)) {
        for (const tab of tabs) {
          const tabFields = Array.isArray(tab?.fields) ? tab.fields : [];
          out.push(...collectAbsoluteLeafFields(tabFields, basePath));
        }
      }
      continue;
    }

    // Leaf field
    const fs = it as Partial<FieldSetting> & { name?: string };
    if (typeof fs?.name === "string" && fs.name.trim()) {
      out.push({
        name: prefix(fs.name),
        fs: fs as FieldSetting & { name: string },
      });
    }
    // else: unnamed leaf → skip here (render path will surface the error)
  }

  return out;
}

// ───────── Helpers ─────────
export function prefixItems(
  items: SettingsItem[],
  path: string,
): SettingsItem[] {
  const cleanPath = path.replace(/\.(?:null|undefined)$/, "");
  return items.map((item) => {
    if ("dataTable" in item && item.dataTable) {
      const dt = item.dataTable;
      return {
        ...item,
        dataTable: {
          ...dt,
          config: {
            ...dt.config,
            dataSource: `${cleanPath}.${dt.config.dataSource}`,
          },
          fields: dt.fields,
        },
      };
    }
    if ("fields" in item && Array.isArray(item.fields)) {
      return {
        ...(item as FieldGroup),
        fields: prefixItems(item.fields, cleanPath),
      };
    }
    if ("accordion" in item && Array.isArray((item as any).accordion)) {
      const grp = item as FieldGroup & { accordion: AccordionSection[] };
      return {
        ...grp,
        accordion: grp.accordion.map((sec) => ({
          ...sec,
          fields: prefixItems(sec.fields, cleanPath),
        })),
      };
    }
    if ("tabs" in item && Array.isArray((item as any).tabs)) {
      const grp = item as FieldGroup & {
        tabs: { title: string; fields: SettingsItem[] }[];
      };
      return {
        ...grp,
        tabs: grp.tabs.map((tab) => ({
          ...tab,
          fields: prefixItems(tab.fields, cleanPath),
        })),
      };
    }
    const fs = item as FieldSetting;
    return { ...fs, name: `${cleanPath}.${fs.name}` };
  });
}

export const escapeRegExp = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function shiftNestedTableKeys(
  map: Record<string, any[]>,
  baseKey: string,
  startIndex: number,
  delta: number,
) {
  const next: Record<string, any[]> = { ...map };
  const re = new RegExp(`^${escapeRegExp(baseKey)}\\.(\\d+)\\.`);
  const keys = Object.keys(next).sort((a, b) =>
    delta > 0 ? b.localeCompare(a) : a.localeCompare(b),
  );
  for (const k of keys) {
    const m = k.match(re);
    if (!m) continue;
    if (Number(m[1]) < startIndex) continue;
    const idx = Number(m[1]);
    const newKey = k.replace(re, `${baseKey}.${idx + delta}.`);
    next[newKey] = next[k];
    delete next[k];
  }
  return next;
}

export function dropNestedKeysForIndex(
  map: Record<string, any[]>,
  baseKey: string,
  index: number,
) {
  const next: Record<string, any[]> = { ...map };
  const re = new RegExp(`^${escapeRegExp(baseKey)}\\.${index}\\.`);
  Object.keys(next).forEach((k) => {
    if (re.test(k)) delete next[k];
  });
  return next;
}

export const isBooleanControl = (fs: any) =>
  fs.type === "switch" || fs.type === "checkbox" || fs.type === "radio";

export function normalizeByType(fs: FieldSetting & { name: string }, v: any) {
  if (fs.type === "date" && v instanceof Date) return v.toISOString();
  if (fs.type === "number") {
    if (v === "" || v == null) return undefined;
    if (typeof v === "string") return v.trim() === "" ? undefined : Number(v);
  }
  return v;
}

export function coerceChangeValue(fs: FieldSetting & { name: string }, v: any) {
  if (v && typeof v === "object" && "target" in v) {
    const t: any = (v as any).target;
    if (isBooleanControl(fs)) return !!t?.checked;
    if (t?.value !== undefined) return t.value; // preserve '' for clear
    return undefined;
  }
  if (fs.type === "dropdown") {
    if (Array.isArray(v))
      return v.map((opt) =>
        opt && typeof opt === "object" && "value" in opt
          ? (opt as any).value
          : opt,
      );
    if (v && typeof v === "object" && "value" in v) return (v as any).value;
    return v ?? "";
  }
  if (fs.type === "date" && v instanceof Date) return v;
  return v;
}

// For reseed when value is missing in row
export function emptyFor(fs: FieldSetting & { name: string }) {
  if (isBooleanControl(fs)) return false;
  if (fs.type === "number") return "";
  return "";
}

// Discover every DataTable instance in the current form values, including nested ones.
export function collectDataTableContexts(
  values: Record<string, any>,
  items: SettingsItem[],
  basePath = "",
): Array<{ tableKey: string; fields: SettingsItem[] }> {
  const contexts: Array<{ tableKey: string; fields: SettingsItem[] }> = [];
  const prefix = (p: string) => (basePath ? `${basePath}.${p}` : p);

  for (const it of items) {
    const anyIt = it as any;

    if (anyIt?.dataTable?.config?.dataSource) {
      const absKey = prefix(anyIt.dataTable.config.dataSource);

      // This table instance (draft context)
      contexts.push({ tableKey: absKey, fields: anyIt.dataTable.fields });

      // Descend into each existing row to discover nested table instances
      const rows = getDeepValue(values, absKey);
      if (Array.isArray(rows)) {
        for (let i = 0; i < rows.length; i++) {
          contexts.push(
            ...collectDataTableContexts(
              values,
              anyIt.dataTable.fields,
              `${absKey}.${i}`,
            ),
          );
        }
      }
      continue;
    }

    if (Array.isArray(anyIt.fields)) {
      contexts.push(
        ...collectDataTableContexts(values, anyIt.fields, basePath),
      );
    }
    if (Array.isArray(anyIt.accordion)) {
      for (const sec of anyIt.accordion) {
        contexts.push(
          ...collectDataTableContexts(values, sec.fields, basePath),
        );
      }
    }
    if (Array.isArray(anyIt.tabs)) {
      for (const tab of anyIt.tabs) {
        contexts.push(
          ...collectDataTableContexts(values, tab.fields, basePath),
        );
      }
    }
  }

  return contexts;
}

// Replace the old toSummaryItems with this one
export const toSummaryItems = (
  errs: any,
  getValuesFn: () => any,
): ErrorSummaryItem[] => {
  const vals = getValuesFn();
  const pretty = (path: string) => {
    const leaf = (path.split(".").pop() || path)
      .replace(/[_-]/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2");
    return leaf.charAt(0).toUpperCase() + leaf.slice(1);
  };
  const showVal = (v: any): string => {
    if (v === undefined) return "—";
    if (v === null) return "null";
    if (typeof v === "string") return v === "" ? "“”" : v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    try {
      const s = JSON.stringify(v);
      return s.length > 120 ? s.slice(0, 117) + "…" : s;
    } catch {
      return String(v);
    }
  };

  const out: ErrorSummaryItem[] = [];
  const walk = (prefix: string, node: any) => {
    if (!node) return;
    if (node.message) {
      const value = prefix
        ? showVal(
            prefix.split(".").reduce((a, k) => (a ? a[k] : undefined), vals),
          )
        : "—";
      out.push({
        field: prefix,
        label: pretty(prefix),
        valueText: value,
        message: String(node.message),
      });
      return;
    }
    if (typeof node === "object") {
      Object.entries(node).forEach(([k, v]) =>
        walk(prefix ? `${prefix}.${k}` : k, v),
      );
    }
  };
  walk("", errs);
  return out;
};

/** ────────────────────────────────────────────────────────────────────────────
 * Small idle scheduler (built-in, no public API)
 * ─────────────────────────────────────────────────────────────────────────── */
export const scheduleIdle = (fn: () => void, timeout = 120) => {
  const w: any = typeof window !== "undefined" ? window : null;
  if (w?.requestIdleCallback) return w.requestIdleCallback(fn, { timeout });
  return setTimeout(fn, timeout);
};
export const cancelIdle = (h: any) => {
  const w: any = typeof window !== "undefined" ? window : null;
  if (w?.cancelIdleCallback) w.cancelIdleCallback(h);
  else clearTimeout(h);
};
