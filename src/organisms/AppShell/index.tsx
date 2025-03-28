import React, { useState } from 'react';
import {
  Container,
  ContentWrapper,
  Header,
  LeftSection,
  RightSection,
  IconButton,
  Title,
  Name,
  DropdownMenu,
  DropdownItem as StyledDropdownItem,
  SideMenuContainer,
  SideMenuList,
  SideMenuItemContainer,
  CollapseToggleContainer,
  MainContent,
  Footer,
  FloatingSubMenu,
  MenuItemContent,
  MenuItemTitle,
  ArrowIconWrapper,
  FloatingHeader,
  AnimatedIconWrapper,
  AnimatedIcon,
} from './styled';
import { AppShellProps, SideMenuItem } from './interface';
import { Icon } from '../../atoms/Icon';
import logo from './logo/logo.svg';
import logoFull from './logo/logo-full.svg';

interface SideMenuItemComponentProps {
  item: SideMenuItem;
  floating?: boolean;
  delay?: number;
  level?: number;
}

const AppShell: React.FC<AppShellProps> = ({
  title,
  name,
  onToggle,
  rightIcons,
  dropdownItems,
  sideMenuItems,
  menuOverlay = true,
  footerContent,
  footerAlignment = 'left',
  activeMenu,
  children,
  showMenu,      // external control for menu visibility
  collapsedMenu = true, // external control for collapsed state
}) => {
  const [menuVisible, setMenuVisible] = useState(showMenu ?? true);
  const [menuCollapsed, setMenuCollapsed] = useState(collapsedMenu ?? false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleShowMenu = () => {
    setMenuVisible(!menuVisible);
    if (onToggle) {
      onToggle(!menuVisible);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleCollapsedMenu = () => {
    setMenuCollapsed(!menuCollapsed);
  };

  // Helper function to check if an item (or any of its children) is active
  const checkActive = (item: SideMenuItem): boolean => {
    if (item.id && item.id === activeMenu) return true;
    if (item.children) {
      return item.children.some(child => checkActive(child));
    }
    return false;
  };

  const SideMenuItemComponent: React.FC<SideMenuItemComponentProps> = ({
    item,
    floating = false,
    delay = 0,
    level = 0,
  }) => {
    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState(false);
    const isActive = checkActive(item);

    const handleTrigger = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!menuCollapsed && item.children) {
        setOpen(!open);
      }
      if (item.onClick) {
        item.onClick();
      }
    };

    const handleMouseEnter = () => {
      setHovered(true);
      if (menuCollapsed && item.children) {
        setOpen(true);
      }
    };

    const handleMouseLeave = () => {
      setHovered(false);
      if (menuCollapsed && item.children) {
        setOpen(false);
      }
    };

    return (
      <SideMenuItemContainer
        onClick={handleTrigger}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        $active={isActive}
        $sideMenuCollapsed={menuCollapsed}
        style={{animationDelay: `${delay + .1}s`}}
      >
        <MenuItemContent>
          <Icon icon={item.icon} />
          {menuCollapsed ? (
            (hovered || floating) && (
              (item.children || floating) ? (
                <MenuItemTitle>{item.title}</MenuItemTitle>
              ) : (
                <FloatingSubMenu>
                  <FloatingHeader>{item.title}</FloatingHeader>
                </FloatingSubMenu>
              )
            )
          ) : (
            <MenuItemTitle>{item.title}</MenuItemTitle>
          )}
          {item.children && (
            <ArrowIconWrapper>
              <Icon icon={menuCollapsed ? 'keyboard_arrow_right' : 'keyboard_arrow_down'} />
            </ArrowIconWrapper>
          )}
        </MenuItemContent>
        {item.children && open && (
          menuCollapsed ? (
            <FloatingSubMenu
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
            >
              <FloatingHeader>{item.title}</FloatingHeader>
              <SideMenuList>
                {item.children.map((child, index) => (
                  <SideMenuItemComponent
                    key={child.id || index}
                    item={child}
                    floating={true}
                    delay={index * 0.05}
                    level={level + 1}
                  />
                ))}
              </SideMenuList>
            </FloatingSubMenu>
          ) : (
            <SideMenuList>
              {item.children.map((child, index) => (
                <SideMenuItemComponent
                  key={child.id || index}
                  item={child}
                  delay={index * 0.05}
                  level={level + 1}
                />
              ))}
            </SideMenuList>
          )
        )}
      </SideMenuItemContainer>
    );
  };

  return (
    <Container>
      <Header>
        <LeftSection>
          <IconButton data-testid="toggle-button" onClick={toggleShowMenu}>
            <Icon icon={menuVisible ? 'clear' : 'menu'} />
          </IconButton>
          {/* Animated logo transition */}
          <AnimatedIconWrapper>
            <AnimatedIcon $show={menuVisible}>
              <img src={logoFull} alt="Logo Full" />
            </AnimatedIcon>
            <AnimatedIcon $show={!menuVisible}>
              <img src={logo} alt="Logo" />
            </AnimatedIcon>
          </AnimatedIconWrapper>
          <Title>{title}</Title>
        </LeftSection>
        <RightSection>
          <Name>{name}</Name>
          <IconButton data-testid="dropdown-button" onClick={toggleDropdown}>
            <Icon icon="keyboard_arrow_down" />
          </IconButton>
          {dropdownOpen && (
            <DropdownMenu>
              {dropdownItems.map((item, index) => (
                <StyledDropdownItem key={index} onClick={item.onClick}>
                  {item.label}
                </StyledDropdownItem>
              ))}
            </DropdownMenu>
          )}
          {rightIcons.map((icon, index) => (
            <IconButton key={index} onClick={icon.onClick}>
              <Icon icon={icon.icon} />
            </IconButton>
          ))}
        </RightSection>
      </Header>
      <ContentWrapper>
        <SideMenuContainer
          $visible={menuVisible}
          $collapsed={menuCollapsed}
          $overlay={menuOverlay}
        >
          <SideMenuList>
            {sideMenuItems.map((item, index) => (
              <SideMenuItemComponent key={item.id || index} item={item} delay={index * 0.05} />
            ))}
          </SideMenuList>
          <CollapseToggleContainer onClick={toggleCollapsedMenu}>
            {menuCollapsed ? (
              <Icon icon="arrow_forward" />
            ) : (
              <Icon icon="arrow_back" />
            )}
          </CollapseToggleContainer>
        </SideMenuContainer>
        <MainContent>{children}</MainContent>
      </ContentWrapper>
      <Footer $alignment={footerAlignment}>
        {footerContent || 'Footer Content'}
      </Footer>
    </Container>
  );
};

export default AppShell;
