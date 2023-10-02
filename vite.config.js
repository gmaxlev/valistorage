import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import { resolve } from "path";

export default defineConfig((ctx) => {
  const IS_PRODUCTION = ctx.mode === "production";

  const tsConfig = IS_PRODUCTION ? "tsconfig.prod.json" : "tsconfig.dev.json";

  return {
    build: {
      lib: {
        entry: resolve(__dirname, "src/main.ts"),
        name: "MyLib",
        fileName: "my-lib",
      },
    },
    plugins: [
      checker({
        typescript: {
          tsconfigPath: tsConfig,
        },
        lintCommand: 'eslint "./src/**/*.{ts}"',
      }),
    ],
    test: {
      environment: "jsdom",
    },
  };
});
