import React, { forwardRef, useState, useRef, useEffect } from 'react';
import {
  InputContainer,
  InputWrapper,
  Label,
  Input,
  TextArea,
  HelpText,
  CustomCheckboxRadio,
  Switch,
  TextContainer,
  Text
} from './styled';
import { FormControlProps } from './interface';

export const FormControl = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormControlProps>(
  (
    {
      label,
      helpText,
      color = 'primary',
      variant,
      size = 'md',
      type = 'text',
      required,
      pattern,
      disabled,
      readOnly,
      text,
      onChange,
      ...rest
    },
    ref // This is the forwarded ref
  ) => {
    const [isInvalid, setIsInvalid] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const isCustomControl = type === 'checkbox' || type === 'radio' || type === 'switch';

    useEffect(() => {
      if (inputRef.current) {
        /** Check any invalid */
        const isInvalid = !inputRef.current.validity.valid;
        /** If boolean control check if unchecked */
        const isInvalidBool = isCustomControl && required && !(inputRef.current as HTMLInputElement).checked;
        /** If regular control check if empty value */
        const isInvalidText = !isCustomControl && required && !(inputRef.current as HTMLInputElement).value;

        setIsInvalid(isInvalid || isInvalidBool || isInvalidText)
      }
    }, [required, isCustomControl]);

    const handleValidation = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value, validity } = event.target as HTMLInputElement;
      setIsInvalid(!validity.valid || (!value && required))

      if (onChange) {
        onChange(event);
      }
    };

    return (
      <InputContainer className="form-control-input-container">
        {label && <Label color={color} size={size}>
          {required && <span>*</span>}{label}
        </Label>}
        <InputWrapper $size={size} $type={type} className="form-control-input-wrapper">
          {isCustomControl ? (
            <TextContainer disabled={disabled}>
              {type === 'switch' ? (
                <Switch
                  className={`form-control-switch ${isInvalid ? 'is-invalid' : ''}`}
                  type="checkbox"
                  color={color}
                  size={size}
                  disabled={disabled}
                  required={required}
                  aria-required={required} // Ensures accessibility and validation support
                  onInvalid={() => setIsInvalid(true)} // Trigger invalid styling if required
                  onChange={(e) => {
                    setIsInvalid(!e.target.checked && required);
                    if (onChange) onChange(e);
                  }}
                  ref={(node) => {
                    inputRef.current = node;
                    if (typeof ref === 'function') {
                      ref(node);
                    } else if (ref) {
                      (ref as any).current = node;
                    }
                  }}
                />
              ) : (
                <CustomCheckboxRadio
                  className={`form-control-${type} ${isInvalid ? 'is-invalid' : ''}`}
                  type={type}
                  color={color}
                  size={size}
                  disabled={disabled}
                  required={required}
                  aria-required={required} // Ensures accessibility and validation support
                  onInvalid={() => setIsInvalid(true)} // Trigger invalid styling if required
                  onChange={(e) => {
                    setIsInvalid(!e.target.checked && required);
                    if (onChange) onChange(e);
                  }}
                  ref={(node) => {
                    inputRef.current = node;
                    if (typeof ref === 'function') {
                      ref(node);
                    } else if (ref) {
                      (ref as any).current = node;
                    }
                  }}
                  {...rest}
                />
              )}
              {text && <Text size={size} disabled={disabled}>{text}</Text>}
            </TextContainer>
          ) : type === 'textarea' ? (
            <TextArea
              className={`form-control-textarea ${isInvalid ? 'is-invalid' : ''}`}
              color={color}
              $variant={variant}
              size={size}
              required={required}
              disabled={disabled}
              readOnly={readOnly}
              onChange={handleValidation}
              ref={(node) => {
                inputRef.current = node;
                if (typeof ref === 'function') {
                  ref(node);
                } else if (ref) {
                  (ref as any).current = node;
                }
              }}
              {...rest}
            />
          ) : (
            <Input
              className={`form-control-${type} ${isInvalid ? 'is-invalid' : ''}`}
              type={type}
              color={color}
              $variant={variant}
              size={size}
              required={required}
              pattern={pattern}
              disabled={disabled}
              readOnly={readOnly}
              onChange={handleValidation}
              ref={(node) => {
                inputRef.current = node;
                if (typeof ref === 'function') {
                  ref(node);
                } else if (ref) {
                  (ref as any).current = node;
                }
              }}
              {...rest}
            />
          )}
        </InputWrapper>
        {helpText && <HelpText color={isInvalid ? 'danger' : color}>{helpText}</HelpText>}
      </InputContainer>
    );
  }
);

FormControl.displayName = 'FormControl';

export default FormControl;