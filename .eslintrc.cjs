module.exports = {
  root: true,
  parserOptions: {
    project: ['./tsconfig.json']
  },
  extends: [
    'next/core-web-vitals',
    'plugin:jsx-a11y/recommended',
    'eslint:recommended',
    'prettier'
  ],
  plugins: ['jsx-a11y'],
  rules: {
    'jsx-a11y/no-autofocus': 0,
    '@next/next/no-html-link-for-pages': 'off'
  }
};
