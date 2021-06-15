// vite.config.js
import { resolve, dirname } from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

var files = fs.readdirSync("./src").filter((x) => x.endsWith(".html"));
console.log(files);

export default {
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/signup.html"),
        nested: resolve(__dirname, "src/login.html"),
      },
    },
  },
};
