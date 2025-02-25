import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../src/atoms/**/stories.@(js|jsx|ts|tsx)",
    "../src/molecules/**/stories.@(js|jsx|ts|tsx)",
    "../src/organisms/**/stories.@(js|jsx|ts|tsx)",
    "../src/poc/**/stories.@(js|jsx|ts|tsx)",
    "../src/**/*.mdx",
  ],
  addons: [
    "@storybook/addon-onboarding",
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
    "@storybook/addon-interactions",
    "storybook-dark-mode"
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};
export default config;
