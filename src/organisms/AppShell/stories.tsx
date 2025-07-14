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
        <div style={{ backgroundColor: '#fff' }}>
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
        "id": "dashboard",
        "title": "Executive Dashboard",
        "icon": "dashboard",
        "badge": { "value": 5 },
        onClick: () => alert('Dashboard clicked'),
      },
      {
        "id": "analytics",
        "title": "Performance Analytics",
        "icon": "bar_chart",
        "badge": { "icon": "insights", "color": "primary" },
        onClick: () => alert('Analytics clicked'),
        "children": [
          {
            "id": "user-trends",
            "title": "User Trends",
            "icon": "trending_up",
            "badge": { "value": 3 },
            "children": [
              {
                "id": "daily-active",
                "title": "Daily Active Users",
                "icon": "today"
              },
              {
                "id": "user-demographics",
                "title": "Demographics Breakdown",
                "icon": "supervised_user_circle",
                "badge": { "icon": "group", "color": "success" },
                "children": [
                  {
                    "id": "age-groups",
                    "title": "By Age Group",
                    "badge": { "value": 2 }
                  },
                  {
                    "id": "geography",
                    "title": "By Geography",
                    "badge": { "icon": "public" }
                  }
                ]
              }
            ]
          },
          {
            "id": "revenue",
            "title": "Revenue Streams",
            "icon": "attach_money",
            "children": [
              {
                "id": "subscription-rev",
                "title": "Subscription Revenue",
                "icon": "repeat",
                "badge": { "value": 7, "color": "warning" },
                "children": [
                  {
                    "id": "monthly-sub",
                    "title": "Monthly Subscriptions"
                  },
                  {
                    "id": "annual-sub",
                    "title": "Annual Subscriptions",
                  }
                ]
              },
              {
                "id": "one-time-purchases",
                "title": "One-Time Purchases",
                "icon": "add_shopping_cart",
                "badge": { "value": 1 }
              },
              {
                "id": "revenue-forecast",
                "title": "Forecast & Projections",
                "icon": "show_chart",
              }
            ]
          }
        ]
      },
      {
        "id": "settings",
        "title": "System Settings",
        "icon": "settings",
        "badge": { "icon": "new_releases", "color": "success" },
        "children": [
          {
            "id": "user-management",
            "title": "User Management",
            "icon": "supervisor_account",
            "children": [
              {
                "id": "roles-permissions",
                "title": "Roles & Permissions",
                "icon": "security",
                "badge": { "value": 4 },
                "children": [
                  {
                    "id": "add-role",
                    "title": "Add New Role"
                  },
                  {
                    "id": "edit-roles",
                    "title": "Edit Existing Roles",
                    "badge": { "icon": "edit", "color": "primary" }
                  }
                ]
              },
              {
                "id": "account-settings",
                "title": "Account Settings",
                "icon": "account_circle"
              }
            ]
          },
          {
            "id": "system-preferences",
            "title": "Preferences",
            "icon": "tune",
            "badge": { "value": 2, "color": "secondary" }
          }
        ]
      }
    ],
    notifications: {
      notifications: [{
        id: 1,
        title: 'Info Notification',
        message: 'This is an info notification. With custom button rendered.',
        dateTime: new Date().toISOString(), // current time
      }],
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

