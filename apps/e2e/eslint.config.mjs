import tseslint from 'typescript-eslint';
import baseConfig from '../../eslint.config.mjs';

/** The suite is held to a stricter bar than the apps: a flaky or wrong assertion skews every run. */
export default tseslint.config(
  ...baseConfig,
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
