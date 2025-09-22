import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import SideMenu from './index';
import type { SideMenuRef } from './interfaces';
import type { INode } from './interfaces';
import { StoryWrapper, Title } from '../../components/StoryWrapper';
import { Grid, GridItem } from '../../atoms/Grid';
import { Button } from '../../atoms/Button';

const descriptionText =
  'Side Menu displays a vertical list of sections with optional child rows, icons, badges, values, and disabled states. It supports controlled/uncontrolled selection, custom width, overflow tooltips, and an imperative API.';

const meta: Meta<typeof SideMenu> = {
  title: 'Atoms/Side Menu',
  component: SideMenu,
  parameters: {
    docs: {
      description: { component: descriptionText },
    },
  },
  argTypes: {
    disabled: { control: 'boolean' },
    width: { control: 'text' },
    noItemsText: { control: 'text' },
  },
};
export default meta;

/** -------------------------- Data Fixtures -------------------------- */
const long = (s: string) => `${s} with very very long text`;

const BASIC_DATA: INode[] = [
  {
    id: 'general',
    title: long('General'),
    isSelected: true,
    icon: 'check-circle',
    iconColor: 'var(--color-success)',
    badgeValue: 10,
    childNodes: [
      {
        id: 'overall-details',
        title: long('Overall Details'),
        isSelected: true,
        icon: 'check',
        iconColor: 'var(--color-success)',
      },
      {
        id: 'products',
        title: long('Products'),
        iconColor: 'var(--color-success)',
      },
      {
        id: 'client',
        title: 'Client',
        icon: 'success',
        iconColor: 'var(--color-success)',
      },
    ],
  },
  {
    id: 'finances',
    title: long('Finances'),
    iconColor: 'var(--color-success)',
    badgeValue: 9,
  },
  {
    id: 'finances2',
    title: long('Finances2'),
    icon: 'check-circle',
    iconColor: 'var(--color-success)',
    badgeValue: 8,
  },
  {
    id: 'finances3',
    title: 'Finances3',
    icon: 'alert',
    iconColor: 'var(--color-warning)',
    badgeValue: 7,
  },
  {
    id: 'disbursements',
    title: 'Disbursements',
    icon: 'alert',
    iconColor: 'var(--color-warning)',
    // show 99+ capping
    badgeValue: 6000,
    childNodes: [
      {
        id: 'disb-1',
        title: 'Disbursements Child 1',
        isSelected: true,
        value: 10,
      },
      {
        id: 'disb-2',
        title: 'Disbursements Child 2',
      },
      {
        id: 'disb-3',
        title: 'Disbursements Child 3',
        value: 3,
        valueColor: 'var(--color-warning)',
      },
    ],
  },
  {
    id: 'overrides',
    title: 'Overrides',
    icon: 'alert',
    iconColor: 'var(--color-warning)',
    childNodes: [
      {
        id: 'over-1',
        title: 'Overrides Child 1',
        isSelected: true,
        value: 10,
        valueColor: 'var(--color-warning)',
      },
      {
        id: 'over-2',
        title: 'Overrides Child 2',
      },
    ],
  },
  {
    id: 'dynamic-fields',
    title: 'Dynamic Fields',
    icon: 'alert',
    iconColor: 'var(--color-warning)',
    childNodes: [
      {
        id: 'df-1',
        title: 'Dynamic Fields Child 1',
        isSelected: true,
        value: 8,
        valueColor: 'var(--color-warning)',
      },
      {
        id: 'df-2',
        title: 'Dynamic Fields Child 2',
      },
    ],
  },
  {
    id: 'attachments',
    title: 'Attachments',
    icon: 'alert',
    iconColor: 'var(--color-warning)',
    childNodes: [
      {
        id: 'att-1',
        title: 'Attachments Child 1',
        isSelected: true,
        value: 5,
        valueColor: 'var(--color-warning)',
      },
      {
        id: 'att-3',
        title: 'Attachments Child 3',
        value: 3,
        valueColor: 'var(--color-warning)',
      },
    ],
  },
  {
    id: 'parties',
    title: 'Parties',
    icon: 'check-circle',
    iconColor: 'var(--color-success)',
    badgeValue: 5,
  },
];

