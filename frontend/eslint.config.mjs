import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // This part loads all the default Next.js rules
  ...compat.extends("next/core-web-vitals"),

  // This part specifies files to ignore
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },

  // --- THIS IS THE NEW PART ---
  // This object overrides specific rules from the configurations above.
  {
    rules: {
      // Option 1 (Recommended): Downgrades the error to a warning.
      // Your build will pass, but you'll still be reminded of the issue.
      "react/no-unescaped-entities": "warn",

      // Option 2 (Your suggestion): Turns the rule off completely.
      // "react/no-unescaped-entities": "off",

      // This rule addresses the "unused variable" warnings.
      // We set it to "warn" so it doesn't fail the build but still informs you.
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];

export default eslintConfig;