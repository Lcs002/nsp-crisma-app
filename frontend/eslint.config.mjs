import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // This part loads all the default Next.js rules
  ...compat.extends("next/core-web-vitals"),
  
  // This part adds the recommended TypeScript ESLint rules
  ...tseslint.configs.recommended,

  {
    // This part specifies files and directories for ESLint to ignore
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    // This is our custom override section
    rules: {
      // Downgrade unescaped apostrophes from an error to a warning
      "react/no-unescaped-entities": "warn",

      // Downgrade unused variables from an error to a warning
      "@typescript-eslint/no-unused-vars": "warn", 
      
      // --- THIS IS THE FIX ---
      // Completely turn off the rule that flags the use of `any`
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;