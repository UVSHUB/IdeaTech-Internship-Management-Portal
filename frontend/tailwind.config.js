const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "theme-gradient": "linear-gradient(135deg, #09090b 0%, #27272a 100%)",
        "dark-theme-gradient": "linear-gradient(135deg, #000000 0%, #18181b 100%)",
      },
      colors: {
        primary: colors.zinc,
        purple: colors.neutral,
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
