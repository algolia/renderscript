module.exports = {
  env: {
    browser: true, // For frontend only
    es2020: true,
    jest: true,
  },
  extends: [
    'algolia',
    'algolia/typescript',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ],
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
    'valid-jsdoc': 'off', // deprecated

    '@typescript-eslint/explicit-member-accessibility': [
      'error',
      { accessibility: 'no-public' },
    ],
    'eslint-comments/disable-enable-pair': ['error', { allowWholeFile: true }],

    'no-param-reassign': [
      'error',
      { props: true, ignorePropertyModificationsFor: ['res', 'req'] }, // http://expressjs.com/en/api.html#res.locals
    ],

    // ---- import
    'import/extensions': ['error', 'never'],
    'import/first': 'error',
    'import/no-commonjs': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'import/no-named-as-default': 'error',
    'import/no-unresolved': ['error'],
    'import/no-unused-modules': ['off', { unusedExports: true }],
    'import/order': [
      'error',
      {
        pathGroups: [
          {
            pattern: '@algolia/crawler-**/**',
            group: 'external',
            position: 'after',
          },
          {
            pattern: '*(@algolia|components)/**',
            group: 'parent',
            position: 'after',
          },
        ],
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
        },
      },
    ],
    'import/no-useless-path-segments': ['error'],

    // ---- @typescript
    '@typescript-eslint/adjacent-overload-signatures': 'error',
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          String: {
            message: 'Use `string` instead.',
            fixWith: 'string',
          },
          Number: {
            message: 'Use `number` instead.',
            fixWith: 'number',
          },
          Boolean: {
            message: 'Use `boolean` instead.',
            fixWith: 'boolean',
          },
          Symbol: {
            message: 'Use `symbol` instead.',
            fixWith: 'symbol',
          },
          Object: {
            message:
              'The `Object` type is mostly the same as `unknown`. You probably want `Record<string, unknown>` instead. See https://github.com/typescript-eslint/typescript-eslint/pull/848',
            fixWith: 'Record<string, unknown>',
          },
          '{}': {
            message:
              'The `{}` type is mostly the same as `unknown`. You probably want `Record<string, unknown>` instead.',
            fixWith: 'Record<string, unknown>',
          },
          object: {
            message:
              'The `object` type is hard to use. Use `Record<string, unknown>` instead. See: https://github.com/typescript-eslint/typescript-eslint/pull/848',
            fixWith: 'Record<string, unknown>',
          },
          Function: 'Use a specific function type instead, like `() => void`.',
        },
      },
    ],
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports' },
    ],
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        allowHigherOrderFunctions: true,
        allowTypedFunctionExpressions: true,
        // allowExpressions: true,
      },
    ],
    '@typescript-eslint/member-delimiter-style': ['error'],
    '@typescript-eslint/no-useless-constructor': 'error',
    '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/no-var-requires': 'error',
    '@typescript-eslint/type-annotation-spacing': 'error',
    '@typescript-eslint/unified-signatures': 'error',
    '@typescript-eslint/explicit-module-boundary-types': [
      'off', // disabled => because will warn to every explicit "any"
    ],
    '@typescript-eslint/typedef': [
      'warn', // disabled => because will warn for every not typed but correctly infered type var
      {
        arrayDestructuring: false,
        arrowParameter: false,
        memberVariableDeclaration: false,
        objectDestructuring: false,
        parameter: false,
        propertyDeclaration: false,
        variableDeclaration: false,
        variableDeclarationIgnoreFunction: false,
      },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/member-ordering': [
      'error',
      {
        default: [
          'public-static-field',
          'protected-static-field',
          'private-static-field',

          'public-instance-field',
          'protected-instance-field',
          'private-instance-field',

          'public-abstract-field',
          'protected-abstract-field',
          'private-abstract-field',

          'public-field',
          'protected-field',
          'private-field',

          'static-field',
          'instance-field',
          'abstract-field',

          'field',

          'constructor',

          'public-static-method',
          'protected-static-method',
          'private-static-method',

          'public-instance-method',
          'protected-instance-method',
          'private-instance-method',

          'public-abstract-method',
          'protected-abstract-method',
          'private-abstract-method',

          'public-method',
          'protected-method',
          'private-method',

          'static-method',
          'instance-method',
          'abstract-method',

          'method',
          'signature',
        ],
      },
    ],
    '@typescript-eslint/prefer-enum-initializers': 'error',
    '@typescript-eslint/consistent-type-definitions': ['off'],
    '@typescript-eslint/prefer-namespace-keyword': ['error'],
    '@typescript-eslint/no-array-constructor': ['error'],
    '@typescript-eslint/no-empty-interface': ['error'],
    '@typescript-eslint/no-extraneous-class': ['off'],
    '@typescript-eslint/no-for-in-array': ['off'],
    '@typescript-eslint/no-inferrable-types': ['off'],
    '@typescript-eslint/no-misused-new': ['error'],
    '@typescript-eslint/no-parameter-properties': ['off'],
    '@typescript-eslint/no-require-imports': ['off'],
    '@typescript-eslint/triple-slash-reference': ['error'],
    '@typescript-eslint/no-type-alias': ['off'],
    '@typescript-eslint/no-use-before-define': [
      'error',
      {
        functions: false,
      },
    ],
    '@typescript-eslint/prefer-for-of': ['off'],
    '@typescript-eslint/prefer-function-type': ['error'],
    '@typescript-eslint/comma-spacing': ['error'],
    '@typescript-eslint/func-call-spacing': ['error'],
    '@typescript-eslint/ban-ts-comment': ['off'],
    '@typescript-eslint/ban-tslint-comment': ['off'],
    '@typescript-eslint/class-literal-property-style': ['off'], // useless
    '@typescript-eslint/consistent-indexed-object-style': ['off'], // Also modify type and interface
    '@typescript-eslint/method-signature-style': ['error'],
    '@typescript-eslint/naming-convention': ['error'],
    '@typescript-eslint/no-confusing-non-null-assertion': ['error'],
    '@typescript-eslint/no-extra-non-null-assertion': ['error'],
    '@typescript-eslint/no-non-null-asserted-optional-chain': ['error'],
    '@typescript-eslint/prefer-as-const': ['error'],
    '@typescript-eslint/prefer-literal-enum-member': ['error'],
    '@typescript-eslint/prefer-optional-chain': ['error'],
    '@typescript-eslint/prefer-ts-expect-error': ['error'],

    // Handled by prettier
    '@typescript-eslint/brace-style': ['off'],
    '@typescript-eslint/comma-dangle': ['off'],
    '@typescript-eslint/indent': ['off'],
    '@typescript-eslint/no-extra-parens': ['off'],
    '@typescript-eslint/no-extra-semi': ['off'],
    '@typescript-eslint/quotes': ['off'],
    '@typescript-eslint/semi': ['off'],
    '@typescript-eslint/space-before-function-paren': ['off'],
    '@typescript-eslint/space-infix-ops': ['off'],
    '@typescript-eslint/keyword-spacing': ['off'],

    // Fix with typescript-eslint specific rules
    'no-redeclare': 'off',
    '@typescript-eslint/no-redeclare': ['error'],
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
  },
};
