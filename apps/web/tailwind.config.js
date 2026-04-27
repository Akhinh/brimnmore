/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#DC2626',
          'red-dark': '#B91C1C',
          'red-light': '#FEE2E2',
          black: '#111111',
          'black-soft': '#1E1E1E',
          'black-muted': '#2D2D2D',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F7F7F7',
          3: '#EFEFEF',
          dark: '#111111',
          'dark-2': '#1A1A1A',
          'dark-3': '#252525',
        },
        text: {
          DEFAULT: '#111111',
          muted: '#6B6B6B',
          faint: '#9E9E9E',
          inverse: '#FFFFFF',
        }
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px 0 rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.1)',
        'modal': '0 20px 60px 0 rgba(0,0,0,0.2)',
        'red': '0 4px 14px 0 rgba(220,38,38,0.3)',
      }
    },
  },
  plugins: [],
};
