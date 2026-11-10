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
    // Generated shadcn/ui code. Re-added by `shadcn add`, so not linted.
    "src/components/ui/**",
    "src/hooks/use-mobile.ts",
    // Vendored third-party skills. Updated by copying upstream, not by us.
    ".agent/skills/**",
  ]),
]);

export default eslintConfig;
