import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored, minified third-party agent skill scripts.
    ".github/skills/**",
    // Playwright output.
    "tests/e2e/.report/**",
    "tests/e2e/.results/**",
  ]),
  // Playwright fixtures receive a callback named `use`, which the React Hooks rule mistakes for a hook.
  { files: ["tests/e2e/**/*.ts"], rules: { "react-hooks/rules-of-hooks": "off" } },
]);

export default eslintConfig;
