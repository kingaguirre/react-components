// src/molecules/Accordion/interface.ts
import { ReactNode } from 'react';

export interface AccordionItemDetail {
  value?: string;
  icon?: string;
  text?: string;
  color?: "primary" | "success" | "warning" | "danger" | "info" | "default";
  iconColor?: "primary" | "success" | "warning" | "danger" | "info" | "default" | string;
  valueColor?: "primary" | "success" | "warning" | "danger" | "info" | "default" | string;
  textColor?: "primary" | "success" | "warning" | "danger" | "info" | "default" | string;
  onClick?: () => void;
}

export interface AccordionItemProps {
  id?: string;
  title: string;
  children: ReactNode;
  color?: "primary" | "success" | "warning" | "danger" | "info" | "default";
  rightContent?: ReactNode;
  rightDetails?: AccordionItemDetail[];
  open?: boolean;
}

export interface AccordionProps {
  items: AccordionItemProps[];
  allowMultiple?: boolean;
}
