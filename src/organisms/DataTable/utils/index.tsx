import { FilterFn } from '@tanstack/react-table'
import { ColumnSetting } from '../interface'

export const dateFilter: FilterFn<unknown> = (row, columnId, filterValue) => { // defined inline here
  if (!filterValue) return true

  const rowValue = row.getValue(columnId)

  if (
    !rowValue ||
    (typeof rowValue !== 'string' &&
      typeof rowValue !== 'number' &&
      !(rowValue instanceof Date))
  ) {
    return false
  }

  const rowDate = new Date(rowValue)
  const filterDate = new Date(filterValue)

  return rowDate.toDateString() === filterDate.toDateString()
}

export const dateRangeFilter: FilterFn<unknown> = (row, columnId, filterValue) => {
  // Expect filterValue as a comma-separated string: 'start,end'
  const [start, end] = typeof filterValue === 'string'
    ? filterValue.split(',')
    : []

  // If neither start nor end is provided, don't filter out this row.
  if (!start && !end) return true

  const rowValue = row.getValue(columnId)

  // If there's no row value, or it's not a valid date type, filter out.
  if (
    !rowValue ||
    (typeof rowValue !== 'string' &&
      typeof rowValue !== 'number' &&
      !(rowValue instanceof Date))
  ) {
    return false
  }

  const rowDate = new Date(rowValue)

  // If a start date is provided, rowDate must be on or after it.
  if (start && rowDate < new Date(start)) return false
  // If an end date is provided, rowDate must be on or before it.
  if (end && rowDate > new Date(end)) return false

  return true
}

export const checkUniqueColumns = (settings: ColumnSetting[]): void => {
  const seen = new Set<string>()
  settings.forEach((setting) => {
    if (seen.has(setting.column)) {
      throw new Error(`Duplicate column key detected: ${setting.column}`)
    }
    seen.add(setting.column)
  })
}

// Utility to set a deep value. If the path doesn't have dots, it simply updates the value.
export const setDeepValue = (obj: any, path: string, value: unknown): any => {
  if (!path.includes('.')) {
    return { ...obj, [path]: value }
  }
  const keys = path.split('.')
  const key = keys[0]
  const arrayMatch = key.match(/^\[(\d+)\]$/)

  if (keys.length === 1) {
    if (arrayMatch) {
      const index = parseInt(arrayMatch[1], 10)
      const arr = Array.isArray(obj) ? [...obj] : []
      arr[index] = value
      return arr
    }
    return { ...obj, [key]: value }
  }

  if (arrayMatch) {
    const index = parseInt(arrayMatch[1], 10)
    const arr = Array.isArray(obj) ? [...obj] : []
    arr[index] = setDeepValue(arr[index] || {}, keys.slice(1).join('.'), value)
    return arr
  } else {
    return {
      ...obj,
      [key]: setDeepValue(obj ? obj[key] || {} : {}, keys.slice(1).join('.'), value),
    }
  }
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

// This utility function removes the __internalId property from each row.
// It returns an array of rows without the internal meta property.
export const sanitizeData = <T extends { __internalId: string }>(data: T[]): Omit<T, '__internalId'>[] => 
  data.map(({ __internalId, ...rest }) => rest)

export const getFirstVisibleKey = (visibility, keyNames) => {
  for (let i = 0; i < keyNames.length; i++) {
    if (visibility[keyNames[i]] === true) {
      return keyNames[i]
    }
  }
  return null
}

export const filterUniqueMap = (arr?: string[], value?: string) => {
  const _arr = Array.isArray(arr) ? arr : undefined;
  if (!_arr || value === undefined) return _arr;
  const index = _arr.indexOf(value);
  if (index === -1) return _arr;
  return [..._arr.slice(0, index), ..._arr.slice(index + 1)];
};
