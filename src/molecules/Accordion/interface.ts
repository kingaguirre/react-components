// src/molecules/Accordion/interface.ts
import React from "react";
import { ColorType } from "../../common/interface";

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
  disabled?: boolean;

  /** Called on every header click */
  onClick?: () => void;
  /** Called when this panel transitions from closed → open */
  onOpen?: () => void;
  /** Called when this panel transitions from open → closed */
  onClose?: () => void;
}

export interface AccordionProps {
  items: AccordionItemProps[];
  allowMultiple?: boolean;
}
