/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,astro}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      colors: {
        primary: "rgb(172, 18, 18)",
        secondary: "rgb(210, 159, 34)",
        white: "rgb(245, 245, 245)",
        black: "rgb(25, 23, 27)",
      },
    },
  },
  plugins: [],
};
