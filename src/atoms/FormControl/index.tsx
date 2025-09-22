import React, { forwardRef, useState, useRef, useEffect } from "react";
import {
  FormControInputContainer,
  FormControlWrapper,
  Label,
  HelpText,
  IconWrapper,
  IconContainer,
} from "./styled";
import { FormControlProps, IconRight } from "./interface";
import {
  TextInput,
  TextAreaInput,
  CheckboxRadioInput,
  SwitchInput,
  CheckboxGroup,
  RadioGroup,
  SwitchGroup,
  RadioButtonGroup,
} from "./controls";
import { getInvalidForCustomGroupControl, mergeRefs } from "./utils";
import { Icon } from "../../atoms/Icon";
import { Loader } from "../../atoms/Loader";

// Coerce any "number-ish" input to what the browser will actually display for <input type="number">
function coerceNumberForInput(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "number") return Number.isFinite(raw) ? String(raw) : "";
  if (typeof raw === "string") {
    const s = raw.trim();
    if (s === "") return "";
    // Valid numeric token (no commas, no letters). Allows integers or decimals with optional leading '-'.
    if (/^-?\d*(?:\.\d+)?$/.test(s)) return s;
    // Anything else would render as empty in a number input → treat as empty
    return "";
  }
  return "";
}

export const FormControl = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  FormControlProps
>(
  (
    {
      label,
      helpText,
      color = "primary",
      size = "md",
      type = "text",
      required,
      pattern,
      disabled,
      readOnly,
      text,
      options,
      onChange,
      isVerticalOptions,
      value,
      iconRight,
      className,
      simple,
      loading,
      clearable = true,
      onClearIcon,
      showDisabledIcon = false,
      rounded = false,
      ...rest
    },
    ref,
  ) => {
    const [isInvalid, setIsInvalid] = useState(false);
    const [selectedValues, setSelectedValues] = useState<string[]>([]);
    const [selectedValue, setSelectedValue] = useState<string | null>(null);

    const baseTestId = (rest as any)?.testId;

    const isTextLike =
      type === "text" ||
      type === "password" ||
      type === "email" ||
      type === "number" ||
      type === "textarea";

    // Controlled only when BOTH value and onChange are provided
    const hasValueProp = value !== undefined;
    const isControlled = hasValueProp && typeof onChange === "function";

    // If value is provided BUT no onChange, treat it as an initial default (uncontrolled)
    const treatAsUncontrolledInitial =
      !isControlled && hasValueProp && isTextLike;

    const isEffectivelyReadOnly = !!(disabled || readOnly);

    // Mirror only for uncontrolled text-like inputs
    const [uiValue, setUiValue] = useState<string>(() => {
      const seed = treatAsUncontrolledInitial
        ? (value as any)
        : (rest as any)?.defaultValue;
      const initial = seed == null ? "" : String(seed);
      return type === "number" ? coerceNumberForInput(initial) : initial;
    });

    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(
      null,
    );
    const isCustomControl =
      type === "checkbox" || type === "radio" || type === "switch";
    const isGroupCustomControl =
      type === "checkbox-group" ||
      type === "radio-group" ||
      type === "switch-group" ||
      type === "radio-button-group";

    const combinedRef = mergeRefs(ref, inputRef);

    // Recompute invalid state when value changes (controlled) or uiValue changes (uncontrolled)
    useEffect(() => {
      const el = inputRef.current as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;
      if (!el) return;

      const invalidCustom =
        isCustomControl && required && !(el as HTMLInputElement).checked;
      const invalidText = !isCustomControl && required && !el.value;
      setIsInvalid(!el.validity.valid || invalidCustom || invalidText);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [required, isCustomControl, isControlled ? value : uiValue]);

    useEffect(() => {
      if (isGroupCustomControl) {
        if (type === "radio-group" || type === "radio-button-group") {
          const selected =
            typeof value === "string" ? value.split(",") : value || [];
          setSelectedValue(selected.length > 0 ? selected[0] : null);
          setIsInvalid(selected.length === 0 && required);
        } else {
          const initial =
            typeof value === "string"
              ? value.split(",").filter((v) => v)
              : value || [];
          setSelectedValues(initial);
          setIsInvalid(getInvalidForCustomGroupControl(initial, required));
        }
      }
    }, [value, isGroupCustomControl, required, type]);

    const handleCheckboxChange = (optionValue: string) => {
      const updatedValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v && v !== optionValue)
        : [...selectedValues, optionValue];

      setIsInvalid(getInvalidForCustomGroupControl(updatedValues, required));
      setSelectedValues(updatedValues);
      onChange?.(updatedValues.join(","));
    };

    const handleRadioChange = (optionValue: string) => {
      setIsInvalid(false);
      setSelectedValue(optionValue);
      onChange?.(optionValue);
    };

    // Text-like validation + mirror (uncontrolled)
    const handleValidation = (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      const rawValue = (target as any).value ?? "";

      setIsInvalid(!target.validity.valid || (!rawValue && required));

      if (!isControlled && isTextLike) {
        setUiValue(
          type === "number" ? coerceNumberForInput(rawValue) : String(rawValue),
        );
      }

      onChange?.(event as any);
    };

    const handleBooleanValidation = (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      setIsInvalid(!event.target.checked && required);
      onChange?.(event);
    };

    // ----- What will actually be rendered inside the input -----
    const normalizedValue =
      value === undefined ? undefined : value === null ? "" : value;

    const renderedValue: string = (() => {
      if (!isTextLike) return "";
      if (isControlled) {
        if (type === "number") return coerceNumberForInput(normalizedValue);
        return normalizedValue == null ? "" : String(normalizedValue);
      }
      // uncontrolled
      return uiValue ?? "";
    })();

    // Clear icon visibility must reflect what the user actually sees
    const hasInputValue = renderedValue !== "";

    // Clear handler
    const handleClearClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isEffectivelyReadOnly) return;

      const el = inputRef.current as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;

      if (!isControlled) {
        if (el) (el as any).value = "";
        setUiValue("");
      }

      setIsInvalid(!!required);
      onChange?.({ target: { value: null } } as any);
      onClearIcon?.();
      el?.focus?.();
    };

    // Right-side icons
    const computedRightIcons: IconRight[] = (() => {
      if (isCustomControl || isGroupCustomControl) return iconRight ?? [];

      const disabledLock =
        disabled && showDisabledIcon
          ? [
              {
                icon: "lock_outline",
                className: "disabled lock-icon",
                disabled: true,
              } as IconRight,
            ]
          : [];

      const maybeClear =
        clearable && hasInputValue && !isEffectivelyReadOnly
          ? [
              {
                icon: "clear",
                onClick: handleClearClick,
                color: "default",
                hoverColor: "danger",
                className: "clear-icon",
              } as IconRight,
            ]
          : [];

      return [...disabledLock, ...(iconRight ?? []), ...maybeClear];
    })();

    // ----- Props to pass to leaf inputs -----
    const baseProps = {
      color,
      size,
      type,
      disabled,
      readOnly,
      ref: combinedRef,
      name: `form-control-${type}`,
      className: `form-control-${type} ${isInvalid ? "invalid" : ""} ${disabled ? "disabled" : ""}`,
      ...rest,
    } as const;

    // Only pass `value` when truly controlled; otherwise use defaultValue for initial seeds
    const textValueProps = isTextLike
      ? isControlled
        ? { value: renderedValue }
        : treatAsUncontrolledInitial
          ? { defaultValue: renderedValue }
          : {}
      : {};

    const textLikeProps = { ...baseProps, ...textValueProps };
    const nonTextDefaultProps = baseProps;

    return (
      <FormControInputContainer
        $rounded={rounded}
        className={`form-control-input-container ${type ?? ""} ${className ?? ""} ${disabled ? "disabled" : ""} ${isInvalid ? "invalid" : ""}`}
      >
        {label && (
          <Label className="form-control-label" color={color} size={size}>
            {required && <span>*</span>}
            {label}
          </Label>
        )}

        <FormControlWrapper
          $simple={simple}
          $iconRight={computedRightIcons as any}
          $size={size}
          $type={type}
          className={`form-control-wrapper ${disabled ? "disabled" : ""} ${isInvalid ? "invalid" : ""}`}
        >
          {(() => {
            const customCheckboxGroupProps = {
              ...nonTextDefaultProps,
              options,
              onChange: handleCheckboxChange,
              selectedValues,
              isVerticalOptions,
            };
            const customRadioGroupProps = {
              ...nonTextDefaultProps,
              options,
              onChange: handleRadioChange,
              selectedValue,
              isVerticalOptions,
              isInvalid,
            };

            switch (type) {
              case "text":
              case "password":
              case "email":
              case "number":
                return (
                  <TextInput
                    {...{
                      ...textLikeProps,
                      pattern,
                      onChange: handleValidation,
                    }}
                  />
                );
              case "textarea":
                return (
                  <TextAreaInput
                    {...{
                      ...textLikeProps,
                      onChange: handleValidation,
                    }}
                  />
                );
              case "checkbox":
              case "radio":
                return (
                  <CheckboxRadioInput
                    {...{
                      ...nonTextDefaultProps,
                      text,
                      onChange: handleBooleanValidation,
                    }}
                  />
                );
              case "switch":
                return (
                  <SwitchInput
                    {...{
                      ...nonTextDefaultProps,
                      text,
                      onChange: handleBooleanValidation,
                    }}
                  />
                );
              case "checkbox-group":
                return <CheckboxGroup {...customCheckboxGroupProps} />;
              case "radio-group":
                return <RadioGroup {...customRadioGroupProps} />;
              case "radio-button-group":
                return <RadioButtonGroup {...customRadioGroupProps} />;
              case "switch-group":
                return <SwitchGroup {...customCheckboxGroupProps} />;
              default:
                return null;
            }
          })()}

          {computedRightIcons?.length > 0 &&
            !isCustomControl &&
            !isGroupCustomControl && (
              <IconWrapper
                className="wrapper-icon"
                $size={size}
                $color={color}
                $disabled={disabled}
              >
                {computedRightIcons
                  .filter((obj: IconRight) => Object.keys(obj).length)
                  .slice(0, 2)
                  .map((icon: IconRight, idx: number) => {
                    const iconIsDisabled = !!(disabled || icon.disabled);
                    const handleIconClick =
                      iconIsDisabled || icon.icon === "lock_outline"
                        ? undefined
                        : icon?.onClick;

                    const computedTestId =
                      icon.className === "clear-icon" && baseTestId
                        ? `${baseTestId}-clear-icon`
                        : icon.className;

                    return (
                      <IconContainer
                        key={`${icon.icon}-${idx}`}
                        onClick={handleIconClick}
                        data-testid={computedTestId}
                        className={`container-icon ${icon.className ?? ""} ${iconIsDisabled ? "disabled" : ""} ${isInvalid ? "invalid" : ""}`}
                        $disabled={iconIsDisabled}
                        $size={size}
                        $color={icon.color ?? color}
                        $hoverColor={
                          iconIsDisabled
                            ? undefined
                            : (icon.hoverColor ?? color)
                        }
                        $isInvalid={isInvalid}
                        aria-disabled={iconIsDisabled}
                        tabIndex={-1}
                        title={
                          icon.className === "clear-icon"
                            ? iconIsDisabled
                              ? "Clear (disabled)"
                              : "Clear"
                            : icon.icon === "lock_outline"
                              ? "Locked"
                              : (icon?.title ?? undefined)
                        }
                      >
                        <Icon icon={icon.icon} />
                      </IconContainer>
                    );
                  })}
              </IconWrapper>
            )}

          {loading && <Loader size={16} thickness={3} />}
        </FormControlWrapper>

        {helpText && (
          <HelpText
            className="help-text"
            color={isInvalid ? "danger" : color}
            data-testid={`${baseTestId}-help-text`}
          >
            {helpText}
          </HelpText>
        )}
      </FormControInputContainer>
    );
  },
);
