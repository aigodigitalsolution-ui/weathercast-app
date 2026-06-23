import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

export default compat.config({
  extends: ["next/core-web-vitals", "next/typescript"],
  plugins: {
    "@typescript-eslint": typescriptEslint,
  },
  languageOptions: {
    parser: tsParser,
  },
  rules: {
    // Add custom rules here
  },
});
