/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Cairo"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#E6F8F3',
          100: '#C2EEE3',
          200: '#92DECB',
          300: '#5FC9B0',
          400: '#36BC9D',
          500: '#1ABC9C',
          600: '#13A085',
          700: '#0F846E',
          800: '#0C6B5A',
          900: '#084A3F',
        },
        accent: {
          pink: '#f76b8a',
          yellow: '#FFE9A8',
          yellowText: '#7C5B12',
          blue: '#BCC9E8',
          blueText: '#3A4670',
        },
        ink: '#212529',
        'ink-muted': '#6c757d',
        'ink-subtle': '#869ab8',
      },
      boxShadow: {
        soft: '0 10px 30px -10px rgba(26,188,156,0.28)',
      },
    },
  },
  plugins: [],
};
