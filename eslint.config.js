module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  overrides: [
    // Backend TypeScript files
    {
      files: ['backend/src/**/*.ts'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'warn',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        'no-console': ['warn', { allow: ['warn', 'error'] }],
      },
    },
    // Frontend TypeScript files
    {
      files: ['frontend/src/**/*.ts'],
      parserOptions: {
        project: ['./frontend/tsconfig.json'],
        createDefaultProgram: true,
      },
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        '@angular-eslint/recommended',
        '@angular-eslint/template/process-inline-templates',
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@angular-eslint/directive-selector': [
          'error',
          {
            type: 'attribute',
            prefix: 'app',
            style: 'camelCase',
          },
        ],
        '@angular-eslint/component-selector': [
          'error',
          {
            type: 'element',
            prefix: 'app',
            style: 'kebab-case',
          },
        ],
      },
    },
    // Frontend HTML files
    {
      files: ['frontend/src/**/*.html'],
      extends: ['@angular-eslint/template/recommended'],
      rules: {},
    },
  ],
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '**/*.js',
    'backend/dist/',
    'frontend/dist/',
    'coverage/',
  ],
};