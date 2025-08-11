import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
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
  // Now validation receives our custom validator helper which has a schema() method.
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
    name,
    testId,
    uniqueValueMaps,
    columnId,
    rowData,
    disabled,
  } = props;

  const handleValidationError = (localValue, validation) =>
    getValidationError(
      localValue,
      validation,
      columnId,
      filterUniqueMap(uniqueValueMaps?.[columnId] as string[], value),
      rowData,
    );

  // --------- Branch 1: Text-like editors (text, textarea, number) ---------
  if (["text", "textarea", "number"].includes(editorType)) {
    const [localValue, setLocalValue] = useState(value);
    const [localError, setLocalError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Re-validate whenever the localValue changes.
    useEffect(() => {
      setLocalError(handleValidationError?.(localValue, validation));
    }, [localValue]);

    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleChange = (e: any) => {
      const value = e.currentTarget.value;
      setLocalValue(
        editorType === "number" && !isNaN(value) && !isNaN(parseFloat(value))
          ? +value
          : value,
      );
    };

    // Helper to trim the value before committing.
    const commitValue = () => {
      if (typeof localValue === "string") {
        const trimmed = localValue.trim();
        if (trimmed !== localValue) {
          setLocalValue(trimmed);
        }
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
      if (onKeyDown)
        onKeyDown(e as KeyboardEvent<HTMLInputElement | HTMLSelectElement>);
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
      />
    );
  }

  // --------- Branch for date and date-range editors ---------
  if (editorType === "date" || editorType === "date-range") {
    const isRange = editorType === "date-range";
    const computedError = handleValidationError?.(value, validation);
    const containerRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(containerRef, () => onChange(value), {
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

  // --------- Branch 2: Boolean-like editors (checkbox, radio, switch) ---------
  if (["checkbox", "radio", "switch"].includes(editorType)) {
    const computedError = handleValidationError?.(Boolean(value), validation);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (editorType === "radio") {
          // Only allow selection, not deselection for radio
          if (!value) {
            onChange(true);
          }
        } else {
          onChange(!value);
        }
      }
    };

    useOnClickOutside(containerRef, () => onChange(Boolean(value)));

    return (
      <div ref={containerRef} tabIndex={0}>
        <FormControl
          type={editorType}
          checked={Boolean(value)}
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

  // --------- Branch 4: Select editor ---------
  if (editorType === "dropdown") {
    const computedError = handleValidationError?.(value, validation);
    const containerRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(containerRef, () => onChange(value), {
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
        />
      </div>
    );
  }

  // --------- Branch 5: Group editors (checkbox-group, switch-group, radio-group) ---------
  if (["checkbox-group", "switch-group", "radio-group"].includes(editorType)) {
    // const options = ['Option1', 'Option2', 'Option3']
    const [localValue, setLocalValue] = useState<any>(
      Array.isArray(value) ? value : [],
    );
    const [localError, setLocalError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setLocalValue(Array.isArray(value) ? value : []);
    }, [value]);

    useEffect(() => {
      setLocalError(handleValidationError?.(localValue, validation));
    }, [localValue]);

    useOnClickOutside(containerRef, () => onChange(localValue));

    return (
      <div ref={containerRef} tabIndex={0}>
        <FormControl
          type={editorType}
          value={value}
          onChange={(value: string | string[]) => setLocalValue(value)}
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
