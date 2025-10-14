// src/atoms/DatePicker/index.tsx
import React, { useState, useEffect, ReactNode } from "react";
import ReactDatePicker from "react-datepicker";
import { formatDate, parseDateRange } from "./utils";
import "react-datepicker/dist/react-datepicker.css";
import { DatePickerContainer, DatePickerGlobalStyles } from "./styled";
import { DatePickerProps } from "./interface";
import { CustomInput } from "./CustomInput";

type InternalDate = Date | [Date | null, Date | null] | null;

let globalStylesInjected = false;

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = "Select Date",
  range = false,
  color = "primary",
  size = "md",
  minDate,
  maxDate,
  helpText,
  autoFocus,
  dateFormat = "dd-MMM-yyyy",
  ...rest
}) => {
  const [date, setDate] = useState<InternalDate>(null);
  const [hasInjected, setHasInjected] = useState(false);

  useEffect(() => {
    if (!globalStylesInjected) {
      setHasInjected(true);
      globalStylesInjected = true;
    }

    return () => {
      // On unmount, reset the flag so that future mounts re-inject the global styles.
      globalStylesInjected = false;
    };
  }, []);

  // + parse incoming value (string(s) or Date(s)) using the provided format
  useEffect(() => {
    setDate(parseDateRange(value, dateFormat));
  }, [value, dateFormat]);

  const handleChange = (newDate: Date | [Date | null, Date | null] | null) => {
    if (!!range && Array.isArray(newDate)) {
      const [start, end] = newDate;
      setDate(newDate); // keep partial selection
      if (start && end) {
        onChange?.(formatDate(newDate, dateFormat)); // emits "start,end" strings in your format
      }
    } else {
      setDate(newDate);
      onChange?.(formatDate(newDate, dateFormat)); // emits single formatted string
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDate(null);
    onChange?.(null);
  };

  // compute selected/start/end as Dates for react-datepicker
  const selectedDateValue = range
    ? (Array.isArray(date) ? date[0] : null)
    : (date as Date | null);

  const startDateValue = range ? (Array.isArray(date) ? date[0] : null) : undefined;
  const endDateValue = range ? (Array.isArray(date) ? date[1] : null) : undefined;

  return (
    <DatePickerContainer className={`date-picker ${color}`}>
      {hasInjected && <DatePickerGlobalStyles />} {/* Only inject once */}
      <ReactDatePicker
        selected={selectedDateValue as Date}
        startDate={startDateValue as Date}
        endDate={endDateValue as Date}
        onChange={handleChange}
        disabled={disabled}
        portalId="date-picker-root"
        showMonthDropdown
        dateFormat={dateFormat}
        popperPlacement="bottom-start"
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
        selectsRange={range as any}
      />
    </DatePickerContainer>
  );
};

const CustomCalendarContainer = ({ children }: { children: ReactNode }) => (
  <div
    className="react-datepicker react-components-datepicker"
    data-testid="datepicker-popper"
    onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
  >
    {children}
  </div>
);
