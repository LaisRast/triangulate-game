/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import('prettier').Config}
 */
const config = {
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  printWidth: 120,
  proseWrap: 'always',
  plugins: ['prettier-plugin-organize-imports'],
};

export default config;
