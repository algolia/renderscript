// eslint-disable-next-line import/no-commonjs
module.exports = {
  env: {
    browser: true, // For frontend only
    es2020: true,
    jest: true,
  },
  extends: ['algolia', 'algolia/typescript', 'plugin:import/typescript'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },

  plugins: ['prettier', '@typescript-eslint', 'import', 'algolia'],
  rules: {
    'algolia/func-style-toplevel': 'error',

    'no-console': 'off',
    'no-continue': 'off',
    'no-loop-func': 'off',
    'consistent-return': 'off',

    '@typescript-eslint/explicit-member-accessibility': [
      'error',
      { accessibility: 'no-public' },
    ],
    'eslint-comments/disable-enable-pair': ['error', { allowWholeFile: true }],

    'no-param-reassign': [
      'error',
      { props: true, ignorePropertyModificationsFor: ['res', 'req'] }, // http://expressjs.com/en/api.html#res.locals
    ],
  },
};
