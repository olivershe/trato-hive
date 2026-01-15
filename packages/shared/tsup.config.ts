import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: false, // Disable tree-shaking for shared library - export everything
  minify: false,
  esbuildOptions(options) {
    // Force preserve all exports, don't tree-shake anything
    options.treeShaking = false;
    options.ignoreAnnotations = true; // Ignore /* @__PURE__ */ annotations
  },
});
