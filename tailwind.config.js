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
      },
      boxShadow: {
        'card': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.18)',
        'btn': '0 6px 20px rgba(0, 0, 0, 0.15)',
        'btn-primary': '0 8px 24px rgba(3, 205, 140, 0.25)',
        'btn-primary-hover': '0 12px 32px rgba(3, 205, 140, 0.35)',
        'btn-accent': '0 8px 24px rgba(247, 127, 0, 0.25)',
        'btn-accent-hover': '0 12px 32px rgba(247, 127, 0, 0.35)',
      },
      ringColor: {
        'evz-orange': 'rgba(247, 127, 0, 0.25)',
      }
    }
  },
  plugins: []
};
