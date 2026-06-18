/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        kopi: {
          dark:  '#0A1A08',
          green: '#1A3810',
          leaf:  '#4ADE80',
          gold:  '#C9A84C',
          bean:  '#5D4037',
        },
      },
    },
  },
  plugins: [],
}
