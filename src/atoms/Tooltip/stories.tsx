// src/atoms/Tooltip/Tooltip.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import Tooltip from "./index";
import { StoryWrapper, Title } from "@components/StoryWrapper";
import { Button } from "@atoms/Button";

const meta = {
  title: "Atoms/Tooltip",
  component: Tooltip,
  argTypes: {
    color: {
      control: "select",
      options: ["default", "primary", "danger", "success", "warning", "info"],
    },
    placement: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
    trigger: {
      control: "select",
      options: ["mouseenter", "click", "focus", "manual"],
    },
    arrow: { control: "boolean" },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;

/** ✅ Default DatePicker */
export const Default: StoryObj<typeof meta> = {
  args: {
    content: "Tooltip in example",
    color: "primary",
    placement: "top",
    children: (
      <Button size="sm" color="primary">
        Hover me
      </Button>
    ),
  },
  tags: ["!dev"],
  render: (args) => <Tooltip {...args} />,
};

export const Examples: StoryObj<typeof Tooltip> = {
  render: () => {
    const COLORS = ["primary", "info", "danger", "success", "warning", "default"] as const;
    return (
      <StoryWrapper title="Tooltip Examples">
        <Title>Color Variations</Title>
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "40px",
          }}
        >
          {COLORS.map((color) => (
            <Tooltip
              key={color}
              content={`Tooltip in ${color}`}
              color={color as "default" | "primary" | "info" | "danger" | "success" | "warning"}
              placement="top"
            >
              <Button size="sm" color={color}>
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </Button>
            </Tooltip>
          ))}
        </div>

        <Title>Different Triggers</Title>
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "40px",
          }}
        >
          <Tooltip content="Hover trigger" color="default" placement="top" trigger="mouseenter">
            <Button size="sm" color="default">Hover me</Button>
          </Tooltip>
          <Tooltip content="Click trigger" color="success" placement="top" trigger="click">
            <Button size="sm" color="success">Click me</Button>
          </Tooltip>
          <Tooltip content="Focus trigger" color="warning" placement="top" trigger="focus">
            <Button size="sm" color="warning">Focus me</Button>
          </Tooltip>
        </div>

        <Title>Different Placements</Title>
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "40px",
          }}
        >
          <Tooltip content="Tooltip on top" color="info" placement="top">
            <Button size="sm" color="info">Top</Button>
          </Tooltip>
          <Tooltip content="Tooltip on right" color="info" placement="right">
            <Button size="sm" color="info">Right</Button>
          </Tooltip>
          <Tooltip content="Tooltip on bottom" color="info" placement="bottom">
            <Button size="sm" color="info">Bottom</Button>
          </Tooltip>
          <Tooltip content="Tooltip on left" color="info" placement="left">
            <Button size="sm" color="info">Left</Button>
          </Tooltip>
        </div>

        <Title>Tooltip with Long Content</Title>
        <div style={{ marginBottom: "40px" }}>
          <Tooltip
            content="This is a very long tooltip content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent suscipit ultrices magna, sed dignissim libero ullamcorper ac. Integer eget lectus eu urna hendrerit ultrices. Donec non ex sed nisi viverra commodo. In hac habitasse platea dictumst."
            color="danger"
            placement="right"
          >
            <Button size="sm" color="danger">Hover for long tooltip</Button>
          </Tooltip>
        </div>
      </StoryWrapper>
    );
  },
};
