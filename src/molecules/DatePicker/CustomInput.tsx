// src/atoms/DatePicker/CustomInput.tsx
import React from "react";
import { FormControl } from "../../atoms/FormControl";
import { CustomInputWrapper } from "./styled";
import { CustomInputProps } from "./interface";

export const CustomInput: React.FC<CustomInputProps> = ({
  value,
  onClick = () => {},
  label,
  required = false,
  disabled = false,
  color = "primary",
  size = "md",
  placeholder = "Select Date",
  helpText,
  handleClear,
  ...rest
}) => (
  <CustomInputWrapper $value={value}>
    <FormControl
      {...rest}
      label={label}
      required={required}
      disabled={disabled}
      type="text"
      color={color}
      size={size}
      value={value ?? ""}
      placeholder={placeholder}
      readOnly
      helpText={helpText}
      onClick={onClick}
      iconRight={[
        value
          ? {
              icon: "clear",
              onClick: (e: React.MouseEvent<HTMLElement>) => handleClear(e),
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
