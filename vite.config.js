import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

export default defineConfig((ctx) => {
  const IS_PRODUCTION = ctx.mode === "production";

  const tsConfig = IS_PRODUCTION ? "tsconfig.prod.json" : "tsconfig.dev.json";

  return {
    plugins: [
      checker({
        typescript: {
          tsconfigPath: tsConfig,
        },
        lintCommand: 'eslint "./src/**/*.{ts}"',
      }),
    ],
  };
});
