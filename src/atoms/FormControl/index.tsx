import React, { forwardRef, useState, useRef, useEffect } from 'react'
import { FormControInputContainer, FormControlWrapper, Label, HelpText, IconWrapper, IconContainer } from './styled'
import { FormControlProps, IconRight } from './interface'
import { 
  TextInput, TextAreaInput, CheckboxRadioInput, SwitchInput, 
  CheckboxGroup, RadioGroup, SwitchGroup , RadioButtonGroup
} from './controls'
import { getInvalidForCustomGroupControl, mergeRefs } from './utils'
import { Icon } from '../../atoms/Icon'
import { Loader } from '../../atoms/Loader'

export const FormControl = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormControlProps>(({
  label,
  helpText,
  color = 'primary',
  size = 'md',
  type = 'text',
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
  ...rest
}, ref) => {

  const [isInvalid, setIsInvalid] = useState(false)
  const [selectedValues, setSelectedValues] = useState<string[]>([])
  const [selectedValue, setSelectedValue] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const prevValue = useRef(value)
  const isCustomControl = type === 'checkbox' || type === 'radio' || type === 'switch'
  const isGroupCustomControl = type === 'checkbox-group' || type === 'radio-group' || type === 'switch-group' || type === 'radio-button-group'
  const isFirstRender = useRef(true) // Track initial mount
  
  // Merge the forwarded ref and internal ref
  const combinedRef = mergeRefs(ref, inputRef)

  useEffect(() => {
    if (inputRef.current) {
      const element = inputRef.current as HTMLInputElement
      const isInvalidBool = isCustomControl && required && !element.checked
      const isInvalidText = !isCustomControl && required && !element.value

      // Always validate on first render OR when value changes
      if (isFirstRender.current || prevValue.current !== value) {
        setIsInvalid(!element.validity.valid || isInvalidBool || isInvalidText)
        prevValue.current = value
        isFirstRender.current = false // Mark first render as done
      }
    }
  }, [required, isCustomControl, value, inputRef])

  useEffect(() => {
    if (isGroupCustomControl) {
      if (type === 'radio-group' || type === 'radio-button-group') {
        const selectedValues = typeof value === 'string' ? value.split(',') : value || []
        const processedValue = selectedValues.length > 0 ? selectedValues[0] : null
    
        setSelectedValue(processedValue)
        setIsInvalid(selectedValues.length === 0 && required)
      } else {
        const initialValues = typeof value === 'string' ? value.split(',').filter(v => v) : value || []
        setSelectedValues(initialValues)
        setIsInvalid(getInvalidForCustomGroupControl(initialValues, required))
      }
    }
  }, [value, isGroupCustomControl, required, type])

  const handleCheckboxChange = (optionValue: string) => {
    const updatedValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v && v !== optionValue) // Ensures no empty values
      : [...selectedValues, optionValue] // Adds new value ensuring no empty strings

    setIsInvalid(getInvalidForCustomGroupControl(updatedValues, required))
    setSelectedValues(updatedValues)
    onChange?.(updatedValues.join(','))
  }

  const handleRadioChange = (optionValue: string) => {
    setIsInvalid(false)
    setSelectedValue(optionValue)
    onChange?.(optionValue)
  }

  const handleValidation = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value, validity } = event.target as HTMLInputElement
    setIsInvalid(!validity.valid || (!value && required))
    if (onChange) onChange(event)
  }

  const handleBooleanValidation = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsInvalid(!event.target.checked && required)
    if (onChange) onChange(event)
  }

  return (
    <FormControInputContainer className={`form-control-input-container ${type ?? ''} ${className ?? ''} ${disabled ? 'disabled' : ''} ${isInvalid ? 'invalid' : ''}`}>
      {label && <Label color={color} size={size}>{required && <span>*</span>}{label}</Label>}
      <FormControlWrapper
        $simple={simple}
        $iconRight={iconRight}
        $size={size}
        $type={type}
        className={`form-control-wrapper ${disabled ? 'disabled' : ''} ${isInvalid ? 'invalid' : ''}`}
      >
        {(() => {
          const defaultProps = {
            color,
            size,
            type,
            disabled,
            readOnly,
            value,
            ref: combinedRef,
            name: `form-control-${type}`,
            className: `form-control-${type} ${isInvalid ? 'invalid' : ''} ${disabled ? 'disabled' : ''}`,
            ...rest
          }

          const customCheckboxGroupProps = { ...defaultProps, options, onChange: handleCheckboxChange, selectedValues, isVerticalOptions }
          const customRadioGroupProps = { ...defaultProps, options, onChange: handleRadioChange, selectedValue, isVerticalOptions, isInvalid }

          switch (type) {
            case 'text':
            case 'password':
            case 'email':
            case 'number':
              return <TextInput {...{ ...defaultProps, ...rest, pattern, onChange: handleValidation }} />
            case 'textarea':
              return <TextAreaInput {...{ ...defaultProps, ...rest, onChange: handleValidation }} />
            case 'checkbox':
            case 'radio': 
              return <CheckboxRadioInput {...{ ...defaultProps, ...rest, text, onChange: handleBooleanValidation }} />
            case 'switch': 
              return <SwitchInput {...{ ...defaultProps, ...rest, text, onChange: handleBooleanValidation }} />
            case 'checkbox-group': 
              return <CheckboxGroup {...customCheckboxGroupProps} />
            case 'radio-group': 
              return <RadioGroup {...customRadioGroupProps} />
            case 'radio-button-group': 
              return <RadioButtonGroup {...customRadioGroupProps} />
            case 'switch-group': 
              return <SwitchGroup {...customCheckboxGroupProps} />
            default: 
              return null
          }
        })()}
        {(iconRight?.length > 0 && !isCustomControl && !isGroupCustomControl) && (
          <IconWrapper
            className='wrapper-icon'
            $size={size}
            $color={color}
            $disabled={disabled}
          >
            {iconRight
              .filter((obj: IconRight) => Object.keys(obj).length)
              .slice(0, 2)
              .map((icon: IconRight, idx: number) => (
              <IconContainer
                key={`${icon.icon}-${idx}`}
                onClick={icon?.onClick}
                data-testid={icon.className}
                className={`container-icon ${icon.className ?? ''}`}
                $disabled={icon.disabled}
                $size={size}
                $color={icon.color ?? color}
                $hoverColor={icon.hoverColor ?? color}
              >
                <Icon icon={icon.icon} />
              </IconContainer>
            ))}
          </IconWrapper>
        )}
        {loading && <Loader size={16} thickness={3}/>}
      </FormControlWrapper>
      {helpText && (
        <HelpText
          className='help-text'
          color={isInvalid ? 'danger' : color}
          data-testid={`${rest.testId}-help-text`}
        >{helpText}</HelpText>
      )}
    </FormControInputContainer>
  )}
)
