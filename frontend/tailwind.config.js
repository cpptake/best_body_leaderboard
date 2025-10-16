/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f9ff',
          100: '#b3edff',
          200: '#80e1ff',
          300: '#4dd5ff',
          400: '#20beff', // メインカラー
          500: '#00a8ed',
          600: '#0092d1',
          700: '#007cb5',
          800: '#006699',
          900: '#00507d',
        },
      },
    },
  },
  plugins: [],
}
