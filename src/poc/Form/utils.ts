// src/poc/Form/utils.ts
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
export function flattenForSchema(items: import('./interface').SettingsItem[]): FieldSetting[] {
  const out: FieldSetting[] = [];
  function recurse(arr: import('./interface').SettingsItem[]) {
    for (const i of arr) {
      if ('fields' in i && i.fields) {
        recurse(i.fields);
      } else if ('tabs' in i && i.tabs) {
        i.tabs.forEach(tab => recurse(tab.fields));
      } else {
        out.push(i as FieldSetting);
      }
    }
  }
  recurse(items);
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
  const tree: Record<string, any> = {};

  // 1) build a nested plain‐object tree of Zod schemas or child‐objects
  for (const fs of fields) {
    const key = fs.name;
    if (!key) continue;
    const schema = fs.validation ? fs.validation(z, rowData) : z.any();
    const parts = key.split('.');
    let cur = tree;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (i === parts.length - 1) {
        cur[p] = schema;
      } else {
        cur[p] = cur[p] || {};
        cur = cur[p];
      }
    }
  }

  // 2) recursively convert the plain‐object tree into nested z.objects or z.arrays
  const toZod = (obj: Record<string, any>): ZodTypeAny => {
    const keys = Object.keys(obj);
    if (keys.length && keys.every(k => /^\d+$/.test(k))) {
      const child = toZod(obj[keys[0]]);
      return z.array(child);
    }
    const shape: ZodRawShape = Object.fromEntries(
      keys.map(key => {
        const val = obj[key];
        const s: ZodTypeAny =
          val instanceof ZodType   // ← use ZodType here
            ? val
            : toZod(val);
        return [key, s];
      })
    ) as ZodRawShape;
    return z.object(shape);
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

