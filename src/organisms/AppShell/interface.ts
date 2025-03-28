export interface HeaderIcon {
  icon: string;
  onClick: () => void;
}

export interface DropdownItem {
  label: string;
  onClick: () => void;
}

export interface SideMenuItem {
  id?: string;
  icon: string;
  title: string;
  children?: SideMenuItem[];
  onClick?: () => void;
}

export interface AppShellProps {
  title: string;
  name: string;
  logo: React.ReactNode;
  onToggle?: (sideMenuVisible: boolean) => void;
  rightIcons: HeaderIcon[];
  dropdownItems: DropdownItem[];
  sideMenuItems: SideMenuItem[];
  menuOverlay?: boolean;
  footerContent?: React.ReactNode;
  footerAlignment?: 'left' | 'center' | 'right';
  activeMenu?: string;
  children?: React.ReactNode;
  // New props for external control of the side menu:
  showMenu?: boolean;
  collapsedMenu?: boolean;
}
