import type React from "react";
import type { ColorType } from "../../common/interface";

export interface IChildNode {
  id: string;
  title: string;
  isSelected?: boolean;
  value?: number; // If 'value' is defined, 'icon' is ignored
  valueColor?: string;
  icon?: string;
  iconColor?: string;
  textColor?: string;
  disabled?: boolean;
}

export interface INode {
  id: string;
  title: string;
  isSelected?: boolean;
  icon?: string;
  iconColor?: string;
  textColor?: string;
  childNodes?: IChildNode[];
  disabled?: boolean;
  badgeValue?: number;
  badgeColor?: ColorType; // maps to <Badge color>
  badgeOutlined?: boolean; // maps to <Badge outlined>
  // Optional action when the parent icon is clicked
  iconClick?: (item: INode, e: React.MouseEvent) => void;
}

export type MenuItemClickPayload = { id: string; parent?: { id: string } };

export interface SideMenuProps {
  data?: INode[] | null;
  disabled?: boolean;
  noItemsText?: string;
  width?: string; // max width
  selectedItem?: string; // controlled
  selectedChildItem?: string; // controlled
  onMenuItemClick?: (payload: MenuItemClickPayload) => void;
  className?: string;
  style?: React.CSSProperties;
}
