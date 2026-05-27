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
          50: '#ebf8f7',
          100: '#cfeeed',
          200: '#9fdedb',
          300: '#6ecdc8',
          400: '#3ebcb6',
          500: '#10bbb3',
          600: '#0d9892',
          700: '#0a7672',
          800: '#075452',
          900: '#053331',
        },
        accent: {
          pink: '#f76b8a',
          yellow: '#ffe596',
        },
        ink: '#212529',
        'ink-muted': '#6c757d',
        'ink-subtle': '#869ab8',
      },
      boxShadow: {
        soft: '0 10px 30px -10px rgba(16,187,179,0.25)',
      },
    },
  },
  plugins: [],
};
