/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        evz: {
          green: '#03CD8C',
          orange: '#F77F00',
          light: '#F2F2F2',
          grey: '#A6A6A6'
        }
      },
      borderRadius: {
        '4xl': '2rem'
      }
    }
  },
  plugins: []
};
