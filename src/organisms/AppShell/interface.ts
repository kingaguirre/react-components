import React from 'react'
import { ColorType } from 'src/common/interface'

export interface HeaderRightIcon {
  icon: string
  color?: ColorType
  colorShade?: string
  disabled?: boolean
  leftDivider?: boolean
  text?: string
  tooltip?: string
  onClick: () => void
}

export interface Profile {
  name: string
  userId?: string
  lastLoginTime?: string | Date
  lastProfileUpdate?: string | Date
  dropdownItems?: {
    icon: string
    text: string
    onItemClick: () => void
    active?: boolean
    disabled?: boolean
  }[]
  dropdownCustomContent?: React.ReactNode
}

export interface SideMenuItem {
  id: string
  icon: string
  title: string
  children?: SideMenuItem[]
  onClick?: () => void
}

export interface Notifications {
  notifications?: NotificationItem[]
  totalNewNotifications?: number
  showTotalCount?: boolean
  onShowAllClick?: () => void
  dropdownHeight?: string
}

export interface NotificationItem {
  id: string | number
  type?: 'default' | 'detailed'
  title?: string
  message: string
  messageContent?: React.ReactNode
  dateTime: string | Date
  imageUrl?: string
  name?: string
  email?: string
  isNew?: boolean
  onClick?: () => void
  icon?: string
  color?: ColorType
}

export interface AppShellProps {
  pageTitle: string
  pageName?: string
  logo?: string
  logoMinimal?: string
  onToggle?: (sideMenuVisible: boolean) => void
  rightIcons: HeaderRightIcon[]
  sideMenuItems: SideMenuItem[]
  profile: Profile
  notifications?: Notifications
  menuOverlay?: boolean
  activeMenu?: string
  children?: React.ReactNode
  showMenu?: boolean
  collapsedMenu?: boolean
  showFooter?: boolean
  footerContent?: React.ReactNode
  footerAlignment?: 'left' | 'center' | 'right'
  onClickLogo?: () => void
  autoHideHeader?: boolean
  autoHideHeaderDelay?: number
}
