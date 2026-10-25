/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0F',
        card: '#13131C',
        elevated: '#1B1B28',
        line: '#2A2A3C',
        primary: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
          deep: '#5B21B6'
        },
        accent: '#EC4899',
        ink: {
          DEFAULT: '#F4F4F8',
          secondary: '#A1A1B5',
          muted: '#6B6B80'
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 28px rgba(139, 92, 246, 0.25)',
        'glow-sm': '0 0 16px rgba(139, 92, 246, 0.18)'
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #8B5CF6, #EC4899)'
      }
    }
  },
  plugins: []
};
