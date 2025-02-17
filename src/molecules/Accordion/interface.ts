// src/molecules/Accordion/interface.ts
import { ReactNode } from 'react';
import { ColorType } from '@common/interfaces';

export interface AccordionItemDetail {
  value?: string;
  icon?: string;
  text?: string;
  color?: ColorType;
  iconColor?: ColorType;
  valueColor?: ColorType;
  textColor?: ColorType;
  onClick?: () => void;
}

export interface AccordionItemProps {
  id?: string;
  title: string;
  children: ReactNode;
  color?: ColorType;
  rightContent?: ReactNode;
  rightDetails?: AccordionItemDetail[];
  open?: boolean;
}

export interface AccordionProps {
  items: AccordionItemProps[];
  allowMultiple?: boolean;
}
