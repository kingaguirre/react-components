import React from "react";
import type { Preview } from "@storybook/react";
import { theme } from '../src/styles/theme';
import styled from "styled-components";

const Container = styled.div`
  font-family: ${theme.fontFamily};
  color: #444;
  * {
    font-family: ${theme.fontFamily};
    color: #444;
  }
`;

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <Container>
        <Story />
      </Container>
    ),
  ],
  tags: ['autodocs'],
};

export default preview;
