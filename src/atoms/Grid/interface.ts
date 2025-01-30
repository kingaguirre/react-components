export interface GridProps {
  children: React.ReactNode;
  spacing?: number;
}

export interface GridItemProps {
  children: React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  offset?: number; // Added offset property
  order?: number; // Added order property
}
