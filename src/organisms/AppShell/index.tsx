import React, { useState } from 'react'
import {
  Container,
  ContentWrapper,
  Header,
  LeftSection,
  RightSection,
  IconButton,
  PageName,
  SideMenuContainer,
  CollapseToggleContainer,
  MainContent,
  AnimatedIconWrapper,
  AnimatedIcon,
} from './styled'
import { AppShellProps } from './interface'
import { Icon } from '../../atoms/Icon'
import { Tooltip } from '../../atoms/Tooltip'
import _logo from './logo/logo.svg'
import _logoMinimal from './logo/logo-minimal.svg'
import { ProfileDropdown } from './components/ProfileDropdown'
import { NotificationDropdown } from './components/NotificationDropdown'
import { SideMenuItem } from './components/SideMenuItem'
import { SideMenuList } from './components/SideMenuItem/styled'
import { Hamburger } from './components/Hamburger'
import { AnimatedText } from './components/AnimatedText'
import { Footer } from './components/Footer'

export const AppShell: React.FC<AppShellProps> = ({
  pageTitle = 'Module',
  pageName,
  onToggle,
  rightIcons,
  sideMenuItems,
  menuOverlay = true,
  footerContent,
  footerAlignment = 'left',
  activeMenu,
  children,
  showMenu = true,
  collapsedMenu = true,
  profile,
  notifications,
  logo,
  logoMinimal,
  showFooter = true,
  onClickLogo
}) => {
  const [menuVisible, setMenuVisible] = useState(showMenu)
  const [menuCollapsed, setMenuCollapsed] = useState(collapsedMenu)

  const toggleShowMenu = () => {
    setMenuVisible(!menuVisible)
    if (onToggle) {
      onToggle(!menuVisible)
    }
  }

  const toggleCollapsedMenu = () => {
    setMenuCollapsed(!menuCollapsed)
  }

  return (
    <Container className='app-shell' data-testid='app-shell'>
      <Header>
        <LeftSection>
          <Hamburger show={menuVisible} onClick={toggleShowMenu}/>
          <AnimatedIconWrapper $show={menuVisible} onClick={onClickLogo}>
            <AnimatedIcon $show={menuVisible}>
              <img src={logo ?? _logo} alt='Logo' />
            </AnimatedIcon>
            <AnimatedIcon $show={!menuVisible}>
              <img src={logoMinimal ?? _logoMinimal} alt='Logo' />
            </AnimatedIcon>
          </AnimatedIconWrapper>
          <AnimatedText expanded={!menuVisible}>{pageTitle}</AnimatedText>
          <PageName>{pageName}</PageName>
        </LeftSection>
        <RightSection>
          <ProfileDropdown {...profile} />
          <NotificationDropdown {...notifications} />
          {rightIcons.map((item, index) => (
            <Tooltip key={index} type='title' content={item?.tooltip}>
              <IconButton
                onClick={() => !item.disabled && item.onClick()}
                disabled={item.disabled}
                $leftDivider={item.leftDivider}
                $color={item.color}
                $colorShade={item.colorShade}
                data-testid={`header-icon-${item.icon}`}
                data-color={item.color}
              >
                {item.text && <span className='text'>{item.text}</span>}
                <Icon icon={item.icon} />
              </IconButton>
            </Tooltip>
          ))}
        </RightSection>
      </Header>
      <ContentWrapper>
        <SideMenuContainer
          $visible={menuVisible}
          $collapsed={menuCollapsed}
          $overlay={menuOverlay}
          data-testid='app-shell-side-menu'
          className={menuCollapsed ? 'collapsed' : ''}
        >
          <SideMenuList>
            {sideMenuItems.map((item, index) => (
              <SideMenuItem
                key={item.id ?? index}
                item={item}
                delay={index * 0.05}
                activeMenu={activeMenu}
                menuCollapsed={menuCollapsed}
              />
            ))}
          </SideMenuList>
          <CollapseToggleContainer onClick={toggleCollapsedMenu}>
            <Icon icon={menuCollapsed ? 'arrow_forward' : 'arrow_back'} />
          </CollapseToggleContainer>
        </SideMenuContainer>
        <MainContent>{children}</MainContent>
      </ContentWrapper>
      {showFooter && <Footer alignment={footerAlignment} content={footerContent}/>}
    </Container>
  )
}
