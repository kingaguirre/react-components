// src/molecules/Accordion/interface.ts
import { ReactNode } from 'react';

export interface AccordionItemDetail {
  value?: string;
  icon?: string;
  text?: string;
  color?: "primary" | "success" | "warning" | "danger" | "info" | "default";
  iconColor?: "primary" | "success" | "warning" | "danger" | "info" | "default";
  valueColor?: "primary" | "success" | "warning" | "danger" | "info" | "default";
  textColor?: "primary" | "success" | "warning" | "danger" | "info" | "default";
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
