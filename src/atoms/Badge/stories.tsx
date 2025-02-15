// src/atoms/Badge/stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import Badge from "./index";
import { StoryWrapper, Title } from "@components/StoryWrapper";

const meta = {
  title: "Atoms/Badge",
  component: Badge,
  argTypes: {
    color: {
      control: "select",
      options: ["primary", "success", "warning", "danger", "info", "default"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    borderRadius: { control: "text" },
    width: { control: "text" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Badge>;

export default meta;

/** ✅ Default Badge */
export const Default: StoryObj<typeof meta> = {
  args: {
    children: "!",
    color: "primary",
    size: "md",
    borderRadius: "",
    width: "",
    disabled: false,
  },
  tags: ["!dev"],
  render: (args) => <Badge {...args} />,
};

/** ✅ All Badge Examples */
export const Examples = {
  tags: ["!autodocs"],
  render: () => (
    <StoryWrapper title="Badge Examples">
      {/* ✅ Color Variants */}
      <Title>Color Variants</Title>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {["primary", "success", "warning", "danger", "info", "default"].map((color) => (
          <Badge key={color} color={color as any}>
            {color.charAt(0).toUpperCase() + color.slice(1)}
          </Badge>
        ))}
      </div>

      {/* ✅ Outlined Badges */}
      <Title>Outlined Badges</Title>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {["primary", "success", "warning", "danger", "info", "default"].map((color) => (
          <Badge key={color} color={color as any} outlined>
            {color.charAt(0).toUpperCase() + color.slice(1)}
          </Badge>
        ))}
      </div>

      {/* ✅ Disabled Badges */}
      <Title>Disabled Badges</Title>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {["primary", "success", "warning", "danger", "info", "default"].map((color) => (
          <Badge key={color} color={color as any} disabled>
            {color.charAt(0).toUpperCase() + color.slice(1)} (Disabled)
          </Badge>
        ))}
      </div>

      {/* ✅ Size Variants */}
      <Title>Size Variants</Title>
      <div style={{ display: "flex", gap: "12px" }}>
        <Badge size="sm">S</Badge>
        <Badge size="md">M</Badge>
        <Badge size="lg">L</Badge>
      </div>

      {/* ✅ Custom Border Radius */}
      <Title>Custom Border Radius</Title>
      <div style={{ display: "flex", gap: "12px" }}>
        <Badge borderRadius="0">Edgy</Badge>
        <Badge borderRadius="4px">Rounded</Badge>
        <Badge borderRadius="12px">More Rounded</Badge>
        <Badge borderRadius="20px">Pill</Badge>
      </div>

      {/* ✅ Width Control */}
      <Title>Custom Width</Title>
      <div style={{ display: "flex", gap: "12px" }}>
        <Badge width="40px">Wide</Badge>
        <Badge width="80px">Wider</Badge>
        <Badge width="120px">Extra Wide</Badge>
      </div>

      {/* ✅ Numeric Badges (1 & 2 Characters) */}
      <Title>Numeric Badges</Title>
      <div style={{ display: "flex", gap: "12px" }}>
        <Badge size="sm">1</Badge>
        <Badge size="md">12</Badge>
        <Badge size="lg">99</Badge>
      </div>
    </StoryWrapper>
  ),
};
