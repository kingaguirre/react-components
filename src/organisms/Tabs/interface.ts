export interface TabItemProps {
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: string;
  iconColor?: string;
  badgeValue?: number;
  badgeColor?: "primary" | "success" | "warning" | "danger" | "info" | "default";
  color?: "primary" | "success" | "info" | "warning" | "danger" | "default";
}

export interface TabsProps {
  tabs: TabItemProps[];
  onTabChange?: (index: number) => void;
  activeTab?: number;
  firstLastNavControl?: boolean;
  fullHeader?: boolean;
}
