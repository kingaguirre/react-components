// react-scan.config.js
module.exports = {
  // Enable rules tailored for a component library
  rules: {
    // Warn about props that are defined but never used (especially helpful for reusable components)
    'no-unused-props': true,
    // With TypeScript, you might not need prop types validation,
    // but you can still enforce best practices around prop usage if desired.
    'require-prop-types': false,
    // Encourage using memoization or pure component patterns for performance
    'prefer-pure-components': true,
    // Enforce consistency in event handler definitions
    'consistent-event-handling': true,
    // Ensure accessibility practices are followed in components
    'accessibility-check': true,
    // Custom rule for styled-components naming conventions (if available in your tool)
    'styled-components-naming': {
      enabled: true,
      options: {
        // Enforce a prefix for styled components, e.g., StyledButton, StyledInput
        prefix: 'Styled',
      },
    },
  },
  // Define paths to scan based on your component structure
  scanPaths: [
    'src/atoms/**/*.{tsx,jsx}',
    'src/molecules/**/*.{tsx,jsx}',
    'src/organisms/**/*.{tsx,jsx}',
  ],
  // Exclude directories that are not relevant to the scan
  exclude: [
    'node_modules/**',
    'dist/**',
    'build/**',
  ],
  // Optionally set custom error levels for strict enforcement
  errorLevels: {
    'prefer-pure-components': 'warning',
    'styled-components-naming': 'error',
  },
  // CI settings to ensure quality before merging
  ci: {
    failOnError: true,
    reportFormat: 'html', // You can choose 'json' or 'html' based on your preference
  },
};
