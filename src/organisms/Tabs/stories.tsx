import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Tabs } from './index'
import type { TabItemProps } from './interface'
import { StoryWrapper, Title } from '../../components/StoryWrapper'

const descriptionText =
  'The Tabs component is used to organize content into multiple panels, each accessible by clicking on its corresponding tab. It supports pre-selection, event handling, styling variants, navigation controls, and keyboard navigation.'

// Tab Data
const basicTabs: TabItemProps[] = [
  { title: 'Inbox', icon: 'mail_outline', badgeValue: 5, badgeColor: 'primary', content: <p>Inbox Content</p> },
  { title: 'Messages', icon: 'chat', badgeValue: 12, badgeColor: 'success', content: <p>Messages Content</p> },
  { title: 'Warnings', icon: 'warning', badgeValue: 3, badgeColor: 'warning', content: <p>Warnings Content</p>, disabled: true },
  { title: 'Alerts', icon: 'notification_important', iconColor: 'red', badgeValue: 9, badgeColor: 'danger', content: <p>Alerts Content</p> }
]

const manyTabs = Array.from({ length: 12 }, (_, i) => ({
  title: `Tab ${i + 1}`,
  content: <p>Content for Tab {i + 1}</p>
}))

const coloredTabs: TabItemProps[] = [
  { title: 'Primary', color: 'primary', content: <p>Primary Content</p> },
  { title: 'Success', color: 'success', content: <p>Success Content</p> },
  { title: 'Warning', color: 'warning', content: <p>Warning Content</p> },
  { title: 'Danger', color: 'danger', content: <p>Danger Content</p> },
  { title: 'Info', color: 'info', content: <p>Info Content</p> }
]

const meta: Meta<typeof Tabs> = {
  title: 'Organisms/Tabs',
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component: descriptionText,
      },
    },
  },
  argTypes: {
    firstLastNavControl: { control: 'boolean' },
    fullHeader: { control: 'boolean' }
  }
}

export default meta

/** ✅ Default Story */
export const Default: StoryObj<typeof meta> = {
  args: {
    tabs: basicTabs
  },
  tags: ['!dev']
}

// ---------- Lazy examples (dynamic height ready) ----------
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const box = (h: number, label?: string) => (
  <div
    style={{
      height: h,
      borderRadius: 6,
      background: '#f2f3f5',
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
      transition: 'height 200ms ease'
    }}
  >
    {label && (
      <div style={{ padding: 8, color: '#666' }}>
        <small>{label}</small>
      </div>
    )}
  </div>
);

// (1) Small panel resolves after ~600ms
const LazySmall = React.lazy(async () => {
  await wait(600);
  return {
    default: () => <div><p><strong>Lazy Small Content</strong></p>{box(80)}</div>,
  };
});

// (2) Big panel resolves after ~900ms
const LazyBig = React.lazy(async () => {
  await wait(900);
  return {
    default: () => (
      <div>
        <p><strong>Lazy Big Content</strong></p>
        {box(220)}
      </div>
    ),
  };
});

// ---------- Non-lazy dynamic height demo helpers ----------
const Box: React.FC<{ h: number; label?: string }> = ({ h, label }) => (
  <div
    style={{
      height: h,
      borderRadius: 6,
      background: '#f2f3f5',
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
      transition: 'height 200ms ease',
    }}
  >
    {label && (
      <div style={{ padding: 8, color: '#666' }}>
        <small>{label}</small>
      </div>
    )}
  </div>
);

const ImmediateSmall: React.FC = () => (
  <div>
    <p><strong>Immediate Small Content</strong></p>
    <Box h={80} />
  </div>
);

const ImmediateBig: React.FC = () => (
  <div>
    <p><strong>Immediate Big Content</strong></p>
    <Box h={220} />
  </div>
);

/** Simulates API batches: grows twice after mount */
const AutoGrowPanel: React.FC = () => {
  const [h, setH] = React.useState(90);
  React.useEffect(() => {
    const t1 = setTimeout(() => setH(220), 700);
    const t2 = setTimeout(() => setH(420), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div>
      <p><strong>Auto-Grow (API-like)</strong></p>
      <p>Mounts small, then grows as “data” arrives.</p>
      <Box h={h} label={`height → ${h}px`} />
    </div>
  );
};

/** Synchronous change: button toggles size immediately */
const TogglePanel: React.FC = () => {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div>
      <p><strong>Manual Toggle Growth</strong></p>
      <button onClick={() => setExpanded(v => !v)} style={{ marginBottom: 8 }}>
        {expanded ? 'Shrink' : 'Expand'}
      </button>
      <Box h={expanded ? 360 : 110} label={expanded ? 'expanded' : 'collapsed'} />
      <p style={{ marginTop: 12 }}>
        Click to force an immediate height change (no lazy, no suspense).
      </p>
    </div>
  );
};

/** Content reflow: list length changes without remounting the tab */
const DataFeedPanel: React.FC = () => {
  const [rows, setRows] = React.useState(4);
  React.useEffect(() => {
    const t1 = setTimeout(() => setRows(12), 600);
    const t2 = setTimeout(() => setRows(24), 1200);
    const t3 = setTimeout(() => setRows(8), 1800); // also test shrink
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  return (
    <div>
      <p><strong>Data Feed</strong></p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} style={{ padding: '6px 0' }}>Row {i + 1}</li>
        ))}
      </ul>
      <p style={{ marginTop: 12 }}>Rows: {rows}</p>
    </div>
  );
};

