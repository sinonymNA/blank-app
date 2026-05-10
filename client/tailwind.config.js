/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      colors: {
        bg: '#FAFAFA',
        'bg-dark': '#F4F4F5',
        card: '#FFFFFF',
        sidebar: '#18181B',
        text: '#18181B',
        'text-mid': '#71717A',
        'text-light': '#A1A1AA',
        accent: '#6366F1',
        'accent-soft': '#EEF2FF',
        border: '#E4E4E7',
        'border-mid': '#D4D4D8'
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 16px rgba(0,0,0,0.08)',
        lg: '0 8px 32px rgba(0,0,0,0.12)'
      }
    }
  },
  plugins: []
};
