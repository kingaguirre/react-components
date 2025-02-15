// src/components/Modal/stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import Modal from "./index";
import { StoryWrapper, Title } from "@components/StoryWrapper";
import { useState } from "react";
import Button from "@atoms/Button";
import FormControl from "@atoms/FormControl";
import Icon from "@atoms/Icon";

const meta = {
  title: "Organisms/Modal",
  component: Modal,
  argTypes: {
    modalWidth: {
      control: "select",
      options: ["sm", "md", "lg", "auto"],
    },
    color: {
      control: "select",
      options: ["primary", "success", "warning", "danger", "info", "default"],
    },
    closeable: { control: "boolean" },
    showCloseIcon: { control: "boolean" },
  },
} satisfies Meta<typeof Modal>;

export default meta;

/** ✅ Default Modal Example */
export const Default: StoryObj<typeof meta> = {
  args: {
    show: false,
    closeable: true,
    showCloseIcon: true,
    modalWidth: "md",
    zIndex: 1000,
    color: "primary",
    title: "Basic Modal",
    children: <p>This is a simple modal example.</p>,
  },
  tags: ["!dev"],
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button color="primary" onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal {...args} show={open} onClose={() => setOpen(false)} />
      </>
    );
  },
};

/** ✅ All Modal Examples */
export const Examples = {
  tags: ["!autodocs"],
  render: () => {
    const [openLong, setOpenLong] = useState(false);
    const [openFooter, setOpenFooter] = useState(false);
    const [alignment, setAlignment] = useState<"left" | "center" | "right">("center");
    const [size, setSize] = useState<"sm" | "md" | "lg" | "auto">("md");
    const [openSize, setOpenSize] = useState(false);
    const [color, setColor] = useState<"primary" | "success" | "warning" | "danger" | "info" | "default">("primary");
    const [openColor, setOpenColor] = useState(false);
    const [openNoClose, setOpenNoClose] = useState(false);
    const [openNoIcon, setOpenNoIcon] = useState(false);

    return (
      <StoryWrapper title="Modal Examples">
        {/* ✅ Long Scrollable Content */}
        <Title>Long Content (Scrollable)</Title>
        <Button color="primary" onClick={() => setOpenLong(true)}>Open Long Content Modal</Button>
        <Modal show={openLong} onClose={() => setOpenLong(false)} title="Long Content Modal">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
          <FormControl label="Full Name" type="text" placeholder="Enter your full name" />
          <FormControl label="Email Address" type="email" placeholder="Enter your email" />
          <FormControl label="Comments" type="textarea" placeholder="Write your message here" />
          <p><Icon icon="info" /> Example modal with **long scrollable content**.</p>
          {[...Array(50)].map((_, i) => (
            <p key={i}>This is long content line {i + 1}. Lorem ipsum dolor sit amet...</p>
          ))}
        </Modal>

        {/* ✅ Footer Buttons Alignment */}
        <Title>Footer Buttons Alignment</Title>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <Button color="default" onClick={() => { setAlignment("left"); setOpenFooter(true); }}>Left Align</Button>
          <Button color="default" onClick={() => { setAlignment("center"); setOpenFooter(true); }}>Center Align</Button>
          <Button color="default" onClick={() => { setAlignment("right"); setOpenFooter(true); }}>Right Align</Button>
        </div>
        <Modal show={openFooter} onClose={() => setOpenFooter(false)} title="Footer Buttons">
          <p>Buttons are aligned {alignment} in the footer.</p>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: alignment }}>
            <Button color="default" onClick={() => setOpenFooter(false)}>Cancel</Button>
            <Button color="primary" onClick={() => alert("Confirmed")}>Confirm</Button>
          </div>
        </Modal>

        {/* ✅ Size Variants */}
        <Title>Size Variants</Title>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {["sm", "md", "lg", "auto"].map((s) => (
            <Button key={s} color="default" onClick={() => { setSize(s as any); setOpenSize(true); }}>
              {s.toUpperCase()}
            </Button>
          ))}
        </div>
        <Modal show={openSize} onClose={() => setOpenSize(false)} modalWidth={size} title={`Modal - ${size.toUpperCase()} Size`}>
          <p>This modal demonstrates different sizes.</p>
        </Modal>

        {/* ✅ Color Variants */}
        <Title>Header Colors</Title>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {["primary", "success", "warning", "danger", "info", "default"].map((c) => (
            <Button key={c} color={c as any} onClick={() => { setColor(c as any); setOpenColor(true); }}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </Button>
          ))}
        </div>
        <Modal show={openColor} onClose={() => setOpenColor(false)} color={color} title={`Modal - ${color.charAt(0).toUpperCase() + color.slice(1)}`}>
          <p>The header color of this modal is {color}.</p>
        </Modal>

        {/* ✅ Close Options */}
        <Title>Close Behavior</Title>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <Button color="primary" onClick={() => setOpenNoClose(true)}>Non-Closeable Modal</Button>
          <Button color="primary" onClick={() => setOpenNoIcon(true)}>No Close Icon</Button>
        </div>
        <Modal show={openNoClose} closeable={false} onClose={() => setOpenNoClose(false)} title="Non-Closeable Modal">
          <p>Clicking the overlay will not close this modal.</p>
        </Modal>
        <Modal show={openNoIcon} onClose={() => setOpenNoIcon(false)} title="No Close Icon" showCloseIcon={false}>
          <p>This modal **has no close button (X)**.</p>
        </Modal>
      </StoryWrapper>
    );
  },
};
