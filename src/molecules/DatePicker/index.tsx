// src/atoms/DatePicker/index.tsx
import React, { useState, useEffect, ReactNode } from 'react'
import ReactDatePicker from 'react-datepicker'
import { formatDate, parseDateRange } from './utils'
import 'react-datepicker/dist/react-datepicker.css'
import { DatePickerContainer, DatePickerGlobalStyles } from './styled'
import { DatePickerProps } from './interface'
import { CustomInput } from './CustomInput'
import { ifElse } from '../../utils/index'

let globalStylesInjected = false // Singleton flag

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = 'Select Date',
  range = false,
  color = 'primary',
  size = 'md',
  minDate,
  maxDate,
  helpText,
  autoFocus,
  ...rest
}) => {
  const [date, setDate] = useState<DatePickerProps['value']>(value || null)
  const [hasInjected, setHasInjected] = useState(false)

  useEffect(() => {
    if (!globalStylesInjected) {
      setHasInjected(true)
      globalStylesInjected = true
    }

    return () => {
      // On unmount, reset the flag so that future mounts re-inject the global styles.
      globalStylesInjected = false
    }
  }, [])

  // Sync with selectedDate prop if it changes dynamically
  useEffect(() => {
    setDate(parseDateRange(value))
  }, [value])

  const handleChange = (newDate: DatePickerProps['value']) => {
    if (!!range && Array.isArray(newDate)) {
      const [start, end] = newDate
      setDate(newDate) // Keep partial selections in state

      if (start && end) {
        onChange?.(formatDate(newDate)) // Only call onChange when both dates are selected
      }
    } else {
      setDate(newDate)
      onChange?.(formatDate(newDate))
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevents opening the date picker
    setDate(null)
    onChange?.(null)
  }

  // Inside your DatePicker component, before the return statement:
  const selectedDateValue = ifElse(range, Array.isArray(date) ? date[0] : null, date)

  const startDateValue = ifElse(range, Array.isArray(date) ? date[0] : null, undefined)

  const endDateValue = ifElse(range, Array.isArray(date) ? date[1] : null, undefined)

  return (
    <DatePickerContainer className={`date-picker ${color}`}>
      {hasInjected && <DatePickerGlobalStyles />} {/* Only inject once */}
      <ReactDatePicker
        selected={selectedDateValue as Date}
        startDate={startDateValue as Date}
        endDate={endDateValue as Date}
        onChange={handleChange}
        disabled={disabled}
        portalId='date-picker-root'
        showMonthDropdown
        dateFormat='dd-MMM-yyyy'
        popperPlacement='bottom-start'
        showYearDropdown
        useWeekdaysShort
        minDate={minDate}
        maxDate={maxDate}
        placeholderText={placeholder}
        required={required}
        autoFocus={autoFocus}
        calendarContainer={CustomCalendarContainer}
        name={rest.name}
        customInput={
          <CustomInput
            {...rest}
            label={label}
            disabled={disabled}
            color={color}
            size={size}
            helpText={helpText}
            handleClear={handleClear}
          />
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        selectsRange={range as any}
      />
    </DatePickerContainer>
  )
}

const CustomCalendarContainer = ({ children }: { children: ReactNode }) => (
  <div className='react-datepicker react-components-datepicker' data-testid='datepicker-popper' onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>{children}</div>
)
