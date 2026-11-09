/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Hind Siliguri"', '"Poppins"', 'sans-serif'],
        english: ['"Poppins"', '"Hind Siliguri"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
