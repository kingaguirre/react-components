// src/organisms/FormRenderer/validation.tsx
import { ZodString } from 'zod';

declare module 'zod' {
  interface ZodString {
    required(message?: string): ZodString;
    _required?: boolean;
    _requiredMessage?: string;
  }
}

function fixString<T extends ZodString>(schema: T): T {
  Object.setPrototypeOf(schema, ZodString.prototype);
  return schema;
}

function shallowCloneString(schema: ZodString): ZodString {
  return Object.create(
    Object.getPrototypeOf(schema),
    Object.getOwnPropertyDescriptors(schema)
  );
}

function mergeRequiredFlag<T extends ZodString>(target: T, source: T) {
  if ((source as any)._required) {
    (target as any)._required = (source as any)._required;
    (target as any)._requiredMessage = (source as any)._requiredMessage;
  }
}

ZodString.prototype.required = function (message = 'Required field'): ZodString {
  const base = this;
  // clone + nonempty()
  const nonEmpty = fixString(shallowCloneString(base))
    .nonempty({ message }) as unknown as ZodString;
  // carry over any prior flags
  mergeRequiredFlag(nonEmpty, base);
  (nonEmpty as any)._required = true;
  (nonEmpty as any)._requiredMessage = message;
  return nonEmpty;
};

// wrap all other ZodString methods so they preserve the _required flag
for (const key of Object.getOwnPropertyNames(ZodString.prototype)) {
  if (['constructor', 'required'].includes(key)) continue;
  const desc = Object.getOwnPropertyDescriptor(ZodString.prototype, key);
  if (!desc || typeof desc.value !== 'function') continue;
  const original = desc.value as Function;
  Object.defineProperty(ZodString.prototype, key, {
    ...desc,
    value: function (...args: any[]) {
      const result = original.apply(this, args);
      if (result instanceof ZodString) {
        mergeRequiredFlag(result, this as any);
        return result;
      }
      return result;
    }
  });
}

// No exports—just side‐effectful patch. Make sure to import this file before using `z.string().required()`.
