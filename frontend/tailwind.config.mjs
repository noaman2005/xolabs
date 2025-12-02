/**** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        background: '#050910',
        sidebar: '#11131a',
        surface: '#151824',
        surfaceSoft: '#1b2030',
        accent: {
          DEFAULT: '#5865F2',
          soft: '#3f4bd9',
        },
        accentSecondary: '#3AB5CC',
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        'soft-elevated': '0 18px 45px rgba(0,0,0,0.45)',
        'soft-inner': 'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      transitionTimingFunction: {
        'snappy': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '220ms',
      },
      keyframes: {
        'press': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.96)' },
          '100%': { transform: 'scale(1)' },
        },
        'pop': {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        press: 'press 160ms var(--tw-ease-snappy)',
        pop: 'pop 180ms var(--tw-ease-snappy)',
        'slide-in-left': 'slide-in-left 200ms var(--tw-ease-snappy)',
        'fade-in': 'fade-in 200ms ease-out',
      },
    },
  },
  plugins: [],
}
