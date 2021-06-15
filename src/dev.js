import postcss from "postcss";
import tailwind from "tailwindcss";
import { readFileSync } from "fs";

postcss([tailwind])
  .process(readFileSync("./src/styles.css"), {
    from: "/src/styles.css",
    to: "/public/styles.css",
  })
  .then((result) => {});
