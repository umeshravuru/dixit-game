/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // "Gallery" palette — warm paper, deep ink, a single confident coral accent.
        paper: '#f4f1ea',
        card: '#fbfaf6',
        ink: '#1c1a1e',
        muted: '#6b6570',
        line: '#e3ddd0',
        coral: '#e0533d',
        coralink: '#c23d29',
        sage: '#3f7a6d',
        gold: '#b98a2e',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        frame: '0 1px 2px rgba(28,26,30,0.06), 0 12px 32px -12px rgba(28,26,30,0.28)',
        lift: '0 2px 4px rgba(28,26,30,0.08), 0 24px 48px -16px rgba(28,26,30,0.4)',
        inset: 'inset 0 0 0 1px rgba(28,26,30,0.06)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
