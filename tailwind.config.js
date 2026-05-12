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
          green: '#2d4635', // 짙은 초록
          leaf: '#4a6741',  // 중간 초록
          brown: '#8b5e3c', // 브라운 포인트
          cream: '#fdfaf5', // 배경색 (크림/미색)
          dark: '#1a241e',  // 아주 짙은 텍스트용 초록
        }
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
