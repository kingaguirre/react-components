import React, {
  forwardRef,
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
} from 'react';
import styled from 'styled-components';
import { useOnClickOutside } from '@utils/index';
import { z, ZodSchema } from 'zod';
import { getValidationError, jsonSchemaToZod } from '../../utils/validation'
import { ValidatorHelper } from '../../interface'
import { FormControl } from '@atoms/FormControl'

const InputStyled = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: 4px;
  border: ${({ hasError }) => (hasError ? '1px solid red' : '1px solid #ccc')};
  outline: none;

  &:invalid,
  &.invalid {
    border: 1px solid red;
  }
`;

const TextAreaStyled = styled.textarea<{ hasError?: boolean }>`
  width: 100%;
  padding: 4px;
  border: ${({ hasError }) => (hasError ? '1px solid red' : '1px solid #ccc')};
  outline: none;

  &:invalid,
  &.invalid {
    border: 1px solid red;
  }
`;

const SelectStyled = styled.select<{ hasError?: boolean }>`
  width: 100%;
  padding: 4px;
  border: ${({ hasError }) => (hasError ? '1px solid red' : '1px solid #ccc')};

  &.invalid {
    border: 1px solid red;
  }
`;

const GroupContainer = styled.div`
  display: flex;
  flex-direction: column;
  outline: none;
`;

const ErrorMessage = styled.div`
  color: red;
  font-size: 0.8em;
  margin-top: 2px;
