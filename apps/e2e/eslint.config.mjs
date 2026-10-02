import tseslint from 'typescript-eslint';
import baseConfig from '../../eslint.config.mjs';

/** The suite is held to a stricter bar than application code: a flaky or wrong assertion reports a wrong result. */
export default tseslint.config(
  ...baseConfig,
  {
    ignores: ['test-results', 'playwright-report'],
  },
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['eslint.config.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
