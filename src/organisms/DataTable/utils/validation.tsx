import { z, ZodTypeAny, ZodSchema } from 'zod'
import { ValidatorHelper } from '../interface'

export const getValidationError = <T = unknown>(
  value?: boolean | string | number,
  validation?: (v: ValidatorHelper) => ZodSchema<T>
): string | null => {
  if (!validation) return null
  const validatorHelper: ValidatorHelper = { schema: jsonSchemaToZod, ...z }
  const schema = validation(validatorHelper)

  let valueToValidate = value
  if (schema instanceof z.ZodNumber) {
    valueToValidate = value ? Number(value) : undefined
  }

  const result = schema.safeParse(valueToValidate)
  return result.success ? null : result.error.issues[0].message
}

export const jsonSchemaToZod = (
  schema: { type: string; pattern?: string },
  errorMessage?: string
): ZodTypeAny => {
  if (schema.type === 'string') {
    let zodSchema = z.string()
    if (schema.pattern) {
      zodSchema = zodSchema.regex(
        new RegExp(schema.pattern),
        errorMessage || 'Invalid format'
      )
    }
    return zodSchema
  }
  throw new Error(`Unsupported type: ${schema.type}`)
}
