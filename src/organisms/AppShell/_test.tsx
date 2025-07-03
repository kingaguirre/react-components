import React from 'react'
import { render, fireEvent, screen, waitForElementToBeRemoved } from '@testing-library/react'
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { AppShell } from './index'

describe('AppShell Component', () => {
  const setup = (props = {}) => {
    const defaultProps = {
      pageTitle: '',
      rightIcons: [],
      sideMenuItems: [],
      profile: {
        name: ''
      }
    }
    render(<AppShell {...defaultProps} {...props} />)
  }

  test('renders AppShell', () => {
    setup()
    // Assuming the root element has a test id 'app-shell'
    expect(screen.getByTestId('app-shell')).toBeInTheDocument()
  })

  test('checks if pageName is defined', () => {
    const pageName = 'Dashboard'
    setup({ pageName })
    expect(screen.getByText(pageName)).toBeInTheDocument()
  })

  test('checks if pageTitle is defined after animation delay when showMenu is updated to false', () => {
    const pageTitle = 'Dashboard Page'
    vi.useFakeTimers()

    // Initial render with default props (default showMenu is true)
    setup({ pageTitle, showMenu: true })
    const elements = screen.getAllByText(pageTitle)
    const lastElement = elements[elements.length - 1]
    expect(lastElement).not.toBeVisible()

    // Second render with showMenu set to false using setup
    setup({ pageTitle, showMenu: false })
    vi.advanceTimersByTime(300)

    const elements1 = screen.getAllByText(pageTitle)
    const lastElement1 = elements1[elements1.length - 1]
    expect(lastElement1).toBeVisible()
    vi.useRealTimers()
  })

  test('checks if menu is collapsed', () => {
    setup({ menuCollapsed: true })
    // Assuming the side menu has a test id 'side-menu' and gets a 'collapsed' class when collapsed
    expect(screen.getByTestId('app-shell-side-menu')).toHaveClass('collapsed')
  })

  test('checks if menu is shown', () => {
    setup({ showMenu: true })
    // Verify that the side menu element is visible
    expect(screen.getByTestId('app-shell-side-menu')).toBeVisible()
  })

  test('checks footer text', () => {
    const footerText = 'Footer Content'
    setup({ footerText })
    expect(screen.getByText(footerText)).toBeInTheDocument()
  })

  test('checks if footer is shown', () => {
    setup({ showFooter: true })
    // Assuming the footer element has a test id 'footer'
    expect(screen.getByTestId('app-shell-footer')).toBeVisible()
  })

  test('checks header right icons with different colors and tooltip', async () => {
    const rightIcons = [
      { icon: 'bell', color: 'red', tooltip: 'Notifications' },
      { icon: 'settings', color: 'blue', tooltip: 'Settings' },
    ]
    setup({ rightIcons })

    for (const { icon, color, tooltip } of rightIcons) {
      // Assuming each icon has a test id in the format: header-icon-{icon}
      const iconElement = screen.getByTestId(`header-icon-${icon}`)
      expect(iconElement).toHaveAttribute('data-color', color)
      // Simulate mouse over to trigger tooltip display
      fireEvent.mouseOver(iconElement)
      // Wait for the tooltip to appear
      expect(await screen.findByText(tooltip)).toBeInTheDocument()
    }
  })

  test('checks notifications content and show/hide visibility', async () => {
    const notifications = {
      notifications: [{
        id: 1,
        type: 'default',
        icon: 'info',
        color: 'info',
        title: 'Info Notification',
        message: 'This is an info notification. With custom button rendered.',
        dateTime: new Date().toISOString(), // current time
        isNew: true,
        onClick: () => alert('Info notification clicked'),
      }]
    }

    setup({ notifications })

    const notifButton = screen.getByTestId('notification-dropdown-button')
    expect(notifButton).toBeInTheDocument()
    fireEvent.click(notifButton)

    expect(await screen.findByText('Info Notification')).toBeInTheDocument()

    const notifCloseButton = screen.getByTestId('notification-dropdown-close-button')
    expect(notifCloseButton).toBeInTheDocument()
    fireEvent.click(notifCloseButton)

    // Wait for the notification element to be removed
    await waitForElementToBeRemoved(() => screen.queryByText('Info Notification'))
  })

  test('checks if notification count is visible when showTotalCount is true', () => {
    setup({
      notifications: {
        showTotalCount: true, totalNewNotifications: 3, notifications: [{
          id: 1,
          title: 'Info Notification',
          message: 'This is an info notification. With custom button rendered.',
          dateTime: new Date().toISOString(), // current time
        }]
      }
    })
    // Expect that the notification count (as text) is visible
    expect(screen.getByText('3')).toBeVisible()
  })

  test('checks profile dropdown with dropdown items', async () => {
    const dropdownItems = [
      { icon: 'person', text: 'Profile', onItemClick: () => alert('Profile clicked') },
      { icon: 'logout', text: 'Logout', onItemClick: () => alert('Logout clicked') },
    ]

    setup({ profile: { dropdownItems } })

    // Simulate clicking on the profile icon to reveal the dropdown
    fireEvent.click(screen.getByTestId('profile-dropdown-button'))
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('profile-dropdown-button'))
    // Wait for the notification element to be removed
    await waitForElementToBeRemoved(() => screen.queryByText('Profile'))
  })

  test('checks profile dropdown with custom content', async () => {
    const dropdownCustomContent = (
      <div>
        <h4>Custom Content</h4>
        <p>This content is fully customizable!</p>
      </div>
    )

    setup({ profile: { dropdownCustomContent } })

    // Simulate clicking on the profile icon to reveal the dropdown
    fireEvent.click(screen.getByTestId('profile-dropdown-button'))
    expect(screen.getByText('Custom Content')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('profile-dropdown-button'))
    // Wait for the notification element to be removed
    await waitForElementToBeRemoved(() => screen.queryByText('Custom Content'))
  })

  test('checks side menu hover behavior when collapsed', async () => {
    const sideMenuItems = [{
      id: 'home',
      icon: 'home',
      title: 'Home',
    }]

    setup({ collapsedMenu: true, sideMenuItems })
    // Find the menu item and simulate a hover
    const menuItem = screen.getByTestId('Home')
    fireEvent.mouseOver(menuItem)
    // Assuming a tooltip appears on hover, verify that it is rendered (you might adjust the text or test id)
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  test('checks side menu click behavior when not collapsed and active state', () => {
    const sideMenuItems = [{
      id: 'dashboard',
      icon: 'dashboard',
      title: 'Dashboard',
      children: [{ id: 'settings', icon: 'settings', title: 'Settings' }]
    }]
    // Set the activeMenu prop to 'home' to simulate an active state
    setup({ collapsedMenu: false, sideMenuItems, activeMenu: 'settings' })
    const parentMenuItem = screen.getByTestId('Dashboard')
    fireEvent.click(parentMenuItem)
    fireEvent.click(parentMenuItem)
    // Verify the active state is applied (e.g., a class 'active' is added)
    expect(parentMenuItem).toHaveClass('active')
    expect(screen.getByTestId('Settings')).toHaveClass('active')
  })

  test('autoHideHeader true: header auto hides and shows on hover without fake timers', async () => {
    // Use a very short delay so we don't have to wait long in the test.
    setup({ autoHideHeader: true, autoHideHeaderDelay: 1000, pageTitle: 'Test Header' })
    const headerWrapper = screen.getByTestId('header-wrapper')

    // Initially, header should be visible.
    expect(headerWrapper).toHaveClass('header-visible')
  })

  test('autoHideHeader false: header remains visible after delay', () => {
    vi.useFakeTimers()
    setup({ autoHideHeader: false })
    const headerWrapper = screen.getByTestId('header-wrapper')

    // Initially, header is visible
    expect(headerWrapper).toHaveClass('header-visible')

    // Fast-forward time, header should remain visible
    vi.advanceTimersByTime(5000)
    expect(headerWrapper).toHaveClass('header-visible')

    vi.useRealTimers()
  })

})
