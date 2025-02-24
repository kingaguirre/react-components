import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import styled from "styled-components";
import { Icon } from "./index";
import { StoryWrapper, Title } from "@components/StoryWrapper";
import { EXTRA_ICONS, SCB_ICONS } from "./data";

const meta = {
  title: "Atoms/Icon",
  component: Icon,
  argTypes: {
    icon: {
      control: "text",
      description: "Icon class name for the icon",
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

// Styled Components
const SearchBox = styled.input`
  width: 100%;
  padding: 8px;
  margin-bottom: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 14px;
  box-sizing: border-box;
`;

const IconGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 12px;
`;

const IconItem = styled.div<{ $isCopied: boolean }>`
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.3s ease-in-out;
  color: #444;
  ${({ $isCopied }) =>
    $isCopied
      ? `
    box-shadow: inset 0 0 0 .1875em #ffbb4d;
    background-color: white;
  `
      : `
    box-shadow: none;
    background-color: #ddd;
  `};
`;

const CopiedMessage = styled.div`
  margin-bottom: 12px;
  color: green;
  font-weight: bold;
  text-align: center;
  position: absolute;
  right: 0;
  top: 0;
  text-transform: none;
  letter-spacing: 1px;
`;

// Create a proper React component to use hooks
const IconGalleryComponent = () => {
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const handleIconClick = (icon: string) => {
    navigator.clipboard.writeText(icon).then(() => {
      setCopiedIcon(icon);
    });
  };

  const filteredSCBIcons = SCB_ICONS.filter((icon) =>
    icon.toLowerCase().includes(search.toLowerCase())
  );

  const filteredExtraIcons = EXTRA_ICONS.filter((icon) =>
    icon.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <StoryWrapper title="Icon Gallery">
      <SearchBox
        type="text"
        placeholder="Search icons..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Title>
        (SCB ICONS) Click an Icon to Copy its Name
        {copiedIcon && <CopiedMessage>Copied: {copiedIcon}</CopiedMessage>}
      </Title>
      <IconGrid>
        {filteredSCBIcons.length > 0 ? (
          filteredSCBIcons.map((icon) => (
            <IconItem
              key={icon}
              $isCopied={copiedIcon === icon}
              onClick={() => handleIconClick(icon)}
            >
              <Icon icon={icon} size="30px" />
            </IconItem>
          ))
        ) : (
          <p style={{ whiteSpace: "nowrap" }}>No icons found</p>
        )}
      </IconGrid>

      <Title>
        (Extra ICONS) Click an Icon to Copy its Name
        {copiedIcon && <CopiedMessage>Copied: {copiedIcon}</CopiedMessage>}
      </Title>
      <IconGrid>
        {filteredExtraIcons.length > 0 ? (
          filteredExtraIcons.map((icon) => (
            <IconItem
              key={icon}
              $isCopied={copiedIcon === icon}
              onClick={() => handleIconClick(icon)}
            >
              <Icon icon={icon} size="30px" />
            </IconItem>
          ))
        ) : (
          <p style={{ whiteSpace: "nowrap" }}>No icons found</p>
        )}
      </IconGrid>
    </StoryWrapper>
  );
};

export const IconGallery = {
  tags: ["!autodocs"],
  render: () => <IconGalleryComponent />,
};
