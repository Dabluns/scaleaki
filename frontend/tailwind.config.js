/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'monospace'],
      },
      colors: {
        // Emerald palette oficial ScaleAki (LP scaleaki03)
        primary: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',  // PRIMARY (color-primary)
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        bg:      '#020c08',  // color-bg (dark)
        surface: '#071a12',  // color-surface
        text:    '#f0fdf4',  // color-text
        muted:   '#8b9e94',  // color-text-muted
        border:  'rgba(255,255,255,0.08)',
        plus:    '#a855f7',  // Selo Scaleaki+
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)",
        'emerald-glow': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(16,185,129,0.18), transparent)',
      },
      backgroundSize: {
        'grid': '72px 72px',
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      boxShadow: {
        'glass': '0 20px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        'btn-emerald': '0 10px 40px -10px rgba(16,185,129,0.7), inset 0 1px 0 rgba(255,255,255,0.3)',
        'btn-emerald-hover': '0 20px 50px -10px rgba(16,185,129,1), inset 0 1px 0 rgba(255,255,255,0.4)',
      },
      animation: {
        'fade-up': 'fadeUp 600ms cubic-bezier(.16,1,.3,1) both',
        'float': 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-14px)' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.4' },
          '50%':     { opacity: '0.85' },
        },
        borderGlow: {
          '0%,100%': { borderColor: 'rgba(16,185,129,0.2)', boxShadow: '0 0 20px rgba(16,185,129,0.05)' },
          '50%':     { borderColor: 'rgba(16,185,129,0.5)', boxShadow: '0 0 40px rgba(16,185,129,0.15)' },
        },
      },
    },
  },
  plugins: [],
};