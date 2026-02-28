/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      colors: {
        ink: "#0D0F12",
        surface: "#F7F6F3",
        card: "#FFFFFF",
        accent: "#FF5C35",
        "accent-light": "#FFF0EC",
        muted: "#8A8F98",
        border: "#E4E2DC",
      },
    },
  },
  plugins: [],
};
