module.exports = {
  extends: ['../../eslint.config.js'],
  env: {
    node: true,
    es2020: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Node.js specific rules
    'no-console': 'off', // Allow console.log in backend
    '@typescript-eslint/no-var-requires': 'off', // Allow require() when needed
  },
}; 