/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        diary: {
          pink: '#f4a0b5',
          rose: '#e07a9a',
          peach: '#fce8ef',
          dark: '#3d2535',
        }
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
