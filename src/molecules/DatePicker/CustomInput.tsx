// src/atoms/DatePicker/CustomInput.tsx
import React from "react";
import FormControl from "@atoms/FormControl";
import { CustomInputWrapper } from "./styled";
import { CustomInputProps } from "./interface";

export const CustomInput: React.FC<CustomInputProps> = ({
  value,
  onClick = () => {},
  label,
  required = false,
  disabled = false,
  color = "primary",
  placeholder = "Select Date",
  helpText,
  handleClear,
}) => (
  <CustomInputWrapper $value={value}>
    <FormControl
      label={label}
      required={required}
      disabled={disabled}
      type="text"
      color={color}
      value={value ?? ""}
      placeholder={placeholder}
      readOnly
      helpText={helpText}
      onClick={onClick}
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
