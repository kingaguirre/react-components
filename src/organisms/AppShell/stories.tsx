// src/components/AppShell/stories.tsx
import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import AppShell from './index'
import type { AppShellProps } from './interface'
import { StoryWrapper, Title } from '../../components/StoryWrapper'
import { Grid, GridItem } from '../../atoms/Grid'

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
    title: { control: 'text' },
    name: { control: 'text' },
    rightIcons: { table: { disable: true } },
    dropdownItems: { table: { disable: true } },
    sideMenuItems: { table: { disable: true } },
    logo: { table: { disable: true } },
  },
}

export default meta

export const Default: StoryObj<typeof meta> = {
  args: {
    title: 'My App',
    name: 'John Doe',
    logo: <span style={{ fontWeight: 'bold' }}>LOGO</span>,
    rightIcons: [
      { icon: 'icon-bell', onClick: () => alert('Notification clicked') },
      { icon: 'icon-settings', onClick: () => alert('Settings clicked') },
    ],
    dropdownItems: [
      { label: 'Profile', onClick: () => alert('Profile clicked') },
      { label: 'Logout', onClick: () => alert('Logout clicked') },
    ],
    sideMenuItems: [
      {
        icon: 'icon-home',
        title: 'Home',
        onClick: () => alert('Home clicked'),
      },
      {
        icon: 'icon-folder',
        title: 'Projects',
        children: [
          {
            icon: 'icon-file',
            title: 'Project A',
            children: [
              {
                icon: 'icon-file',
                title: 'Subproject A1',
                onClick: () => alert('Subproject A1 clicked'),
              },
              {
                icon: 'icon-file',
                title: 'Subproject A2',
                onClick: () => alert('Subproject A2 clicked'),
              },
            ],
          },
          {
            icon: 'icon-file',
            title: 'Project B',
            onClick: () => alert('Project B clicked'),
          },
        ],
      },
      {
        icon: 'icon-settings',
        title: 'Settings',
        onClick: () => alert('Settings clicked'),
      },
    ],
    children: (
      <div style={{ padding: '1rem' }}>
        <h2>Main Content</h2>
        <p>This is an example of the main content area within the AppShell layout.</p>
      </div>
    ),
  },
  tags: ['!dev'],
}

export const Examples: StoryObj<typeof meta> = {
  tags: ['!autodocs'],
  render: () => (
    <StoryWrapper title="AppShell Examples" subTitle={descriptionText}>
      <Title>Default AppShell</Title>
      <Grid>
        <GridItem xs={12}>
          <AppShell
            title="Dashboard"
            name="Alice"
            logo={<span style={{ fontWeight: 'bold' }}>LOGO</span>}
            rightIcons={[
              { icon: 'notifications_none', onClick: () => alert('Notification clicked') },
              { icon: 'settings', onClick: () => alert('Settings clicked') },
            ]}
            dropdownItems={[
              { label: 'Profile', onClick: () => alert('Profile clicked') },
              { label: 'Logout', onClick: () => alert('Logout clicked') },
            ]}
            sideMenuItems={[
              {
                icon: 'home',
                title: 'Home',
                onClick: () => alert('Home clicked'),
              },
              {
                icon: 'folder',
                title: 'Projects',
                children: [
                  {
                    icon: 'upload_file',
                    title: 'Project A',
                    children: [
                      {
                        icon: 'upload_file',
                        title: 'Subproject A1',
                        onClick: () => alert('Subproject A1 clicked'),
                      },
                      {
                        icon: 'upload_file',
                        title: 'Subproject A2',
                        onClick: () => alert('Subproject A2 clicked'),
                      },
                    ],
                  },
                  {
                    icon: 'upload_file',
                    title: 'Project B',
                    onClick: () => alert('Project B clicked'),
                  },
                ],
              },
              {
                icon: 'settings',
                title: 'Settings',
                onClick: () => alert('Settings clicked'),
              },
            ]}
          >
            <div style={{ padding: '1rem' }}>
              <h2>Main Content</h2>
              <p>This is an example of the main content area within the AppShell layout.</p>
            </div>
          </AppShell>
        </GridItem>
      </Grid>
    </StoryWrapper>
  ),
}
