// vite.config.js
import { resolve, dirname } from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { minifyHtml } from "vite-plugin-html";

const __dirname = dirname(fileURLToPath(import.meta.url));

var files = fs.readdirSync("./src").filter((x) => x.endsWith(".html"));
let inputs = {};
for (let i = 0; i < files.length; i++) {
  let file = files[i].substr(0, files[i].length - 5);
  inputs[file] = resolve(__dirname, `src/${files[i]}`);
}
console.log(inputs);

/**
 * @type {import('vite').UserConfig}
 */
const config = {
  plugins: [minifyHtml()],
  build: {
    rollupOptions: {
      input: inputs,
      output: {
        manualChunks: undefined,
      },
    },
  },
};

export default config;