const SMALL_DATA: INode[] = [
  {
    id: 'general',
    title: 'General',
    isSelected: true,
    icon: 'success',
    iconColor: 'var(--color-success)',
    childNodes: [
      {
        id: 'overall-details',
        title: 'Overall Details',
        isSelected: true,
        icon: 'success',
        iconColor: 'var(--color-success)',
      },
      { id: 'products', title: 'Products', icon: 'success', iconColor: 'var(--color-success)' },
      { id: 'client', title: 'Client', icon: 'success', iconColor: 'var(--color-success)' },
    ],
  },
  { id: 'finances', title: 'Finances', icon: 'alert', iconColor: 'var(--color-warning)' },
  {
    id: 'overrides',
    title: 'Overrides',
    icon: 'alert',
    iconColor: 'var(--color-warning)',
    childNodes: [
      { id: 'o-1', title: 'Overrides Child 1', isSelected: true, value: 10, valueColor: 'var(--color-warning)' },
      { id: 'o-2', title: 'Overrides Child 2' },
    ],
  },
];

const CUSTOMIZATION_DATA: INode[] = [
  {
    id: 'menu1',
    title: 'Menu 1',
    isSelected: true,
    icon: 'success',
    iconColor: 'var(--color-success)',
    badgeValue: 10,
    childNodes: [
      { id: 'm1-c1', title: 'First Child of Menu 1', isSelected: true, icon: 'settings', iconColor: 'var(--color-info)' },
      { id: 'm1-c2', title: 'Second Child of Menu 1', icon: 'user', iconColor: 'var(--color-success)' },
      { id: 'm1-c3', title: 'Third Child of Menu 1', icon: 'clock', iconColor: 'var(--color-warning)' },
      { id: 'm1-c4', title: 'Fourth Child of Menu 1 (Disabled)', icon: 'edit', iconColor: 'var(--color-primary)', disabled: true },
      { id: 'm1-c5', title: 'Fifth Child (Custom text color)', textColor: 'var(--color-danger)', icon: 'delete', iconColor: 'var(--color-danger)' },
    ],
  },
  {
    id: 'menu2',
    title: 'Menu 2 (Custom text color)',
    icon: 'favourite-filled' as any,
    textColor: '#0200a9',
    iconColor: 'var(--color-warning)',
    childNodes: [
      { id: 'm2-c1', title: 'First Child of Menu 2', value: 10, valueColor: 'var(--color-warning)' },
      { id: 'm2-c2', title: 'Second Child of Menu 2' },
    ],
  },
  {
    id: 'menu3',
    title: 'Menu 3 (Disabled)',
    icon: 'mask-on' as any,
    disabled: true,
  },
  {
    id: 'menu4',
    title: 'Menu 4 (Without Child)',
    icon: 'home',
    iconColor: 'var(--color-primary)',
    iconClick: (item, e) => {
      // @ts-ignore keep parity with original demo
      // eslint-disable-next-line no-console
      console.log('icon clicked data:', item, 'event:', e);
    },
  },
];

/** -------------------------- Simple Default -------------------------- */
export const Default: StoryObj<typeof meta> = {
  args: {
    data: BASIC_DATA,
    width: '190px',
    disabled: false,
    noItemsText: 'No items to show',
  },
  tags: ['!dev'],
};

/** -------------------------- Full Examples (like Stencil demo) -------------------------- */
export const Examples: StoryObj<typeof meta> = {
  tags: ['!autodocs'],
  render: () => {
    const [lastClick, setLastClick] = useState<unknown>(null);

    return (
      <StoryWrapper title="Side Menu Examples" subTitle={descriptionText}>
        {/* Basic */}
        <Title>Basic</Title>
        <Grid>
          {/* Default */}
          <GridItem>
            <h5>Default</h5>
            <SideMenu
              data={BASIC_DATA}
              onMenuItemClick={(payload) => setLastClick(payload)}
            />
            <p className="values" style={{ marginTop: 15 }}>
              Clicked menu item: <b>{lastClick ? JSON.stringify(lastClick) : 'null'}</b>
            </p>
            <p style={{ marginTop: 12 }}>
              Capture selection via <code>onMenuItemClick</code>.
            </p>
          </GridItem>

          {/* Disabled */}
          <GridItem>
            <h5>Disabled</h5>
            <SideMenu disabled data={SMALL_DATA} />
            <p style={{ margin: '12px 0 60px' }}>
              With <code>disabled</code> set to <code>true</code>.
            </p>

            <h5>Data is not set</h5>
            <SideMenu />
            <p style={{ marginTop: 12 }}>
              When no <code>data</code> is provided, the <b>noItemsText</b> appears. Customize via <code>noItemsText</code>.
            </p>
          </GridItem>

          {/* Custom width */}
          <GridItem>
            <h5>Custom Width</h5>
            <SideMenu width="100%" data={SMALL_DATA} />
            <p style={{ marginTop: 12 }}>
              Using <code>width=&quot;100%&quot;</code> to occupy the parent container’s full width.
            </p>
          </GridItem>
        </Grid>

        {/* Customizations */}
        <Title>Customizations of data</Title>
        <Grid>
          <GridItem xs={12} sm={9}>
            <SideMenu width="300px" data={CUSTOMIZATION_DATA} />
            <p style={{ marginTop: 30 }}>
              Menu max width set to <b>300px</b>.
            </p>
          </GridItem>
          <GridItem xs={12} sm={6}>
            <p style={{ marginTop: 12 }}>
              Text colors, icons, icon colors, disabled state, values and value colors, and badges can be configured
              via the <code>data</code> model (mirrors the original <code>setData</code> usage).
            </p>
          </GridItem>
        </Grid>
      </StoryWrapper>
    );
  },
};

