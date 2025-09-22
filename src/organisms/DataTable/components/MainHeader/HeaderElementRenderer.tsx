import React from "react";
import styled from "styled-components";
import { Icon } from "../../../../atoms/Icon";
import { Button } from "../../../../atoms/Button";
import { FormControl } from "../../../../atoms/FormControl";
import { Dropdown } from "../../../../molecules/Dropdown";
import { DatePicker } from "../../../../molecules/DatePicker";
import type { HeaderRightElement, DataTableFormControlType } from "../../interface";

interface Props {
  elements?: HeaderRightElement[];
  isRight?: boolean
}

const WrapperContainer = styled.div<{ $isRight?: boolean}>`
  display: flex;
  justify-content: ${({ $isRight }) => $isRight ? 'flex-start' : 'flex-end'};
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 2px 0;
`;

const Wrapper = styled.div<{ width?: string | number }>`
  display: inline-block;
  width: auto;
  max-width: ${({ width }) => {
    if (typeof width === "number") return `${width}px`;
    if (typeof width === "string") return width;
    return "auto";
  }};
`;

export const HeaderElementRenderer: React.FC<Props> = ({ elements, isRight = true }) => {
  if (!elements || elements.length === 0) return null;

  return (
    <WrapperContainer $isRight={isRight}>
      {elements.map((el, i) => {
        if (!el.type) {
          console.warn(`Text type is missing for element at index ${i}`);
          return null;
        }

        switch (el.type) {
          case "button":
            return (
              <Wrapper key={i} width={el.width}>
                <Button
                  color={el.color}
                  variant={el.variant}
                  size="sm"
                  disabled={el.disabled}
                  onClick={el.onClick}
                  fullWidth
                >
                  {el.text}
                  {el.icon && <Icon icon={el.icon} />}
                </Button>
              </Wrapper>
            );

          case "dropdown":
            return (
              <Wrapper key={i} width={el.width}>
                <Dropdown
                  name={el.name}
                  options={el.options || []}
                  value={el.value}
                  multiselect={el.multiselect}
                  disabled={el.disabled}
                  onChange={el.onChange}
                  onFilterChange={el.onFilterChange}
                  placeholder={el.placeholder}
                  size="sm"
                  clearable={el.clearable}
                  loading={el.loading}
                  testId={el.testId}
                />
              </Wrapper>
            );

          case "date":
            return (
              <Wrapper key={i} width={el.width}>
                <DatePicker
                  name={el.name}
                  value={el.value}
                  disabled={el.disabled}
                  onChange={el.onChange}
                  placeholder={el.placeholder}
                  required={el.required}
                  size="sm"
                  color={el.color}
                  range={el.range}
                  testId={el.testId}
                />
              </Wrapper>
            );

          default:
            return (
              <Wrapper key={i} width={el.width}>
                <FormControl
                  type={el.type as DataTableFormControlType}
                  name={el.name}
                  value={el.value}
                  placeholder={el.placeholder}
                  disabled={el.disabled}
                  onChange={el.onChange}
                  options={el.options}
                  color={el.color}
                  variant={el.variant}
                  size="sm"
                  required={el.required}
                  readOnly={el.readOnly}
                  simple
                  loading={el.loading}
                  pattern={el.pattern}
                  text={el.text}
                  iconRight={el.iconRight}
                  testId={el.testId}
                />
              </Wrapper>
            );
        }
      })}
    </WrapperContainer>
  );
};

export default HeaderElementRenderer;
