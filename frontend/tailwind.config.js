/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        subway: {
          '1': '#EE352E',
          '2': '#EE352E',
          '3': '#EE352E',
          '4': '#00933C',
          '5': '#00933C',
          '6': '#00933C',
          'A': '#0039A6',
          'C': '#0039A6',
          'E': '#0039A6',
        }
      }
    },
  },
  plugins: [],
}