export const Examples = {
  tags: ['!autodocs'],
  render: () => (
    <StoryWrapper title='Tabs Examples' subTitle={descriptionText}>
      <Title>Pre-Selected Tab</Title>
      <p>The <code>activeTab</code> prop sets a pre-selected tab on mount.</p>
      <Tabs tabs={basicTabs} activeTab={2}/>
      <p>The <code>activeTab</code> prop sets a pre-selected tab on mount (variant='pill').</p>
      <Tabs tabs={basicTabs} activeTab={2} variant="pill"/>

      <Title>Tabs with <code>onTabChange</code></Title>
      <p>Trigger an alert whenever the user changes tabs.</p>
      <Tabs tabs={basicTabs} onTabChange={(index: number) => alert(`Selected Tab: ${index}`)} />

      <Title>Colored Tabs</Title>
      <p>Each tab can have its own color variation.</p>
      <Tabs tabs={coloredTabs} />

      <Title>Full-Width Header</Title>
      <p>When <code>fullHeader</code> is enabled, tabs stretch to take the full width.</p>
      <Tabs tabs={basicTabs} fullHeader />

      <Title>First & Last Navigation</Title>
      <p>
        When <code>firstLastNavControl</code> is enabled, additional buttons allow quick navigation to the first and last tab.
      </p>
      <Tabs tabs={basicTabs} firstLastNavControl />

      <Title>Scrollable Tabs</Title>
      <p>If tabs overflow the screen, scrolling is enabled with left and right navigation buttons.</p>
      <Tabs tabs={manyTabs} firstLastNavControl />

      <Title>Keyboard Navigation</Title>
      <p>
        Use <strong>Left (←)</strong> and <strong>Right (→)</strong> arrow keys to navigate between tabs.
        Press <strong>Enter</strong> to select a tab.
      </p>
      <Tabs tabs={basicTabs} />

      <Title>Test Keydown Inside Input</Title>
      <Tabs
        tabs={[
          {
            title: 'Form',
            content: (
              <div>
                <p>Type something inside the input below. Arrow keys should NOT change tabs.</p>
                <input type='text' placeholder='Type here...' />
              </div>
            )
          },
          { title: 'Settings', content: <p>Settings Content</p> }
        ]}
      />

      <Title>Externally Controlled Tabs</Title>
      <p>
        Drive the active tab from parent state using <code>activeTab</code>. Keep the component in sync by passing
        <code> onTabChange</code> to update that state. This demonstrates true controlled usage (clicks and keyboard
        nav both call your handler).
      </p>
      {(() => {
        const ControlledDemo: React.FC = () => {
          const controlledTabs: TabItemProps[] = [
            { title: 'Overview', content: <p>Overview content</p>, color: 'primary' },
            { title: 'Details', content: <p>Details content</p>, color: 'success' },
            { title: 'Activity', content: <p>Recent activity</p>, color: 'info' },
          ];
          const [idx, setIdx] = React.useState(1);

          const go = (n: number) => setIdx(Math.max(0, Math.min(controlledTabs.length - 1, n)));

          return (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button onClick={() => go(0)}>First</button>
                <button onClick={() => go(idx - 1)}>Prev</button>
                <button onClick={() => go(idx + 1)}>Next</button>
                <button onClick={() => go(controlledTabs.length - 1)}>Last</button>
                <button onClick={() => go(2)}>Go to Activity</button>
              </div>
              <Tabs
                tabs={controlledTabs}
                activeTab={idx}
                onTabChange={setIdx}
                firstLastNavControl
                variant="pill"
              />
            </div>
          );
        };
        return <ControlledDemo />;
      })()}

      <Title>Lazy-loaded Panels (React.lazy) — Dynamic Height</Title>
      <p>
        These tabs demonstrate deferred mounting and <strong>dynamic height changes</strong> after mount.
        <code>Tabs</code> should smoothly resize when lazy content resolves, grows with “API” data, or changes synchronously.
      </p>

      <Tabs
        tabs={[
          { title: 'Immediate', content: <p>Instant content</p> },
          { title: 'Lazy Small', content: <LazySmall /> },
          { title: 'Lazy Big', content: <LazyBig /> },
          { title: 'Auto-Grow (API)', content: <AutoGrowPanel /> },
          { title: 'Manual Toggle', content: <TogglePanel /> },
          { title: 'Data Feed', content: <DataFeedPanel /> },
        ]}
        // Start on a lazy tab that grows to stress-test height updates
        activeTab={3}
        variant="pill"
      />
    </StoryWrapper>
  )
}
