import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    "**/*.d.ts",
  ]),
]);

export default eslintConfig;
