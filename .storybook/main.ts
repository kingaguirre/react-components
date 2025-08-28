// .storybook/main.ts
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../src/atoms/**/stories.@(js|jsx|ts|tsx)",
    "../src/molecules/**/stories.@(js|jsx|ts|tsx)",
    "../src/organisms/**/stories.@(js|jsx|ts|tsx)",
    "../src/poc/**/stories.@(js|jsx|ts|tsx)",
    "../src/**/stories/**/*.@(js|jsx|ts|tsx|mdx)",
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
  // <<<< Add this block to inject your proxy into Storybook’s Vite server
  viteFinal: async (config, { configType }) => {
    // ensure config.server exists
    config.server = config.server || {};
    // merge your proxy setting
    config.server.proxy = {
      ...(config.server.proxy || {}),
      "/api/chat": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chat/, "/chat"),
      },
    };
    return config;
  },
};

export default config;
