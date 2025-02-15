// src/styles/GlobalStyles.ts
import { createGlobalStyle } from "styled-components";
import { theme } from "./theme";

// Create the global style component
const GlobalStyles = createGlobalStyle`
  :root {
    /* Primary Colors */
    --color-primary-base: ${theme.colors.primary.base};
    --color-primary-light: ${theme.colors.primary.light};
    --color-primary-lighter: ${theme.colors.primary.lighter};
    --color-primary-pale: ${theme.colors.primary.pale};
    --color-primary-dark: ${theme.colors.primary.dark};
    --color-primary-darker: ${theme.colors.primary.darker};

    /* Info Colors */
    --color-info-base: ${theme.colors.info.base};
    --color-info-light: ${theme.colors.info.light};
    --color-info-lighter: ${theme.colors.info.lighter};
    --color-info-pale: ${theme.colors.info.pale};
    --color-info-dark: ${theme.colors.info.dark};
    --color-info-darker: ${theme.colors.info.darker};

    /* Success Colors */
    --color-success-base: ${theme.colors.success.base};
    --color-success-light: ${theme.colors.success.light};
    --color-success-lighter: ${theme.colors.success.lighter};
    --color-success-pale: ${theme.colors.success.pale};
    --color-success-dark: ${theme.colors.success.dark};
    --color-success-darker: ${theme.colors.success.darker};

    /* Warning Colors */
    --color-warning-base: ${theme.colors.warning.base};
    --color-warning-light: ${theme.colors.warning.light};
    --color-warning-lighter: ${theme.colors.warning.lighter};
    --color-warning-pale: ${theme.colors.warning.pale};
    --color-warning-dark: ${theme.colors.warning.dark};
    --color-warning-darker: ${theme.colors.warning.darker};

    /* Danger Colors */
    --color-danger-base: ${theme.colors.danger.base};
    --color-danger-light: ${theme.colors.danger.light};
    --color-danger-lighter: ${theme.colors.danger.lighter};
    --color-danger-pale: ${theme.colors.danger.pale};
    --color-danger-dark: ${theme.colors.danger.dark};
    --color-danger-darker: ${theme.colors.danger.darker};

    /* Default Colors */
    --color-default-base: ${theme.colors.default.base};
    --color-default-light: ${theme.colors.default.light};
    --color-default-lighter: ${theme.colors.default.lighter};
    --color-default-pale: ${theme.colors.default.pale};
    --color-default-dark: ${theme.colors.default.dark};
    --color-default-darker: ${theme.colors.default.darker};
  }
`;

export const scrollStyle = `
  /* Scrollbar style for WebKit based browsers (e.g., Chrome, Safari) */
  &::-webkit-scrollbar-track {
    width: 10px; /* Set the width of the scrollbar */
    height: 10px;
    background-color: #F2F6F8;
    border: 1px solid ${theme.colors.default.pale};
  }

  &::-webkit-scrollbar {
    width: 10px; /* Set the width of the scrollbar */
    height: 10px;
    background-color: #F2F6F8;
    border: 1px solid ${theme.colors.default.pale};
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${theme.colors.default.light}; /* Grey cursor color */
    border: 2px solid #F2F6F8;
    border-radius: 6px; /* Rounded edges */
    transition: all .3s ease;
    height: 6px;
    width: 6px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: ${theme.colors.primary.dark}; /* Change cursor color on hover */
  }

  /* Scrollbar style for Firefox */
  /* Firefox doesn't support changing the scrollbar color directly via CSS.
    However, you can use a browser-specific feature called scrollbar-color (only works in Firefox 64+). */

  @-moz-document url-prefix() {
    scrollbar-color: ${theme.colors.default.pale} #fff; /* Cursor and track colors */
    scrollbar-width: thin; /* Set the width of the scrollbar */
  }

  /* Scrollbar style for Edge and Internet Explorer (10+) */
  /* Microsoft Edge and IE 10+ support a different set of scrollbar CSS properties. */

  @supports (-ms-overflow-style: none) {
    /* Hide the default scrollbar */
    &::-webkit-scrollbar {
      display: none;
    }

    /* Define the custom scrollbar */
    & {
      -ms-overflow-style: none; /* Hide the default scrollbar */
      scrollbar-width: thin; /* Set the width of the scrollbar */
    }

    &::-ms-scrollbar-thumb {
      background-color: ${theme.colors.default.pale}; /* Grey cursor color */
      border: 1.5px solid #F2F6F8;
      border-radius: 6px; /* Rounded edges */
    }

    &::-ms-scrollbar-thumb:hover {
      background-color: #a8aaac; /* Change cursor color on hover */
    }
  }

  /* Scrollbar style for WebKit based browsers (e.g., Chrome, Safari) */
  *::-webkit-scrollbar-track {
    width: 10px; /* Set the width of the scrollbar */
    height: 10px;
    background-color: #F2F6F8;
    border: 1px solid ${theme.colors.default.pale};
  }

  *::-webkit-scrollbar {
    width: 10px; /* Set the width of the scrollbar */
    height: 10px;
    background-color: #F2F6F8;
    border: 1px solid ${theme.colors.default.pale};
  }

  *::-webkit-scrollbar-thumb {
    background-color: ${theme.colors.default.light}; /* Grey cursor color */
    border: 2px solid #F2F6F8;
    border-radius: 6px; /* Rounded edges */
    transition: all .3s ease;
    height: 6px;
    width: 6px;
  }

  *::-webkit-scrollbar-thumb:hover {
    background-color: ${theme.colors.default.base}; /* Change cursor color on hover */
  }

  /* Scrollbar style for Firefox */
  /* Firefox doesn't support changing the scrollbar color directly via CSS.
    However, you can use a browser-specific feature called scrollbar-color (only works in Firefox 64+). */

  @-moz-document url-prefix() {
    scrollbar-color: ${theme.colors.default.pale} #fff; /* Cursor and track colors */
    scrollbar-width: thin; /* Set the width of the scrollbar */
  }

  /* Scrollbar style for Edge and Internet Explorer (10+) */
  /* Microsoft Edge and IE 10+ support a different set of scrollbar CSS properties. */

  @supports (-ms-overflow-style: none) {
    /* Hide the default scrollbar */
    *::-webkit-scrollbar {
      display: none;
    }

    /* Define the custom scrollbar */
    & {
      -ms-overflow-style: none; /* Hide the default scrollbar */
      scrollbar-width: thin; /* Set the width of the scrollbar */
    }

    *::-ms-scrollbar-thumb {
      background-color: ${theme.colors.default.pale}; /* Grey cursor color */
      border: 1.5px solid #F2F6F8;
      border-radius: 6px; /* Rounded edges */
    }

    *::-ms-scrollbar-thumb:hover {
      background-color: #a8aaac; /* Change cursor color on hover */
    }
  }

`;

// Export as both a named and default export
export { GlobalStyles };
export default GlobalStyles;
