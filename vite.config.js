import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import { terser } from "rollup-plugin-terser";

export default defineConfig((ctx) => {
  const IS_PRODUCTION = ctx.mode === "production";

  const tsConfig = IS_PRODUCTION ? "tsconfig.prod.json" : "tsconfig.dev.json";

  return {
    build: {
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        fileName: "index",
        formats: ["es"],
      },
      rollupOptions: {
        plugins: [terser()],
      }
    },
    plugins: [
      checker({
        typescript: {
          tsconfigPath: tsConfig,
        },
        lintCommand: 'eslint "./src/**/*.{ts}"',
      }),
      dts({ rollupTypes: true }),
    ],
    test: {
      environment: "jsdom",
    },
  };
});
