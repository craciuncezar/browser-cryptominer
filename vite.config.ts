import { resolve } from "path";
import obfuscator from "rollup-plugin-obfuscator";
import { defineConfig } from "vite";

const root = resolve(__dirname, "src");
const outDir = resolve(__dirname, "dist");

export default defineConfig({
  root,
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      plugins: [
        obfuscator({
          fileOptions: {
            compact: true,
            controlFlowFlattening: true,
            deadCodeInjection: true,
            disableConsoleOutput: true,
            renameGlobals: true,
            rotateStringArray: true,
            shuffleStringArray: true,
            splitStrings: true,
            splitStringsChunkLength: 5,
            stringArray: true,
            transformObjectKeys: true,
          },
        }),
      ],
      input: {
        main: resolve(root, "index.html"),
        about: resolve(root, "about", "index.html"),
        iframe: resolve(root, "iframe", "index.html"),
      },
    },
  },
});
