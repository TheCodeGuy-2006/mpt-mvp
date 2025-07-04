import js from "@eslint/js";

// ESLint configuration migrated from .eslintrc.json for ESLint v9+
export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}", "!node_modules"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        alert: "readonly",
        fetch: "readonly",
        Tabulator: "readonly",
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      // Add custom rules here if needed
    },
    plugins: {}, // plugins must be an object in flat config
  },
];
