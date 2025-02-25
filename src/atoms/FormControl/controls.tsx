import React from 'react';
import {
  Input,
  TextArea,
  CustomCheckboxRadio,
  Switch,
  TextContainer,
  Text,
  GroupControlContainer,
  RadioButton,
  RadioButtonContainer,
  NoOptionsContainer,
} from './styled';
import { FormControlProps } from './interface';
import Button from '@atoms/Button';

export const TextInput: React.FC<FormControlProps> = ({ variant, ...rest }) => <Input autoComplete="off" $variant={variant} {...rest} />;

export const TextAreaInput: React.FC<FormControlProps> = ({ variant, ...rest }) => <TextArea $variant={variant} {...rest} />;

export const CheckboxRadioInput: React.FC<FormControlProps> = ({ disabled, text, size, ...rest }) => (
  <TextContainer disabled={disabled} onClick={e => e.stopPropagation()}>
    <CustomCheckboxRadio {...rest} size={size} disabled={disabled} />
    {text && <Text size={size} disabled={disabled}>{text}</Text>}
  </TextContainer>
);

export const SwitchInput: React.FC<FormControlProps> = ({ disabled, text,size,  ...rest }) => (
  <TextContainer disabled={disabled} onClick={e => e.stopPropagation()}>
    <Switch {...rest} size={size} disabled={disabled} type="checkbox" />
    {text && <Text size={size} disabled={disabled}>{text}</Text>}
  </TextContainer>
);

export const CheckboxGroup: React.FC<FormControlProps> = ({ 
  options = [],
  disabled,
  onChange,
  isVerticalOptions,
  selectedValues,
  ...rest 
}) => (
  <GroupControlContainer $isVerticalOptions={isVerticalOptions} className="group-control-container checkbox-group">
    {options?.length > 0 ? options.map((option) => (
      <TextContainer key={option.value} disabled={option.disabled}>
        <CheckboxRadioInput
          {...rest}
          key={option.value}
          type="checkbox"
          disabled={option.disabled || disabled}
          value={option.value}
          checked={selectedValues.includes(option.value)}
          onChange={() => onChange(option.value)}
          text={option.text}
        />
      </TextContainer>
    )) : <NoOptionsContainer>No Options found</NoOptionsContainer>}
  </GroupControlContainer>
);


export const RadioGroup: React.FC<FormControlProps> = ({
  options = [],
  disabled,
  onChange,
  isVerticalOptions,
  selectedValue,
  isInvalid,
  ...rest
}) => (
  <GroupControlContainer $isVerticalOptions={isVerticalOptions} className={`group-control-container radio-group ${isInvalid ? 'invalid' : ''}`}>
    {options?.length > 0 ? options.map((option) => (
      <CheckboxRadioInput
        {...rest}
        key={option.value}
        type="radio"
        disabled={option.disabled || disabled}
        value={option.value}
        checked={selectedValue === option.value}
        onChange={() => onChange(option.value)}
        text={option.text}
      />
    )) : <NoOptionsContainer>No Options found</NoOptionsContainer>}
  </GroupControlContainer>
);

export const SwitchGroup: React.FC<FormControlProps> = ({
  options = [],
  disabled,
  onChange,
  isVerticalOptions,
  selectedValues,
  ...rest
}) => (
  <GroupControlContainer $isVerticalOptions={isVerticalOptions} className="group-control-container switch-group">
    {options?.length > 0 ? options.map((option) => (
      <TextContainer key={option.value} disabled={option.disabled}>
        <SwitchInput
          {...rest}
          type="checkbox"
          disabled={option.disabled || disabled}
          value={option.value}
          checked={selectedValues.includes(option.value)}
          onChange={() => onChange(option.value)}
          text={option.text}
        />
      </TextContainer>
    )) : <NoOptionsContainer>No Options found</NoOptionsContainer>}
  </GroupControlContainer>
);

export const RadioButtonGroup: React.FC<FormControlProps> = ({
  options = [],
  disabled,
  size,
  onChange,
  isVerticalOptions,
  selectedValue,
  color,
  isInvalid,
  ...rest
}) => (
  <GroupControlContainer $isVerticalOptions={isVerticalOptions} $gap={0} className="group-control-container radio-button-group">
    {options?.length > 0 ? options.map((option) => (
      <RadioButtonContainer key={option.value} disabled={option.disabled}>
        <RadioButton
          {...rest}
          type="radio"
          size={size}
          color={color}
          disabled={option.disabled || disabled}
          value={option.value}
          checked={selectedValue === option.value}
          onChange={() => onChange(option.value)}
        />
        <Button
          size={size}
          disabled={option.disabled || disabled}
          color={isInvalid ? 'danger' : color}
          active={selectedValue === option.value}
          fullWidth
        >
          {option.text}
        </Button>
      </RadioButtonContainer>
    )) : <NoOptionsContainer>No Options found</NoOptionsContainer>}
  </GroupControlContainer>
);

