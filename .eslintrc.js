module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:node/recommended',
    'plugin:prettier/recommended',
  ],

  plugins: ['node', 'filenames', 'prettier'],

  // add your custom rules here
  rules: {
    'prefer-const': 'error',
    'no-var': 'error',

    // Turn off this rule as it is needed for web-component-lib integration (Nuxt.js doesn't like ESM files, yet)
    'import/no-webpack-loader-syntax': 'off',
    'import/no-unresolved': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODnE_ENV === 'production' ? 'error' : 'off',

    // Turn off node/no-unsupported-features because it complains about import & export
    'node/no-unsupported-features': 'off',

    // Avoid one-line if and else statements
    curly: ['error', 'all'],

    'filenames/match-regex': ['error', /^(_*[a-z0-9.]+)([A-Z][a-z0-9.]+)*$/g], // Added an '_*' to support Nuxt _something.vue pages
    'filenames/match-exported': ['error', 'camel'],
    'filenames/no-index': 'off',

    "prettier/prettier": "error"
  },
};
