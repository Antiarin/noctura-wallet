import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "public/**",
      "docs/**",
      "next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        process: "readonly",
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        Request: "readonly",
        Response: "readonly",
        RequestInit: "readonly",
      },
    },
    settings: { react: { version: "detect" } },
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
