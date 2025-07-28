import React, { useState, useEffect, useRef } from 'react'
import {
  Container,
  ContentWrapper,
  Header,
  HeaderWrapper,
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
  showMenu = false,
  collapsedMenu = true,
  profile,
  notifications,
  logo,
  logoMinimal,
  showFooter = true,
  onClickLogo,
  autoHideHeader = false,
  autoHideHeaderDelay = 3000,
}) => {
  const [menuVisible, setMenuVisible] = useState(showMenu)
  const [menuCollapsed, setMenuCollapsed] = useState(collapsedMenu)
  const [headerHidden, setHeaderHidden] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (autoHideHeader && !headerHidden) {
      const timer = setTimeout(() => {
        setHeaderHidden(true)
      }, autoHideHeaderDelay)
      return () => clearTimeout(timer)
    }
  }, [autoHideHeader, autoHideHeaderDelay])

  const toggleShowMenu = () => {
    setMenuVisible(!menuVisible)
    if (onToggle) {
      onToggle(!menuVisible)
    }
  }

  const closeMenu = () => {
    setMenuVisible(false)
    if (onToggle) {
      onToggle(false)
    }
  }

  const toggleCollapsedMenu = () => {
    setMenuCollapsed(!menuCollapsed)
  }

  const handleHeaderMouseEnter = () => {
    if (autoHideHeader) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      setHeaderHidden(false)
    }
  }

  const handleHeaderMouseLeave = () => {
    if (autoHideHeader) {
      hideTimerRef.current = setTimeout(() => {
        setHeaderHidden(true)
      }, autoHideHeaderDelay)
    }
  }

  return (
    <Container className='app-shell' data-testid='app-shell'>
      <HeaderWrapper
        className={headerHidden ? 'header-hidden' : 'header-visible'}
        $headerHidden={headerHidden}
        onMouseEnter={handleHeaderMouseEnter}
        onMouseLeave={handleHeaderMouseLeave}
        data-testid='header-wrapper'
      >
        <Header>
          <LeftSection>
            <Hamburger show={menuVisible} onClick={toggleShowMenu} />
            <AnimatedIconWrapper $show={menuVisible} onClick={onClickLogo}>
              <AnimatedIcon $show={menuVisible}>
                <img src={logo ?? _logo} alt='Logo' />
              </AnimatedIcon>
              <AnimatedIcon $show={!menuVisible}>
                <img src={logoMinimal ?? _logoMinimal} alt='Logo' />
              </AnimatedIcon>
            </AnimatedIconWrapper>
            <AnimatedText expanded={!menuVisible}>{pageTitle}</AnimatedText>
            <PageName title={pageName}>{pageName}</PageName>
          </LeftSection>
          <RightSection>
            <ProfileDropdown {...profile} />
            <NotificationDropdown {...notifications} />
            {rightIcons?.map((item, index) => (
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
      </HeaderWrapper>
      <ContentWrapper className='app-shell-content-wrapper'>
        <SideMenuContainer
          $visible={menuVisible}
          $collapsed={menuCollapsed}
          $overlay={menuOverlay}
          data-testid='app-shell-side-menu'
          className={menuCollapsed ? 'collapsed' : ''}
        >
          <SideMenuList $collapsed={menuCollapsed}>
            {sideMenuItems.map((item, index) => (
              <SideMenuItem
                key={item.id ?? index}
                item={item}
                delay={index * 0.05}
                activeMenu={activeMenu}
                menuCollapsed={menuCollapsed}
                onMenuItemClick={toggleShowMenu}
              />
            ))}
          </SideMenuList>
          <CollapseToggleContainer onClick={toggleCollapsedMenu}>
            <Icon icon={menuCollapsed ? 'arrow_forward' : 'arrow_back'} />
          </CollapseToggleContainer>
        </SideMenuContainer>
        <MainContent onClick={closeMenu} className='app-shell-main-content'>{children}</MainContent>
      </ContentWrapper>
      {showFooter && <Footer alignment={footerAlignment} content={footerContent} />}
    </Container>
  )
}
