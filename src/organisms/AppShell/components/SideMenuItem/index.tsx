import React, { useState, useRef, useEffect } from 'react'
import { SideMenuItem as ISideMenuItem } from '../../interface'
import {
  SideMenuItemContainer,
  MenuItemContent,
  MenuItemWrapper,
  MenuItemTitle,
  ArrowIconWrapper,
  FloatingSubMenu,
  FloatingHeader,
  SideMenuList,
} from './styled'
import { Icon } from 'src/atoms/Icon'

interface SideMenuItemProps {
  item: ISideMenuItem
  activeMenu?: string
  menuCollapsed: boolean
  floating?: boolean
  delay?: number
  level?: number
  onMenuItemClick?: () => void
}

export const SideMenuItem: React.FC<SideMenuItemProps> = ({
  item,
  activeMenu,
  menuCollapsed,
  floating = false,
  delay = 0,
  level = 0,
  onMenuItemClick,
}) => {
  // Helper function to check active status recursively
  const checkActive = (item: ISideMenuItem): boolean => {
    if (item.id && item.id === activeMenu) return true
    if (item.children) {
      return item.children.some(child => checkActive(child))
    }
    return false
  }
  const isActive = checkActive(item)

  // In expanded mode, default to open if active; otherwise, false.
  const [open, setOpen] = useState(() => (!menuCollapsed ? isActive : false))
  const [hovered, setHovered] = useState(false)
  const [showSubMenu, setShowSubMenu] = useState(false)
  const hideTimeoutRef = useRef<number | null>(null)

  // Update open state when menuCollapsed changes.
  useEffect(() => {
    if (!menuCollapsed) {
      setOpen(isActive)
    }
  }, [menuCollapsed, isActive])

  const handleTrigger = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!menuCollapsed && item.children) {
      setOpen(prev => !prev)
    } else {
      if (item.onClick) {
        item.onClick()
      }
      onMenuItemClick?.()
    }
  }

  const handleMouseEnter = () => {
    // Cancel any pending hide timer
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    setHovered(true)
    if (menuCollapsed) {
      // If the submenu is not already rendered, render it first.
      if (!showSubMenu) {
        setShowSubMenu(true)
        // Delay updating the open state to allow the submenu to mount
        setTimeout(() => {
          setOpen(true)
        }, 10)
      } else {
        setOpen(true)
      }
    }
  }

  const handleMouseLeave = (e: React.MouseEvent) => {
    // If the new target is inside the current container, do nothing.
    if (e.currentTarget.contains(e.relatedTarget as Node)) return

    if (menuCollapsed) {
      // If moving into another menu item, hide immediately.
      const relatedMenuItem = (e.relatedTarget as HTMLElement)?.closest('.side-menu-item')
      if (relatedMenuItem) {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current)
          hideTimeoutRef.current = null
        }
        setOpen(false)
        setShowSubMenu(false)
      } else {
        // Otherwise, apply a delay before hiding.
        hideTimeoutRef.current = window.setTimeout(() => {
          setOpen(false)
          // Wait for exit animation to complete (300ms) before removing from DOM.
          setTimeout(() => {
            setShowSubMenu(false)
          }, 300)
        }, 300)
      }
    }
  }

  return (
    <SideMenuItemContainer
      className={`side-menu-item ${isActive ? 'active' : ''} ${menuCollapsed ? 'collapsed' : ''}`}
      onClick={handleTrigger}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      $sideMenuCollapsed={menuCollapsed}
      style={{ animationDelay: `${delay + 0.1}s` }}
      $active={isActive}
      data-testid={item.title}
    >
      <MenuItemContent>
        <MenuItemWrapper className={`${isActive ? 'active' : ''} ${item.children ? 'has-child' : ''} ${menuCollapsed ? 'collapsed' : ''}`}>
          {item?.icon && <Icon icon={item.icon} />}
          {menuCollapsed ? (
            (hovered || floating) && (
              (item.children || floating) ? (
                <MenuItemTitle>{item.title}</MenuItemTitle>
              ) : (
                <FloatingSubMenu $open={open}>
                  <FloatingHeader>{item.title}</FloatingHeader>
                </FloatingSubMenu>
              )
            )
          ) : (
            <MenuItemTitle>{item.title}</MenuItemTitle>
          )}
          {item.children && (
            <ArrowIconWrapper className={menuCollapsed ? 'collapsed' : ''}>
              <Icon icon={menuCollapsed ? 'keyboard_arrow_right' : 'keyboard_arrow_down'} />
            </ArrowIconWrapper>
          )}
        </MenuItemWrapper>
      </MenuItemContent>
      {item.children && (
        menuCollapsed ? (
          showSubMenu && (
            <FloatingSubMenu $open={open}>
              <FloatingHeader>{item.title}</FloatingHeader>
              <SideMenuList $isSubMenu>
                {item.children.map((child, index) => (
                  <SideMenuItem
                    key={child.id || index}
                    item={child}
                    floating={true}
                    delay={index * 0.05}
                    level={level + 1}
                    activeMenu={activeMenu}
                    menuCollapsed={menuCollapsed}
                    onMenuItemClick={onMenuItemClick}
                  />
                ))}
              </SideMenuList>
            </FloatingSubMenu>
          )
        ) : (
          open && (
            <SideMenuList $isSubMenu>
              {item.children.map((child, index) => (
                <SideMenuItem
                  key={child.id || index}
                  item={child}
                  delay={index * 0.05}
                  level={level + 1}
                  activeMenu={activeMenu}
                  menuCollapsed={menuCollapsed}
                  onMenuItemClick={onMenuItemClick}
                />
              ))}
            </SideMenuList>
          )
        )
      )}
    </SideMenuItemContainer>
  )
}