`;

export type EditorType = | 'text'
| 'textarea'
| 'date'
| 'date-range'
| 'select'
| 'number'
| 'number-range'
| 'checkbox'
| 'radio'
| 'switch'
| 'checkbox-group'
| 'radio-group'
| 'switch-group';

interface EditableCellProps {
  value: any;
  editorType: EditorType;
  onChange: (value: any) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  // Now validation receives our custom validator helper which has a schema() method.
  validation?: (v: ValidatorHelper) => ZodSchema<any>;
}

export const EditableCell = forwardRef<HTMLInputElement | HTMLSelectElement, EditableCellProps>(
  (props, ref) => {
    const {
      value,
      editorType,
      onChange,
      onBlur,
      onKeyDown,
      onCancel,
      autoFocus,
      validation,
    } = props;

    // Create our helper that merges zod with our jsonSchemaToZod converter.
    const validatorHelper = React.useMemo(() => ({ schema: jsonSchemaToZod, ...z }), []);
    const schema = validation ? validation(validatorHelper) : null;

    // --------- Branch 1: Text-like editors (text, textarea, number, date) ---------
    if (['text', 'textarea', 'number', 'date'].includes(editorType)) {
      const [localValue, setLocalValue] = useState(value);
      const [localError, setLocalError] = useState<string | null>(null);
      const inputRef = useRef<HTMLInputElement>(null);

      // Re-validate whenever the localValue changes.
      useEffect(() => {
        if (schema) {
          const result = schema.safeParse(localValue);
          setLocalError(result.success ? null : result.error.issues[0].message);
        }
      }, [localValue, schema]);

      useEffect(() => {
        setLocalValue(value);
      }, [value]);

      const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newVal = e.currentTarget.value;
        setLocalValue(newVal);
        if (editorType === 'date') {
          // For date, commit immediately.
          onChange(newVal);
        }
      };

      // Helper to trim the value before committing.
      const commitValue = () => {
        if (typeof localValue === 'string') {
          const trimmed = localValue.trim();
          if (trimmed !== localValue) {
            setLocalValue(trimmed);
          }
          onChange(trimmed);
        } else {
          onChange(localValue);
        }
      };

      const handleBlurInternal = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (editorType !== 'date') {
          commitValue();
        }
        onBlur?.(e as FocusEvent<HTMLInputElement | HTMLSelectElement>);
      };

      const handleKeyDownInternal = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
          inputRef.current?.blur();
        } else if (e.key === 'Escape' && onCancel) {
          onCancel();
        }
        if (onKeyDown) onKeyDown(e as KeyboardEvent<HTMLInputElement | HTMLSelectElement>);
      };

      // // Choose the correct component based on editorType.
      // const Component = editorType === 'textarea' ? TextAreaStyled : InputStyled;

      return (
        <FormControl
          type={editorType}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlurInternal}
          onKeyDown={handleKeyDownInternal}
          autoFocus={autoFocus}
          color={!!localError ? 'danger' : undefined}
          hasError={!!localError}
          ref={inputRef}
          helpText={localError}
        />
      )
      // return (
      //   <>
      //     <Component
      //       {...(editorType !== 'textarea' ? { type: editorType } : {})}
      //       value={localValue}
      //       onChange={handleChange}
      //       onBlur={handleBlurInternal}
      //       onKeyDown={handleKeyDownInternal}
      //       autoFocus={autoFocus}
      //       hasError={!!localError}
      //       className={localError ? 'invalid' : ''}
      //       ref={inputRef}
      //     />
      //     {localError && <ErrorMessage>{localError}</ErrorMessage>}
      //   </>
      // );
    }

    // --------- Branch 2: Boolean-like editors (checkbox, radio, switch) ---------
    if (['checkbox', 'radio', 'switch'].includes(editorType)) {
      const computedError = getValidationError(value);
      return (
        <>
          <input
            type={editorType === 'switch' ? 'checkbox' : editorType}
            checked={Boolean(value)}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.currentTarget.checked)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            ref={ref as React.RefObject<HTMLInputElement>}
            className={computedError ? 'invalid' : ''}
          />
          {computedError && <ErrorMessage>{computedError}</ErrorMessage>}
        </>
      );
    }

    // --------- Branch 3: Range editors (date-range, number-range) ---------
    if (['date-range', 'number-range'].includes(editorType)) {
      const initialValue: [string, string] =
        Array.isArray(value) && value.length === 2 && typeof value[0] === 'string' && typeof value[1] === 'string'
          ? [value[0], value[1]]
          : ['', ''];
          
      const [localValue, setLocalValue] = useState<[string, string]>(initialValue);

      const [localError, setLocalError] = useState<string | null>(null);
      const containerRef = useRef<HTMLDivElement>(null);
      const inputType = editorType === 'date-range' ? 'date' : 'number';

      useEffect(() => {
        setLocalValue(Array.isArray(value) ? (value as [string, string]) : ['', '']);
      }, [value]);

      useEffect(() => {
        if (schema) {
          const result = schema.safeParse(localValue);
          setLocalError(result.success ? null : result.error.issues[0].message);
        }
      }, [localValue, schema]);

      // Helper to trim each element of the range.
      const commitRangeValue = () => {
        if (Array.isArray(localValue)) {
          const trimmedArray: any = localValue.map(v =>
            typeof v === 'string' ? v.trim() : v
          );
          if (JSON.stringify(trimmedArray) !== JSON.stringify(localValue)) {
            setLocalValue(trimmedArray);
          }
          onChange(trimmedArray);
        } else {
          onChange(localValue);
        }
      };

      useOnClickOutside(containerRef, () => commitRangeValue());

      const handleKeyDownInternal = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          commitRangeValue();
        }
      };

      return (
        <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <InputStyled
              type={inputType}
              value={localValue[0]}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setLocalValue([e.currentTarget.value, localValue[1]])
              }
              onKeyDown={handleKeyDownInternal}
              autoFocus={autoFocus}
              hasError={!!localError}
              className={localError ? 'invalid' : ''}
            />
            <span>-</span>
            <InputStyled
              type={inputType}
              value={localValue[1]}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setLocalValue([localValue[0], e.currentTarget.value])
              }
              onKeyDown={handleKeyDownInternal}
              hasError={!!localError}
              className={localError ? 'invalid' : ''}
            />
          </div>
          {localError && <ErrorMessage>{localError}</ErrorMessage>}
        </div>
      );
    }

    // --------- Branch 4: Select editor ---------
    if (editorType === 'select') {
      const computedError = getValidationError(value);
      return (
        <>
          <SelectStyled
            value={value}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.currentTarget.value)}
            ref={ref as React.RefObject<HTMLSelectElement>}
            autoFocus={autoFocus}
            hasError={!!computedError}
            className={computedError ? 'invalid' : ''}
          >
            <option value="">Select a department</option>
            <option value="HR">HR</option>
            <option value="Engineering">Engineering</option>
            <option value="Sales">Sales</option>
          </SelectStyled>
          {computedError && <ErrorMessage>{computedError}</ErrorMessage>}
        </>
      );
    }

    // --------- Branch 5: Group editors (checkbox-group, switch-group) ---------
    if (['checkbox-group', 'switch-group'].includes(editorType)) {
      const options = ['Option1', 'Option2', 'Option3'];
      const [localValue, setLocalValue] = useState<any[]>(Array.isArray(value) ? value : []);
      const [localError, setLocalError] = useState<string | null>(null);
      const containerRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        setLocalValue(Array.isArray(value) ? value : []);
      }, [value]);

      useEffect(() => {
        if (schema) {
          const result = schema.safeParse(localValue);
          setLocalError(result.success ? null : result.error.issues[0].message);
        }
      }, [localValue, schema]);

      useOnClickOutside(containerRef, () => onChange(localValue));

      return (
        <GroupContainer ref={containerRef} tabIndex={0}>
          {options.map((option) => (
            <label key={option}>
              <input
                type="checkbox"
                checked={localValue.includes(option)}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const checked = e.currentTarget.checked;
                  const newValue = checked
                    ? [...localValue, option]
                    : localValue.filter((v) => v !== option);
                  setLocalValue(newValue);
                }}
              />
              {option}
            </label>
          ))}
          {localError && <ErrorMessage>{localError}</ErrorMessage>}
        </GroupContainer>
      );
    }

    // --------- Branch 6: Radio-group editor ---------
    if (editorType === 'radio-group') {
      const options = ['Option1', 'Option2', 'Option3'];
      const computedError = getValidationError(value);
      const groupNameRef = useRef(`radio-group-${Math.random().toString(36).substr(2, 9)}`);
      return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {options.map((option) => (
            <label key={option}>
              <input
                type="radio"
                name={groupNameRef.current}
                checked={value === option}
                onChange={() => onChange(option)}
                className={computedError ? 'invalid' : ''}
              />
              {option}
            </label>
          ))}
          {computedError && <ErrorMessage>{computedError}</ErrorMessage>}
        </div>
      );
    }

    return null;
  }
);

EditableCell.displayName = 'EditableCell';
