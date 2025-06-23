// src/organisms/AppShell/stories.tsx
import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { AppShell } from './index'
import { NOTIFICATIONS } from './data'

const descriptionText =
  'The AppShell component provides a layout with a full‑width header, a side menu under the header, and a footer. The side menu supports up to 3 levels of sub‑menus, collapsible behavior with floating labels on hover, and arrow icons for items with children.'

const meta: Meta<typeof AppShell> = {
  title: 'Organisms/AppShell',
  component: AppShell,
  parameters: {
    docs: {
      description: {
        component: descriptionText,
      },
    },
  },
  argTypes: {
    pageTitle: { control: 'text' },
    logo: { table: { disable: true } },
    rightIcons: { table: { disable: true } },
    sideMenuItems: { table: { disable: true } },
    profile: { table: { disable: true } },
    notifications: { table: { disable: true } },
    showFooter: { control: 'boolean' },
    showMenu: { control: 'boolean' },
    collapsedMenu: { control: 'boolean' },
    menuOverlay: { control: 'boolean' },
  },
}

export default meta

export const Default: StoryObj<typeof meta> = {
  args: {
    pageTitle: 'module',
    pageName: 'Page Name',
    showFooter: true,
    menuOverlay: true,
    // logo: '', // should be string src for img
    // logoMinimal: '', // should be string src for img
    footerContent: 'Copyright @ 2020 Standard Chartered Bank | TradeXpress',
    // footerAlignment: 'right',
    activeMenu: 'sub-a2',
    rightIcons: [
      {
        icon: 'settings',
        onClick: () => alert('Settings clicked'),
        leftDivider: true,
        tooltip: 'Settings',
        colorShade: 'darker'
      },
      {
        icon: 'refresh',
        onClick: () => alert('Refresh clicked'),
        disabled: true,
        tooltip: 'Refresh and Disabled'
      },
      {
        icon: 'info_outline',
        onClick: () => alert('Info clicked'),
        color: 'warning',
        tooltip: 'Info'
      },
      {
        icon: 'logout',
        onClick: () => alert('Logout clicked'),
        color: 'primary',
        colorShade: 'darker',
        leftDivider: true,
        text: 'Logout',
      },
    ],
    profile: {
      name: 'Emmanuel Aguirre',
      userId: '1616610',
      lastLoginTime: '2024-02-20T10:25:24',
      lastProfileUpdate: '10-05-2024',
      dropdownCustomContent: (
        <div style={{ backgroundColor: '#fff'}}>
          <h4>Custom Content</h4>
          <p>This content is fully customizable!</p>
        </div>
      ),
      // If plan to use dropdown items instead of custom content, dropdownItems is available.
      // dropdownItems: [
      //   { icon: 'person', text: 'Profile', onItemClick: () => alert('Profile clicked') },
      //   { icon: 'logout', text: 'Logout', onItemClick: () => alert('Logout clicked') },
      // ],
    },
    sideMenuItems: [
      {
        id: 'home',
        icon: 'home',
        title: 'Home',
        onClick: () => alert('Home clicked'),
      },
      {
        id: 'projects',
        icon: 'folder',
        title: 'Projects',
        children: [
          {
            id: 'proj-a',
            icon: 'upload_file',
            title: 'Project A',
            children: [
              {
                id: 'sub-a1',
                icon: 'upload_file',
                title: 'Subproject A1',
                onClick: () => alert('Subproject A1 clicked'),
              },
              {
                id: 'sub-a2',
                icon: 'upload_file',
                title: 'Subproject A2',
                onClick: () => alert('Subproject A2 clicked'),
              },
            ],
          },
          {
            id: 'proj-b',
            icon: 'upload_file',
            title: 'Project B',
            onClick: () => alert('Project B clicked'),
          },
        ],
      },
      {
        id: 'settings',
        icon: 'settings',
        title: 'Settings',
        onClick: () => alert('Settings clicked'),
      },
    ],
    notifications: {
      notifications: NOTIFICATIONS,
      // showTotalCount: false,
      totalNewNotifications: 3,
      onShowAllClick: () => alert('Show all notifications clicked'),
    },
    children: (
      <div style={{ padding: '1rem' }}>
        <h2>Main Content</h2>
        <p>This is an example of the main content area within the AppShell layout.</p>
      </div>
    ),
    // autoHideHeader: true,
    // showMenu: true,
    // collapsedMenu: false,
  },
  tags: ['!dev'],
}

