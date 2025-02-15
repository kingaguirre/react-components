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

export const TextInput: React.FC<FormControlProps> = ({ ...rest }) => <Input {...rest} />;

export const TextAreaInput: React.FC<FormControlProps> = ({ ...rest }) => <TextArea {...rest} />;

export const CheckboxRadioInput: React.FC<FormControlProps> = ({ disabled, text, size, ...rest }) => (
  <TextContainer disabled={disabled}>
    <CustomCheckboxRadio {...rest} size={size} disabled={disabled} />
    {text && <Text size={size} disabled={disabled}>{text}</Text>}
  </TextContainer>
);

export const SwitchInput: React.FC<FormControlProps> = ({ disabled, text,size,  ...rest }) => (
  <TextContainer disabled={disabled}>
    <Switch {...rest} size={size} disabled={disabled} type="checkbox" />
    {text && <Text size={size} disabled={disabled}>{text}</Text>}
  </TextContainer>
);

export const CheckboxGroup: React.FC<FormControlProps> = ({ 
  options = [], 
  disabled, 
  size, 
  value, 
  onChange, 
  isVerticalOptions, 
  selectedValues,
  ...rest 
}) => (
  <GroupControlContainer $isVerticalOptions={isVerticalOptions} className="group-control-container checkbox-group">
    {options?.length > 0 ? options.map((option) => (
      <TextContainer key={option.value} disabled={option.disabled}>
        <CustomCheckboxRadio
          {...rest}
          type="checkbox"
          size={size}
          disabled={option.disabled || disabled}
          value={option.value}
          checked={selectedValues.includes(option.value)}
          onChange={() => onChange(option.value)}
        />
        <Text size={size} disabled={option.disabled}>{option.text}</Text>
      </TextContainer>
    )) : <NoOptionsContainer>No Options found</NoOptionsContainer>}
  </GroupControlContainer>
);


export const RadioGroup: React.FC<FormControlProps> = ({
  options = [],
  disabled,
  size,
  value,
  onChange,
  isVerticalOptions,
  selectedValue,
  isInvalid,
  ...rest
}) => (
  <GroupControlContainer $isVerticalOptions={isVerticalOptions} className={`group-control-container radio-group ${isInvalid ? 'invalid' : ''}`}>
    {options?.length > 0 ? options.map((option) => (
      <TextContainer key={option.value} disabled={option.disabled}>
        <CustomCheckboxRadio
          {...rest}
          type="radio"
          size={size}
          disabled={option.disabled || disabled}
          value={option.value}
          checked={selectedValue === option.value}
          onChange={() => onChange(option.value)}
        />
        <Text size={size} disabled={option.disabled}>{option.text}</Text>
      </TextContainer>
    )) : <NoOptionsContainer>No Options found</NoOptionsContainer>}
  </GroupControlContainer>
);

export const SwitchGroup: React.FC<FormControlProps> = ({
  options = [],
  disabled,
  size,
  value,
  onChange,
  isVerticalOptions,
  selectedValues,
  ...rest
}) => (
  <GroupControlContainer $isVerticalOptions={isVerticalOptions} className="group-control-container switch-group">
    {options?.length > 0 ? options.map((option) => (
      <TextContainer key={option.value} disabled={option.disabled}>
        <Switch
          {...rest}
          type="checkbox"
          size={size}
          disabled={option.disabled || disabled}
          value={option.value}
          checked={selectedValues.includes(option.value)}
          onChange={() => onChange(option.value)}
        />
        <Text size={size} disabled={option.disabled}>{option.text}</Text>
      </TextContainer>
    )) : <NoOptionsContainer>No Options found</NoOptionsContainer>}
  </GroupControlContainer>
);

export const RadioButtonGroup: React.FC<FormControlProps> = ({
  options = [],
  disabled,
  size,
  value,
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

