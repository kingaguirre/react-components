import React from "react";

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spacing?: number;
  style?: React.CSSProperties;
  /** Opt-in: show non-blocking warnings about non-GridItem children */
  debugWarnings?: boolean;
  /** Additional class names */
  className?: string;
}

export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  offset?: number;
  order?: number;
}
