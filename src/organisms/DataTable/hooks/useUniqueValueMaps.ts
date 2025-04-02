// src/organisms/DataTable/hooks/useUniqueValueMaps.ts
import * as z from 'zod'
import { useMemo } from 'react'
import { jsonSchemaToZod } from '../utils/validation'

// Adjust these types and imports according to your project.
interface ColumnSetting {
  column: string
  editor?: {
    validation?: (helper: any, row: any) => any
  } | false
}

interface UniqueValueMaps {
  [key: string]: string[] | undefined
}

export const useUniqueValueMaps = (
  data: any[],
  columnSettings: ColumnSetting[]
): UniqueValueMaps => {
  // Create a fingerprint for unique columns only.
  const uniqueValueFingerprint = useMemo(() => {
    let fingerprint = ""
    data.forEach((row) => {
      columnSettings.forEach((col) => {
        if (col.editor !== false && col.editor?.validation) {
          const validatorHelper = { schema: jsonSchemaToZod, ...z }
          const schema = col.editor.validation(validatorHelper, row)
          if ((schema as any)._unique) {
            fingerprint += `${col.column}:${row[col.column]}|`
          }
        }
      })
    })
    return fingerprint
  }, [data, columnSettings])

  // Compute the unique value maps based on the fingerprint.
  const uniqueValueMaps = useMemo(() => {
    const maps: UniqueValueMaps = {}

    // Initialize each column with an empty array if it supports validation.
    columnSettings.forEach((col) => {
      if (col.editor !== false && col.editor?.validation) {
        maps[col.column] = []
      }
    })

    // Populate the arrays for columns flagged with _unique.
    data.forEach((row) => {
      columnSettings.forEach((col) => {
        if (col.editor !== false && col.editor?.validation) {
          const validatorHelper = { schema: jsonSchemaToZod, ...z }
          const schema = col.editor.validation(validatorHelper, row)
          if ((schema as any)._unique) {
            maps[col.column]?.push(row[col.column])
          }
        }
      })
    })

    // Set empty arrays to undefined.
    Object.keys(maps).forEach((col) => {
      if (maps[col]?.length === 0) {
        maps[col] = undefined
      }
    })

    return maps
  }, [uniqueValueFingerprint, columnSettings])

  return uniqueValueMaps
}
