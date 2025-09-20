import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from 'typescript-eslint'; // --- NEW: Import the plugin

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  
  // --- NEW: Add the TypeScript ESLint plugin configuration ---
  ...tseslint.configs.recommended,

  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      "react/no-unescaped-entities": "warn",
      // This will now work because the plugin is loaded
      "@typescript-eslint/no-unused-vars": "warn", 
    },
  },
];

export default eslintConfig;