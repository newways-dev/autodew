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
    // Trigger.dev's local build cache (bundled/minified worker code, not
    // source) — without this, `npm run lint` also lints its output and
    // buries real findings under tens of thousands of generated-code ones.
    ".trigger/**",
  ]),
]);

export default eslintConfig;