/** -------------------------- Controlled Selection -------------------------- */
export const ControlledSelection: StoryObj<typeof meta> = {
  tags: ['!autodocs'],
  render: () => {
    const data = useMemo(() => BASIC_DATA, []);
    const [selectedItem, setSelectedItem] = useState<string | undefined>('general');
    const [selectedChildItem, setSelectedChildItem] = useState<string | undefined>('overall-details');

    return (
      <StoryWrapper title="Controlled Selection" subTitle="Drive selection via props and update with buttons.">
        <Grid>
          <GridItem xs={12} sm={6} md={4}>
            <SideMenu
              data={data}
              width="260px"
              selectedItem={selectedItem}
              selectedChildItem={selectedChildItem}
              onMenuItemClick={(p) => {
                // You could also sync back here if desired
                // setSelectedItem(p.parent?.id ?? p.id); // etc...
                // setSelectedChildItem(p.parent ? p.id : undefined);
                // For demo, just log:
                // eslint-disable-next-line no-console
                console.log('clicked: ', p);
              }}
            />
          </GridItem>
          <GridItem xs={12} sm={6} md={8}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button onClick={() => setSelectedItem('general')}>Select: general</Button>
              <Button onClick={() => setSelectedItem('finances')}>Select: finances</Button>
              <Button onClick={() => setSelectedItem('disbursements')}>Select: disbursements</Button>
              <Button onClick={() => setSelectedChildItem('disb-3')}>Select child: disb-3</Button>
              <Button variant="outlined" onClick={() => { setSelectedItem(undefined); setSelectedChildItem(undefined); }}>
                Clear selection
              </Button>
            </div>

            <p style={{ marginTop: 12 }}>
              Current controlled props:&nbsp;
              <code>selectedItem</code> = <b>{String(selectedItem)}</b>,&nbsp;
              <code>selectedChildItem</code> = <b>{String(selectedChildItem)}</b>
            </p>
          </GridItem>
        </Grid>
      </StoryWrapper>
    );
  },
};

/** -------------------------- Imperative API (ref) -------------------------- */
export const ImperativeAPI: StoryObj<typeof meta> = {
  tags: ['!autodocs'],
  render: () => {
    const ref = useRef<SideMenuRef | null>(null);
    const [lastClick, setLastClick] = useState<unknown>(null);

    // Seed via setData (parity with Stencil .setData())
    useEffect(() => {
      ref.current?.setData(SMALL_DATA);
    }, []);

    return (
      <StoryWrapper title="Imperative API" subTitle="Call setData, resetSelection, selectMenu, selectChild via ref.">
        <Grid>
          <GridItem xs={12} sm={6} md={4}>
            <SideMenu ref={ref} width="240px" onMenuItemClick={(p) => setLastClick(p)} />
            <p style={{ marginTop: 12 }}>
              Last click payload: <b>{lastClick ? JSON.stringify(lastClick) : 'null'}</b>
            </p>
          </GridItem>
          <GridItem xs={12} sm={6} md={8}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button onClick={() => ref.current?.setData(BASIC_DATA)}>setData: BASIC_DATA</Button>
              <Button onClick={() => ref.current?.setData(CUSTOMIZATION_DATA)}>setData: CUSTOMIZATION_DATA</Button>
              <Button onClick={() => ref.current?.resetSelection()}>resetSelection()</Button>
              <Button onClick={() => ref.current?.selectMenu('disbursements')}>selectMenu('disbursements')</Button>
              <Button onClick={() => ref.current?.selectChild('disb-1')}>selectChild('disb-1')</Button>
            </div>
            <p style={{ marginTop: 12 }}>
              Matches Stencil behavior while leveraging React refs.
            </p>
          </GridItem>
        </Grid>
      </StoryWrapper>
    );
  },
};
