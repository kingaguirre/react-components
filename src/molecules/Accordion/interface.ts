// src/molecules/Accordion/interface.ts
import React from 'react';
import { ColorType } from '../../common/interface';

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
  children: React.ReactNode;
  color?: ColorType;
  rightContent?: React.ReactNode;
  rightDetails?: AccordionItemDetail[];
  open?: boolean;
}

export interface AccordionProps {
  items: AccordionItemProps[];
  allowMultiple?: boolean;
}
