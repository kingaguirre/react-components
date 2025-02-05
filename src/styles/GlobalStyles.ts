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

// Export as both a named and default export
export { GlobalStyles };
export default GlobalStyles;
