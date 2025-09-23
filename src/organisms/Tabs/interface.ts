import { ColorType } from "../../common/interface";

export interface TabItemProps {
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: string;
  iconColor?: string;
  badgeValue?: number;
  badgeColor?: ColorType;
  color?: ColorType;
}

export type TabVariant = "default" | "pill";
export interface TabsProps {
  tabs: TabItemProps[];
  onTabChange?: (index: number) => void;
  activeTab?: number;
  firstLastNavControl?: boolean;
  fullHeader?: boolean;
  variant?: TabVariant;
}
