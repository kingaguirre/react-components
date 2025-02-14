import React from "react";
import { themes } from '@storybook/theming';
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
    darkMode: {
      // Override the default dark theme
      dark: { ...themes.dark, appBg: 'dark' },
      // Override the default light theme
      light: { ...themes.normal, appBg: 'light' },
      // Set the initial theme
      current: 'dark'
    },
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
