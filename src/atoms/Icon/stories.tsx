import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import styled from "styled-components";
import { Icon } from "./index";
import { StoryWrapper, Title } from "@components/StoryWrapper";

const meta = {
  title: "Atoms/Icon",
  component: Icon,
  argTypes: {
    icon: {
      control: "text",
      description: "IcoMoon class name for the icon",
    },
    size: {
      control: "text",
      description: "Font size of the icon (inherits from parent if undefined)",
    },
    color: {
      control: "text",
      description: "Color of the icon (inherits from parent if undefined)",
    },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Icon>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    icon: "home",
    size: undefined,
    color: undefined,
    disabled: false,
  },
  tags: ["!dev"],
};

// List of available icons
const ICONS = [
  "home",
  "home2",
  "home3",
  "office",
  "newspaper",
  "pencil",
  "pencil2",
  "quill",
  "pen",
  "blog",
  "eyedropper",
  "droplet",
  "paint-format",
  "image",
  "camera",
  "headphones",
  "music",
  "play",
  "film",
  "video-camera",
  "pacman",
  "clubs",
  "spades",
  "diamonds",
  "bullhorn",
  "connection",
  "file-text",
  "file-picture",
  "file-music",
  "file-video",
  "folder",
  "folder-plus",
  "folder-minus",
  "folder-download",
  "folder-upload",
  "price-tag",
  "barcode",
];

// Styled Components for better structure and maintainability
const IconGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 12px;
`;

const IconItem = styled.div<{ isCopied: boolean }>`
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.3s ease-in-out;
  color: #444;
  ${({ isCopied }) => (isCopied ? `
    box-shadow: inset 0 0 0 .1875em #ffbb4d;
    background-color: white;
  ` : `
    box-shadow: none;
    background-color: #ddd;
  `)};
`;

const CopiedMessage = styled.div`
  margin-top: 12px;
  color: green;
  font-weight: bold;
`;

// Story for displaying all icons
export const IconGallery = {
  tags: ["!autodocs"],
  render: () => {
    const [copiedIcon, setCopiedIcon] = useState<string | null>(null);

    const handleIconClick = (icon: string) => {
      navigator.clipboard.writeText(icon).then(() => {
        setCopiedIcon(icon);
      });
    };

    return (
      <StoryWrapper title="Icon Gallery">
        <Title>Click an Icon to Copy its Name</Title>
        <IconGrid>
          {ICONS.map((icon) => (
            <IconItem key={icon} isCopied={copiedIcon === icon} onClick={() => handleIconClick(icon)}>
              <Icon icon={icon} size="34px" />
            </IconItem>
          ))}
        </IconGrid>
        {copiedIcon && <CopiedMessage>Copied: {copiedIcon}</CopiedMessage>}
      </StoryWrapper>
    );
  },
};
