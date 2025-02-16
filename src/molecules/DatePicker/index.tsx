// src/atoms/DatePicker/index.tsx
import React, { useState, useEffect } from "react";
import ReactDatePicker from "react-datepicker";
import { formatDate, parseDateRange } from './utils';
import "react-datepicker/dist/react-datepicker.css";
import { DatePickerContainer, CustomInputWrapper, DatePickerGlobalStyles } from "./styled";
import { DatePickerProps, CustomInputProps } from "./interface";
import FormControl from "@atoms/FormControl";

let globalStylesInjected = false; // Singleton flag

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  selectedDate,
  onChange,
  required = false,
  disabled = false,
  placeholder = "Select Date",
  range = false,
  color = "primary",
  minDate,
  maxDate,
  helpText
}) => {
  const [date, setDate] = useState<DatePickerProps["selectedDate"]>(selectedDate || null);
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

  // Sync with selectedDate prop if it changes dynamically
  useEffect(() => {
    setDate(parseDateRange(selectedDate));
  }, [selectedDate]);

  const handleChange = (newDate: DatePickerProps["selectedDate"]) => {
    if (range) {
      if (Array.isArray(newDate)) {
        const [start, end] = newDate;
        setDate(newDate); // Keep partial selections in state
  
        if (start && end) {
          onChange?.(formatDate(newDate)); // Only call onChange when both dates are selected
        }
      }
    } else {
      setDate(newDate);
      onChange?.(formatDate(newDate));
    }
  };
  
  const handleClear = (e: React.MouseEvent, onClick?: () => void) => {
    e.stopPropagation(); // Prevents opening the date picker
    setDate(null);
    onChange?.(null);
    onClick?.();
  };

  // Custom Input using FormControl
  const CustomInput: React.FC<CustomInputProps> = ({ value, onClick = () => {} }) => (
    <CustomInputWrapper $value={value}>
      <FormControl
        label={label}
        required={required}
        disabled={disabled}
        type="text"
        color={color}
        value={value || ""}
        placeholder={placeholder}
        readOnly
        helpText={helpText}
        onClick={onClick} // Opens the DatePicker on click
        iconRight={[
          value
            ? {
                icon: "clear",
                onClick: (e: React.MouseEvent<HTMLElement>) => handleClear(e, onClick),
                color: "default",
                hoverColor: "danger",
                className: "clear-icon",
              }
            : {},
          {
            icon: "calendar_today",
            onClick,
          },
        ]}
      />
    </CustomInputWrapper>
  );

  return (
    <DatePickerContainer className={`date-picker ${color}`}>
      {hasInjected && <DatePickerGlobalStyles />} {/* Only inject once */}
      <ReactDatePicker
        selected={(range ? Array.isArray(date) ? date[0] : null : date) as Date}
        startDate={(range ? Array.isArray(date) ? date[0] : null : undefined) as Date}
        endDate={(range ? Array.isArray(date) ? date[1] : null : undefined) as Date}
        onChange={handleChange}
        disabled={disabled}
        portalId="root"
        showMonthDropdown
        dateFormat="dd-MMM-yyyy"
        popperPlacement="bottom-start"
        showYearDropdown
        useWeekdaysShort
        minDate={minDate}
        maxDate={maxDate}
        customInput={<CustomInput />}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        selectsRange={range as any}
      />
    </DatePickerContainer>
  );
};

export default DatePicker;
