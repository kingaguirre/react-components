import { z, ZodTypeAny, ZodSchema } from 'zod'
import { ValidatorHelper } from '../interface'

export const getValidationError = (
  value: any,
  validation?: (v: ValidatorHelper) => ZodSchema<any>
): string | null => {
  if (!validation) return null
  const validatorHelper: ValidatorHelper = { schema: jsonSchemaToZod, ...z }
  const schema = validation(validatorHelper)
  const result = schema.safeParse(value)
  return result.success ? null : result.error.issues[0].message
}

export const jsonSchemaToZod = (
  schema: { type: string; pattern?: string },
  errorMessage?: string
): ZodTypeAny => {
  if (schema.type === "string") {
    let zodSchema = z.string()
    if (schema.pattern) {
      zodSchema = zodSchema.regex(
        new RegExp(schema.pattern),
        errorMessage || "Invalid format"
      )
    }
    return zodSchema
  }
  throw new Error(`Unsupported type: ${schema.type}`)
}
