import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["worker-configuration.d.ts", ".wrangler/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // container/ は workerd ではなく Node ランタイムで動くため、Node グローバルを許可する。
  {
    files: ["container/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        process: "readonly",
        Buffer: "readonly",
        console: "readonly",
        URL: "readonly",
      },
    },
  }
);
