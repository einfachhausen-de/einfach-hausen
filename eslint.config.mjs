import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".worktrees/**",
    "scripts/*.cjs",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".gitnexus/**",
    // local build leftovers/backups (.next.bak-*, .next-OLD-*, .next-TANGLED-*):
    // untracked copies of a Next build. Not source, must never gate lint.
    ".next*/**",
    // nested full app repo (own GitHub history); must not gate this repo's lint
    "einfach-hausen/**",
    // stale agent worktrees/drops with repo copies: never lint-gate this repo
    "main-2/**",
    ".orca/**",
    "runtime-client.js",
  ]),
]);

export default eslintConfig;
