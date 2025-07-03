// src/poc/Form/utils.ts
import { z, ZodRawShape, ZodType, ZodTypeAny, ZodOptional, ZodNullable, ZodEffects } from 'zod';
import type { FieldSetting } from './interface';

// ------------------------------------------------------------------
// helpers & schema builder (including proper flattening through tabs)
// ------------------------------------------------------------------

export function getKey(fs: FieldSetting) {
  return fs.name ?? fs.id ?? '';
}

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
  // 1) build a nested plain‐object tree of Zod schemas or child‐objects
  const tree: Record<string, any> = {};

  for (const fs of fields) {
    const key = getKey(fs);
    if (!key) continue;

    const schema: ZodTypeAny = fs.validation ? fs.validation(z, rowData) : z.any();

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

  // 2) recursively convert the plain‐object tree into nested z.object(...)
  const toZod = (obj: Record<string, any>): ZodTypeAny => {
    const shape: ZodRawShape = Object.fromEntries(
      Object.entries(obj).map(([key, val]) => {
        const s: ZodTypeAny = val instanceof ZodType
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