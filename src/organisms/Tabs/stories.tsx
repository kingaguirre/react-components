import type { Meta, StoryObj } from "@storybook/react";
import Tabs from "./index";
import { StoryWrapper, Title } from "@components/StoryWrapper";

const meta = {
  title: "Organisms/Tabs",
  component: Tabs,
  argTypes: {
    firstLastNavControl: { control: "boolean" },
    fullHeader: { control: "boolean" },
  },
} satisfies Meta<typeof Tabs>;

export default meta;

/** ✅ Tab Data */
// @typescript-eslint/no-explicit-any
const basicTabs: unknown = [
  { title: "Inbox", icon: "mail_outline", badgeValue: 5, badgeColor: "primary", content: <p>Inbox Content</p> },
  { title: "Messages", icon: "chat", badgeValue: 12, badgeColor: "success", content: <p>Messages Content</p> },
  { title: "Warnings", icon: "warning", badgeValue: 3, badgeColor: "warning", content: <p>Warnings Content</p>, disabled: true },
  { title: "Alerts", icon: "notification_important", iconColor: 'red', badgeValue: 9, badgeColor: "danger", content: <p>Alerts Content</p> },
];

const manyTabs = Array.from({ length: 12 }, (_, i) => ({
  title: `Tab ${i + 1}`,
  content: <p>Content for Tab {i + 1}</p>,
}));

// @typescript-eslint/no-explicit-any
const coloredTabs: unknown = [
  { title: "Primary", color: "primary", content: <p>Primary Content</p> },
  { title: "Success", color: "success", content: <p>Success Content</p> },
  { title: "Warning", color: "warning", content: <p>Warning Content</p> },
  { title: "Danger", color: "danger", content: <p>Danger Content</p> },
  { title: "Info", color: "info", content: <p>Info Content</p> },
];

/** ✅ Default Story */
export const Default: StoryObj<typeof meta> = {
  args: {
    tabs: basicTabs,
  },
  tags: ["!dev"],
};

/** ✅ All Examples (Merged Interactive, Styling, Navigation, and Keyboard Support) */
export const Examples = {
  tags: ["!autodocs"],
  render: () => (
    <StoryWrapper title="Tabs Examples">
      {/* 📌 Pre-Selected Tab */}
      <Title>Pre-Selected Tab</Title>
      <p>The `activeTab` prop sets a pre-selected tab on mount.</p>
      <Tabs tabs={basicTabs} activeTab={2} />

      {/* 📌 onTabChange Event */}
      <Title>Tabs with `onTabChange`</Title>
      <p>Trigger an alert whenever the user changes tabs.</p>
      <Tabs tabs={basicTabs} onTabChange={(index) => alert(`Selected Tab: ${index}`)} />

      {/* 📌 Styling Variants */}
      <Title>Colored Tabs</Title>
      <p>Each tab can have its own color variation.</p>
      <Tabs tabs={coloredTabs} />

      <Title>Full-Width Header</Title>
      <p>When `fullHeader` is enabled, tabs stretch to take the full width.</p>
      <Tabs tabs={basicTabs} fullHeader />

      {/* 📌 Navigation Controls */}
      <Title>First & Last Navigation</Title>
      <p>When `firstLastNavControl` is enabled, additional buttons allow quick navigation to the first and last tab.</p>
      <Tabs tabs={basicTabs} firstLastNavControl />

      <Title>Scrollable Tabs</Title>
      <p>If tabs overflow the screen, scrolling is enabled with left and right navigation buttons.</p>
      <Tabs tabs={manyTabs} firstLastNavControl />

      {/* 📌 Keyboard Navigation */}
      <Title>Keyboard Navigation</Title>
      <p>Use <strong>Left (`←`)</strong> and <strong>Right (`→`)</strong> arrow keys to navigate between tabs. Press <strong>Enter</strong> to select a tab.</p>
      <Tabs tabs={basicTabs} />

      <Title>Test Keydown Inside Input</Title>
        <Tabs
          tabs={[
            {
              title: "Form",
              content: (
                <div>
                  <p>Type something inside the input below. Arrow keys should NOT change tabs.</p>
                  <input type="text" placeholder="Type here..." />
                </div>
              ),
            },
            { title: "Settings", content: <p>Settings Content</p> },
          ]}
        />
        
    </StoryWrapper>
  ),
};
