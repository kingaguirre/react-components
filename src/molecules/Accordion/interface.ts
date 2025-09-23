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
  id?: string; // stable key per item; falls back to index if missing
  title: string;
  children: React.ReactNode;
  color?: ColorType;
  rightContent?: React.ReactNode;
  rightDetails?: AccordionItemDetail[];
  open?: boolean; // initial open (uncontrolled) – preserved for back-compat
  disabled?: boolean;

  /** Called on every header click */
  onClick?: (e?: React.MouseEvent, id?: string) => void;
  /** Called when this panel transitions from closed → open */
  onOpen?: (e?: React.MouseEvent, id?: string) => void;
  /** Called when this panel transitions from open → closed */
  onClose?: (e?: React.MouseEvent, id?: string) => void;
}

/** Optional controlled API (if provided, component becomes controlled) */
export interface AccordionControlledProps {
  /**
   * When provided, Accordion is controlled. Keys must match item.id (or index string if id is omitted).
   */
  activeKeys?: string[];
  /** Called with the next keys when user toggles headers (controlled mode). */
  onActiveKeysChange?: (keys: string[]) => void;

  /**
   * Uncontrolled initial state. If omitted, falls back to items[i].open.
   * Ignored when `activeKeys` is provided.
   */
  defaultOpenKeys?: string[];

  /**
   * These keys are always rendered open (cannot be closed by user).
   * Useful to force-open sections that contain errors or focused fields.
   */
  forcedOpenKeys?: string[];
}

export interface AccordionProps extends AccordionControlledProps {
  items: AccordionItemProps[];
  /** If false (default), behaves like a single-open accordion. */
  allowMultiple?: boolean;
}
