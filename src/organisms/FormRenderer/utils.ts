// src/organisms/FormRenderer/utils.ts
import { z, ZodRawShape, ZodType, ZodTypeAny, ZodOptional, ZodNullable, ZodEffects } from 'zod';
import type { FieldSetting } from './interface';

// ------------------------------------------------------------------
// helpers & schema builder (including proper flattening through tabs)
// ------------------------------------------------------------------

/**
 * Flattens a nested SettingsItem[] into an array of FieldSetting
 * (you should already have this implemented; just ensure it returns
 * every FieldSetting in the tree, regardless of groups/tabs).
 */
export function flattenForSchema(
  items: import('./interface').SettingsItem[]
): FieldSetting[] {
  const out: FieldSetting[] = [];

  function visit(arr: import('./interface').SettingsItem[]) {
    for (const it of arr) {
      // 1) Skip DataTable wrapper; callers decide when to handle its fields
      if ('dataTable' in it && (it as any).dataTable) {
        continue;
      }

      // 2) Standard groups
      if ('fields' in it && Array.isArray((it as any).fields)) {
        visit((it as any).fields);
        continue;
      }

      // 3) Tabs
      if ('tabs' in it && Array.isArray((it as any).tabs)) {
        (it as any).tabs.forEach((tab: any) => visit(tab.fields));
        continue;
      }

      // 4) Accordion
      if ('accordion' in it && Array.isArray((it as any).accordion)) {
        (it as any).accordion.forEach((sec: any) => visit(sec.fields));
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
  rowData: Record<string, any>
): ZodTypeAny {
  type TreeNode = Record<string, any> & { __self?: ZodTypeAny };
  const tree: TreeNode = {};

  // 1) Build a nested tree that can hold BOTH a parent schema and children
  for (const fs of fields) {
    const key = fs.name;
    if (!key) continue;

    const schema = fs.validation ? fs.validation(z as any, rowData) : z.any();
    const parts = key.split('.');
    let cur: TreeNode = tree;

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const isLeaf = i === parts.length - 1;

      if (isLeaf) {
        const existing = cur[p];

        if (existing && typeof existing === 'object' && !(existing instanceof ZodType)) {
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

    const entries = Object.entries(node).filter(([k]) => k !== '__self');
    const keys = entries.map(([k]) => k);

    // Handle arrays when all keys are numeric
    if (keys.length && keys.every(k => /^\d+$/.test(k))) {
      const firstChild = (node as any)[keys[0]];
      return z.array(toZod(firstChild));
    }

    const shape: ZodRawShape = Object.fromEntries(
      entries.map(([k, v]) => [k, toZod(v)])
    ) as ZodRawShape;

    let base = z.object(shape);

    // Merge or intersect any parent-level schema stored in __self
    const self: ZodTypeAny | undefined = (node as any).__self;
    if (self) {
      const isSelfObj = (self as any)?._def?.typeName === 'ZodObject';
      const isBaseObj = (base as any)?._def?.typeName === 'ZodObject';
      base = (isSelfObj && isBaseObj) ? (base as any).merge(self) : base.and(self);
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
    if (checks.some((c: any) => ['min', 'nonempty'].includes(c.code))) {
      return true;
    }
  }

  // 3) If neither, it’s optional:
  return false;
}

export function resolveDisabled(
  disabledProp: boolean | ((data?: Record<string, any>) => boolean) = false,
  data: Record<string, any>,
  globalDisabled: boolean
): boolean {
  if (globalDisabled) return true;
  if (typeof disabledProp === 'function') {
    return disabledProp(data);
  }
  return disabledProp;
}

// Utility to get a deep value. If the path doesn't have dots, it directly returns the value.
export const getDeepValue = (obj: any, path: string): any => {
  if (!path.includes('.')) {
    return obj ? obj[path] : undefined
  }
  return path.split('.').reduce((acc, key) => {
    if (acc == null) return undefined
    const arrayMatch = key.match(/^\[(\d+)\]$/)
    if (arrayMatch) {
      const index = parseInt(arrayMatch[1], 10)
      return Array.isArray(acc) ? acc[index] : undefined
    }
    return acc[key]
  }, obj)
}

export const setDeepValue = (obj: any, path: string, value: unknown): any => {
  const keys = path.split('.');
  const [ first, ...rest ] = keys;

  // 1) check for "prop[index]" form
  const propIndex = first.match(/^(.+)\[(\d+)\]$/);
  if (propIndex) {
    const [, prop, idxStr] = propIndex;
    const idx = parseInt(idxStr, 10);
    const arr = Array.isArray(obj[prop]) ? [...obj[prop]] : [];
    arr[idx] = rest.length
      ? setDeepValue(arr[idx] || {}, rest.join('.'), value)
      : value;
    return { ...obj, [prop]: arr };
  }

  // 2) check for bare numeric segment: "0"
  if (!isNaN(Number(first))) {
    const idx = Number(first);
    const arr = Array.isArray(obj) ? [...obj] : [];
    arr[idx] = rest.length
      ? setDeepValue(arr[idx] || {}, rest.join('.'), value)
      : value;
    return arr;
  }

  // 3) normal object key
  if (!rest.length) {
    return { ...obj, [first]: value };
  }

  return {
    ...obj,
    [first]: setDeepValue(obj?.[first] || {}, rest.join('.'), value),
  };
};

