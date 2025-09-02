import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
  useMemo,
  useCallback,
} from "react";
import { ZodSchema } from "zod";
import { filterUniqueMap } from "../../utils";
import { getValidationError } from "../../utils/validation";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { ValidatorHelper, EditorType } from "../../interface";
import { FormControl } from "../../../../atoms/FormControl";
import { DatePicker } from "../../../../molecules/DatePicker";
import { Dropdown } from "../../../../molecules/Dropdown";

interface EditableCellProps {
  value: any;
  editorType: EditorType;
  options?: any[];
  onChange: (value: any) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  validation?: (v: ValidatorHelper) => ZodSchema<any>;
  name: string;
  testId: string;
  columnId: string;
  uniqueValueMaps?: Record<
    string,
    string[] | Record<string, number> | undefined
  >;
  rowData: any;
  disabled?: boolean;
}

export const EditableCell: React.FC<EditableCellProps> = (props) => {
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
    name,
    testId,
    uniqueValueMaps,
    columnId,
    rowData,
    disabled,
  } = props;

  // Stable validation helper
  const computeValidationError = useCallback(
    (val: any) =>
      getValidationError(
        val,
        validation,
        columnId,
        filterUniqueMap(uniqueValueMaps?.[columnId] as string[], value),
        rowData,
      ),
    [validation, columnId, uniqueValueMaps, rowData, value],
  );

  /** ----------------------------------------------------------------
   *  Branch 1: Text-like editors (text, textarea, number)
   *  ---------------------------------------------------------------- */
  if (
    editorType === "text" ||
    editorType === "textarea" ||
    editorType === "number"
  ) {
    const [localValue, setLocalValue] = useState<any>(value);
    const [localError, setLocalError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Keep local state in sync if external value changes
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    // Validate on change
    useEffect(() => {
      setLocalError(computeValidationError(localValue));
    }, [localValue, computeValidationError]);

    const handleChange = (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const v = e.currentTarget.value;
      if (editorType === "number") {
        const num = Number(v);
        setLocalValue(isNaN(num) ? v : num);
      } else {
        setLocalValue(v);
      }
    };

    const commitValue = () => {
      if (typeof localValue === "string") {
        const trimmed = localValue.trim();
        if (trimmed !== localValue) setLocalValue(trimmed);
        onChange(trimmed);
      } else {
        onChange(localValue);
      }
    };

    const handleBlur = (
      e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      commitValue();
      onBlur?.(e as FocusEvent<HTMLInputElement | HTMLSelectElement>);
    };

    const handleKeyDownInternal = (
      e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      if (e.key === "Enter") {
        inputRef.current?.blur();
      } else if (e.key === "Escape" && onCancel) {
        onCancel();
      }
      onKeyDown?.(
        e as unknown as KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
      );
    };

    return (
      <FormControl
        type={editorType}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDownInternal}
        autoFocus={autoFocus}
        color={localError ? "danger" : undefined}
        ref={inputRef}
        helpText={localError}
        className="editable-element"
        testId={testId}
        disabled={disabled}
        clearable={false}
        name={name}
      />
    );
  }

  /** ----------------------------------------------------------------
   *  Branch 2: Date & Date-Range editors
   *  ---------------------------------------------------------------- */
  if (editorType === "date" || editorType === "date-range") {
    const isRange = editorType === "date-range";
    const computedError = useMemo(
      () => computeValidationError(value),
      [value, computeValidationError],
    );
    const containerRef = useRef<HTMLDivElement>(null);

    const stableOnChange = useCallback(
      () => onChange(value),
      [onChange, value],
    );
    useOnClickOutside(containerRef, stableOnChange, {
      ignoreClassNames: "react-datepicker-popper",
    });

    return (
      <div ref={containerRef} tabIndex={0}>
        <DatePicker
          value={value}
          onChange={onChange}
          autoFocus={autoFocus}
          color={computedError ? "danger" : undefined}
          helpText={computedError}
          range={isRange}
          className="editable-element"
          disabled={disabled}
        />
      </div>
    );
  }

  /** ----------------------------------------------------------------
   *  Branch 3: Boolean-like (checkbox, radio, switch)
   *  ---------------------------------------------------------------- */
  if (
    editorType === "checkbox" ||
    editorType === "radio" ||
    editorType === "switch"
  ) {
    const boolVal = Boolean(value);
    const computedError = useMemo(
      () => computeValidationError(boolVal),
      [boolVal, computeValidationError],
    );
    const containerRef = useRef<HTMLDivElement>(null);

    const stableOnChange = useCallback(
      () => onChange(boolVal),
      [onChange, boolVal],
    );
    useOnClickOutside(containerRef, stableOnChange);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (editorType === "radio") {
          if (!boolVal) onChange(true);
        } else {
          onChange(!boolVal);
        }
      }
    };

    return (
      <div ref={containerRef} tabIndex={0}>
        <FormControl
          type={editorType}
          checked={boolVal}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange(e.currentTarget.checked)
          }
          onKeyDown={handleKeyDown}
          color={computedError ? "danger" : undefined}
          helpText={computedError}
          autoFocus={autoFocus}
          simple
          name={name}
          className="editable-element"
          disabled={disabled}
        />
      </div>
    );
  }

  /** ----------------------------------------------------------------
   *  Branch 4: Dropdown
   *  ---------------------------------------------------------------- */
  if (editorType === "dropdown") {
    const computedError = useMemo(
      () => computeValidationError(value),
      [value, computeValidationError],
    );
    const containerRef = useRef<HTMLDivElement>(null);

    const stableOnChange = useCallback(
      () => onChange(value),
      [onChange, value],
    );
    useOnClickOutside(containerRef, stableOnChange, {
      ignoreClassNames: "dropdown-list",
    });

    return (
      <div ref={containerRef} tabIndex={0}>
        <Dropdown
          value={value}
          onChange={onChange}
          autoFocus={autoFocus}
          color={computedError ? "danger" : undefined}
          helpText={computedError}
          options={options ?? []}
          className="editable-element"
          hideOnScroll
          disabled={disabled}
          name={name}
        />
      </div>
    );
  }

  /** ----------------------------------------------------------------
   *  Branch 5: Group editors (checkbox-group, switch-group, radio-group)
   *  ---------------------------------------------------------------- */
  if (
    editorType === "checkbox-group" ||
    editorType === "switch-group" ||
    editorType === "radio-group"
  ) {
    const [localValue, setLocalValue] = useState<any>(
      Array.isArray(value) ? value : [],
    );
    const [localError, setLocalError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setLocalValue(Array.isArray(value) ? value : []);
    }, [value]);

    useEffect(() => {
      setLocalError(computeValidationError(localValue));
    }, [localValue, computeValidationError]);

    const stableOnChange = useCallback(
      () => onChange(localValue),
      [onChange, localValue],
    );
    useOnClickOutside(containerRef, stableOnChange);

    return (
      <div ref={containerRef} tabIndex={0}>
        <FormControl
          type={editorType}
          value={localValue}
          onChange={(v: string | string[]) => setLocalValue(v)}
          autoFocus={autoFocus}
          color={localError ? "danger" : undefined}
          helpText={localError}
          options={options ?? []}
          simple
          name={name}
          disabled={disabled}
        />
      </div>
    );
  }

  return null;
};
