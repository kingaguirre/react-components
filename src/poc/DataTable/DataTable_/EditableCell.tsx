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
import { useOnClickOutside } from '@utils/index'; // adjust import as needed

const InputStyled = styled.input`
  width: 100%;
  padding: 4px;
`;

const SelectStyled = styled.select`
  width: 100%;
  padding: 4px;
`;

const GroupContainer = styled.div`
  display: flex;
  flex-direction: column;
  outline: none;
`;

interface EditableCellProps {
  value: any;
  editorType:
    | 'text'
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
  onChange: (value: any) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export const EditableCell = forwardRef<HTMLInputElement | HTMLSelectElement, EditableCellProps>(
  (props, ref) => {
    const { value, editorType, onChange, onBlur, onKeyDown, onCancel, autoFocus } = props;

    // --- Basic editors: text, number, date, checkbox, radio, switch ---
    if (
      editorType === 'text' ||
      editorType === 'number' ||
      editorType === 'date' ||
      editorType === 'checkbox' ||
      editorType === 'radio' ||
      editorType === 'switch'
    ) {
      const [localValue, setLocalValue] = useState(value);
      const committedRef = useRef(false);
      const inputRef = useRef<HTMLInputElement>(null);

      useEffect(() => {
        setLocalValue(value);
        committedRef.current = false;
      }, [value]);

      useEffect(() => {
        if (typeof ref === 'function') {
          ref(inputRef.current);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = inputRef.current;
        }
      }, [ref]);

      // For date editors, commit immediately on change.
      const handleChangeImmediate = (e: ChangeEvent<HTMLInputElement>) => {
        const newVal = e.currentTarget.value;
        setLocalValue(newVal);
        onChange(newVal);
      };

      const handleCommit = () => {
        if (!committedRef.current) {
          committedRef.current = true;
          onChange(localValue);
        }
      };

      const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        if (editorType !== 'date') {
          handleCommit();
        }
        if (onBlur) onBlur(e);
      };

      const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          inputRef.current?.blur();
        } else if (e.key === 'Escape') {
          if (onCancel) onCancel();
        }
      };

      if (editorType === 'number') {
        return (
          <InputStyled
            type="number"
            value={localValue}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setLocalValue(e.currentTarget.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
            ref={inputRef}
          />
        );
      }
      if (editorType === 'date') {
        return (
          <InputStyled
            type="date"
            value={localValue}
            onChange={handleChangeImmediate}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
            ref={inputRef}
          />
        );
      }
      if (editorType === 'checkbox' || editorType === 'radio' || editorType === 'switch') {
        return (
          <input
            type={editorType === 'switch' ? 'checkbox' : editorType}
            checked={Boolean(value)}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.currentTarget.checked)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            ref={ref as React.RefObject<HTMLInputElement>}
          />
        );
      }
      return (
        <InputStyled
          type="text"
          value={localValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setLocalValue(e.currentTarget.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          ref={inputRef}
        />
      );
    }

    // --- Range editors: date-range, number-range ---
    if (editorType === 'date-range' || editorType === 'number-range') {
      const [localValue, setLocalValue] = useState<[string, string]>(
        Array.isArray(value) ? value : ['', '']
      );
      const containerRef = useRef<HTMLDivElement>(null);
      const type = editorType === 'date-range' ? 'date' : 'number';

      useEffect(() => {
        setLocalValue(Array.isArray(value) ? value : ['', '']);
      }, [value]);

      // Commit when clicking outside.
      useOnClickOutside(containerRef, () => onChange(localValue));

      const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          onChange(localValue);
        }
      };

      return (
        <div ref={containerRef} style={{ display: 'flex', gap: '4px' }}>
          <InputStyled
            type={type}
            value={localValue[0]}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setLocalValue([e.currentTarget.value, localValue[1]])
            }
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
          />
          <span>-</span>
          <InputStyled
            type={type}
            value={localValue[1]}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setLocalValue([localValue[0], e.currentTarget.value])
            }
            onKeyDown={handleKeyDown}
          />
        </div>
      );
    }

    // --- Select editor ---
    if (editorType === 'select') {
      // Updated options to match sample data (for "Department" column).
      return (
        <SelectStyled
          value={value}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.currentTarget.value)}
          ref={ref as React.RefObject<HTMLSelectElement>}
          autoFocus={autoFocus}
        >
          <option value="">Select a department</option>
          <option value="HR">HR</option>
          <option value="Engineering">Engineering</option>
          <option value="Sales">Sales</option>
        </SelectStyled>
      );
    }

    // --- Group editors: checkbox-group & switch-group ---
    if (editorType === 'checkbox-group' || editorType === 'switch-group') {
      const options = ['Option1', 'Option2', 'Option3'];
      const [localValue, setLocalValue] = useState<any[]>(Array.isArray(value) ? value : []);
      const containerRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        setLocalValue(Array.isArray(value) ? value : []);
      }, [value]);

      const handleChangeOption = (option: string, checked: boolean) => {
        let newValue;
        if (checked) {
          newValue = Array.isArray(localValue) ? [...localValue, option] : [option];
        } else {
          newValue = Array.isArray(localValue)
            ? localValue.filter((v: string) => v !== option)
            : [];
        }
        setLocalValue(newValue);
      };

      // Commit the value when clicking outside.
      useOnClickOutside(containerRef, () => onChange(localValue));

      return (
        <GroupContainer ref={containerRef} tabIndex={0}>
          {options.map((option) => (
            <label key={option}>
              <input
                type="checkbox"
                checked={Array.isArray(localValue) ? localValue.includes(option) : false}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleChangeOption(option, e.currentTarget.checked)
                }
              />
              {option}
            </label>
          ))}
        </GroupContainer>
      );
    }

    // --- Radio-group editor ---
    if (editorType === 'radio-group') {
      const options = ['Option1', 'Option2', 'Option3'];
      // Generate a unique name for this radio group
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
              />
              {option}
            </label>
          ))}
        </div>
      );
    }

    return null;
  }
);

EditableCell.displayName = 'EditableCell';
