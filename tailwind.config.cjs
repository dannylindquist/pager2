const theme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");
module.exports = {
  mode: "jit",
  purge: ["./src/**/*.{js,html}"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        sans: [...theme.fontFamily.sans],
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
