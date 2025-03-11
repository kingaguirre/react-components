// validation.ts
import { z, ZodTypeAny, ZodSchema, ZodString } from 'zod'
import { ValidatorHelper } from '../interface'

// Extend ZodString with our custom chainable methods and custom properties.
declare module 'zod' {
  interface ZodString {
    unique(message?: string): ZodString;
    required(message?: string): ZodString;
    // Custom flags for internal use.
    _unique?: boolean;
    _uniqueMessage?: string;
    _required?: boolean;
    _requiredMessage?: string;
  }
}

/**
 * fixSchema forces the given schema’s prototype to be ZodString.prototype.
 * This ensures that custom methods (unique, required, etc.) are available.
 */
function fixSchema<T extends ZodString>(schema: T): T {
  Object.setPrototypeOf(schema, ZodString.prototype);
  return schema;
}

/**
 * shallowCloneZodString creates a shallow clone of a ZodString.
 * We use Object.create with property descriptors so that internal state is preserved.
 */
function shallowCloneZodString(schema: ZodString): ZodString {
  return Object.create(
    Object.getPrototypeOf(schema),
    Object.getOwnPropertyDescriptors(schema)
  );
}

/**
 * mergeCustomValidationFlags copies our custom flags from base to newSchema.
 */
const mergeCustomValidationFlags = (newSchema: any, base: any) => {
  if (base._unique) {
    newSchema._unique = base._unique;
    newSchema._uniqueMessage = base._uniqueMessage;
  }
  if (base._required) {
    newSchema._required = base._required;
    newSchema._requiredMessage = base._requiredMessage;
  }
};

// Custom method: unique
ZodString.prototype.unique = function (message = "Duplicate value"): ZodString {
  const base = this;
  // Use our shallow clone helper to avoid interfering with internal properties.
  const newSchema = fixSchema(shallowCloneZodString(base));
  mergeCustomValidationFlags(newSchema, base);
  newSchema._unique = true;
  newSchema._uniqueMessage = message;
  return newSchema;
};

// Custom method: required
ZodString.prototype.required = function (message = "Required field"): ZodString {
  const base = this;
  // Use nonempty() to enforce that the string isn't empty.
  const newSchema = fixSchema(shallowCloneZodString(base)).nonempty({ message }) as unknown as ZodString;
  const fixed = fixSchema(newSchema);
  mergeCustomValidationFlags(fixed, base);
  fixed._required = true;
  fixed._requiredMessage = message;
  return fixed;
};

/**
 * Wrap chainable methods on ZodString so that our custom flags are preserved
 * when chaining built-in validations (e.g. regex, max, min, etc.).
 */
const chainableMethods = Object.getOwnPropertyNames(ZodString.prototype).filter(key => {
  // Skip the constructor and our custom methods.
  if (key === 'constructor' || key === 'unique' || key === 'required') return false;
  const descriptor = Object.getOwnPropertyDescriptor(ZodString.prototype, key);
  if (!descriptor) return false;
  // Only wrap if the property is a function.
  return typeof descriptor.value === 'function';
});

// Wrap each method.
for (const methodName of chainableMethods) {
  const originalMethod = (ZodString.prototype as any)[methodName];
  if (!originalMethod) continue;
  (ZodString.prototype as any)[methodName] = function (...args: any[]) {
    const result = originalMethod.apply(this, args);
    // If the method returns a ZodString, merge custom flags.
    if (result instanceof ZodString) {
      mergeCustomValidationFlags(result, this);
      return result;
    }
    return result;
  }
}

export const getValidationError = <T = unknown>(
  value?: boolean | string | number,
  validation?: (v: ValidatorHelper, rowData: any) => ZodSchema<T>,
  columnId?: string,
  uniqueMap?: string[],
  rowData?: any,
  isCell = false // determine if duplicate validation is in input or in cell
): string | null => {
  if (!validation) return null;
  const validatorHelper: ValidatorHelper = { schema: jsonSchemaToZod, ...z };
  const schema = validation(validatorHelper, rowData);

  const errors: string[] = [];

  // 1. Required check (highest priority)
  if ((schema as any)._required) {
    if (value === undefined || (typeof value === 'string' && value.trim() === '')) {
      errors.push((schema as any)._requiredMessage || 'Required field');
    }
  }

  // 2. Unique check: Only run if value is defined, non-null, and non-empty (if a string)
  if ((schema as any)._unique && columnId && uniqueMap) {
    if (
      value !== undefined &&
      value !== null &&
      !(typeof value === 'string' && value.trim() === '')
    ) {
      // Trim the value before comparing
      const key = String(value).trim();
      if (isCell) {
        const occurrences = uniqueMap.filter(item => item.trim() === key).length;
        if (occurrences >= 2) {
          errors.push((schema as any)._uniqueMessage || 'Duplicate value');
        }
      } else {
        // Use `some` to check for an exact match on the trimmed values.
        if (uniqueMap.some(item => item.trim() === key)) {
          errors.push((schema as any)._uniqueMessage || 'Duplicate value');
        }
      }
    }
  }

  // 3. Built-in Zod validations (e.g. regex, max, etc.)
  const result = schema.safeParse(value);
  if (!result.success) {
    result.error.issues.forEach(issue => {
      errors.push(issue.message);
    });
  }

  // Deduplicate errors.
  const uniqueErrors = Array.from(new Set(errors));
  if (uniqueErrors.length === 0) return null;
  if (uniqueErrors.length === 1) return uniqueErrors[0];
  return uniqueErrors.map(error => `* ${error}.`).join('\n');
};

export const jsonSchemaToZod = (
  schema: { type: string; pattern?: string },
  errorMessage?: string
): ZodTypeAny => {
  if (schema.type === 'string') {
    let zodSchema = z.string();
    if (schema.pattern) {
      zodSchema = zodSchema.regex(
        new RegExp(schema.pattern),
        errorMessage || 'Invalid format'
      );
    }
    return zodSchema;
  }
  throw new Error(`Unsupported type: ${schema.type}`);
};
