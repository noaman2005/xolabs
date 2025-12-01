/**** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#05070a',
        sidebar: '#111318',
        surface: '#151820',
        accent: {
          DEFAULT: '#14b8a6',
          soft: '#0f766e',
        },
      },
      borderRadius: {
        lg: '0.75rem',
      },
    },
  },
  plugins: [],
}
