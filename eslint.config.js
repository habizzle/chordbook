import js from '@eslint/js';

const browserGlobals = {
    window: 'readonly',
    document: 'readonly',
    localStorage: 'readonly',
    fetch: 'readonly',
    URL: 'readonly',
    URLSearchParams: 'readonly',
    Event: 'readonly',
    requestAnimationFrame: 'readonly',
    performance: 'readonly',
    navigator: 'readonly',
};

const nodeGlobals = {
    process: 'readonly',
    Buffer: 'readonly',
    console: 'readonly',
    __dirname: 'readonly',
};

export default [
    {
        ignores: ['node_modules/', 'packages/web/test/fixtures*/', 'packages/parser/test/fixtures*/'],
    },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            globals: {...browserGlobals, ...nodeGlobals},
        },
        rules: {
            'no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
        },
    },
];
