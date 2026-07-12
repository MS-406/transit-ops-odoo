/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'uber-black': '#000000',
        'uber-white': '#FFFFFF',
        'uber-gray-900': '#14161A',
        'uber-gray-100': '#F6F6F6',
        'uber-gray-300': '#E2E2E2',
        'uber-green': '#06C167',
        'uber-blue': '#276EF1',
        'uber-red': '#E11900',
        'uber-amber': '#FFC043',
      },
      fontFamily: {
        sans: ['"Uber Move Text"', 'Inter', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

