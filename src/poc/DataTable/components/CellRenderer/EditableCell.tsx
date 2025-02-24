import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
} from 'react'
import { useOnClickOutside } from '@utils/index'
import { z, ZodSchema } from 'zod'
import { getValidationError, jsonSchemaToZod } from '../../utils/validation'
import { ValidatorHelper, EditorType } from '../../interface'
import { FormControl } from '@atoms/FormControl'
import DatePicker from '@molecules/DatePicker'
import Dropdown from '@molecules/Dropdown'

interface EditableCellProps {
  value: any
  editorType: EditorType
  options?: any[]
  onChange: (value: any) => void
  onBlur?: (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => void
  onCancel?: () => void
  autoFocus?: boolean
  // Now validation receives our custom validator helper which has a schema() method.
  validation?: (v: ValidatorHelper) => ZodSchema<any>
  name: string
}

export const EditableCell = (props: EditableCellProps) => {
  const {
    value,
    editorType,
    options,
    onChange,
    onBlur,
    onKeyDown,
    onCancel,
    autoFocus,
    validation,
    name
  } = props

  // Create our helper that merges zod with our jsonSchemaToZod converter.
  const validatorHelper = React.useMemo(() => ({ schema: jsonSchemaToZod, ...z }), [])
  const schema = validation ? validation(validatorHelper) : null

  // --------- Branch 1: Text-like editors (text, textarea, number) ---------
  if (['text', 'textarea', 'number'].includes(editorType)) {
    const [localValue, setLocalValue] = useState(value)
    const [localError, setLocalError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Re-validate whenever the localValue changes.
    useEffect(() => {
      if (schema) {
        const result = schema.safeParse(localValue)
        setLocalError(result.success ? null : result.error.issues[0].message)
      }
    }, [localValue, schema])

    useEffect(() => {
      setLocalValue(value)
    }, [value])

    const handleChange = (e: any) => {
      const newVal = e.currentTarget.value
      setLocalValue(newVal)
    }

    // Helper to trim the value before committing.
    const commitValue = () => {
      if (typeof localValue === 'string') {
        const trimmed = localValue.trim()
        if (trimmed !== localValue) {
          setLocalValue(trimmed)
        }
        onChange(trimmed)
      } else {
        onChange(localValue)
      }
    }

    const handleBlurInternal = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      commitValue()
      onBlur?.(e as FocusEvent<HTMLInputElement | HTMLSelectElement>)
    }

    const handleKeyDownInternal = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        inputRef.current?.blur()
      } else if (e.key === 'Escape' && onCancel) {
        onCancel()
      }
      if (onKeyDown) onKeyDown(e as KeyboardEvent<HTMLInputElement | HTMLSelectElement>)
    }

    return (
      <FormControl
        type={editorType}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlurInternal}
        onKeyDown={handleKeyDownInternal}
        autoFocus={autoFocus}
        color={!!localError ? 'danger' : undefined}
        ref={inputRef}
        helpText={localError}
        className='editable-element'
      />
    )
  }

    // --------- Branch for date and date-range editors ---------
    if (editorType === 'date' || editorType === 'date-range') {
    const isRange = editorType === 'date-range'
    const computedError = getValidationError(value, validation)

    return (
      <DatePicker
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        color={!!computedError ? 'danger' : undefined}
        helpText={computedError}
        range={isRange}
        className='editable-element'
      />
    )
  }

  // --------- Branch 2: Boolean-like editors (checkbox, radio, switch) ---------
  if (['checkbox', 'radio', 'switch'].includes(editorType)) {
    const computedError = getValidationError(Boolean(value), validation)

    return (
      <FormControl
        type={editorType}
        checked={Boolean(value)}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.currentTarget.checked)}
        color={!!computedError ? 'danger' : undefined}
        helpText={computedError}
        simple
        name={name}
        className='editable-element'
      />
    )
  }

  // --------- Branch 4: Select editor ---------
  if (editorType === 'dropdown') {
    const computedError = getValidationError(value, validation)

    return (
      <Dropdown
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        color={!!computedError ? 'danger' : undefined}
        helpText={computedError}
        options={options ?? []}
        className='editable-element'
      />
    )
  }

  // --------- Branch 5: Group editors (checkbox-group, switch-group, radio-group) ---------
  if (['checkbox-group', 'switch-group', 'radio-group'].includes(editorType)) {
    // const options = ['Option1', 'Option2', 'Option3']
    const [localValue, setLocalValue] = useState<any>(Array.isArray(value) ? value : [])
    const [localError, setLocalError] = useState<string | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      setLocalValue(Array.isArray(value) ? value : [])
    }, [value])

    useEffect(() => {
      if (schema) {
        const result = schema.safeParse(localValue)
        setLocalError(result.success ? null : result.error.issues[0].message)
      }
    }, [localValue, schema])

    useOnClickOutside(containerRef, () => onChange(localValue))

    return (
      <div ref={containerRef} tabIndex={0}>
        <FormControl
          type={editorType}
          value={value}
          onChange={(value: string | string[]) => setLocalValue(value)}
          autoFocus={autoFocus}
          color={!!localError ? 'danger' : undefined}
          helpText={localError}
          options={options ?? []}
          simple
          name={name}
        />
      </div>
    )
  }

  return null
}


EditableCell.displayName = 'EditableCell'
