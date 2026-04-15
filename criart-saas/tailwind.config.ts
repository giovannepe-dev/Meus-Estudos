import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      colors: {
        lp: {
          base: 'var(--lp-base)', surface: 'var(--lp-surface)',
          'surface-2': 'var(--lp-surface-2)', 'surface-3': 'var(--lp-surface-3)',
          border: 'var(--lp-border)', 'border-2': 'var(--lp-border-2)',
          ink: 'var(--lp-ink)', 'ink-2': 'var(--lp-ink-2)',
          'ink-3': 'var(--lp-ink-3)', 'ink-4': 'var(--lp-ink-4)',
          violet: 'var(--lp-violet)', 'violet-light': 'var(--lp-violet-light)',
          'violet-pale': 'var(--lp-violet-pale)', 'violet-deep': 'var(--lp-violet-deep)',
          amber: 'var(--lp-amber)', 'amber-pale': 'var(--lp-amber-pale)',
          success: 'var(--lp-success)', 'success-pale': 'var(--lp-success-pale)',
          danger: 'var(--lp-danger)', 'danger-pale': 'var(--lp-danger-pale)',
        },
      },
      borderRadius: { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)', xl: 'var(--radius-xl)' },
      boxShadow: { sm: 'var(--shadow-sm)', md: 'var(--shadow-md)', lg: 'var(--shadow-lg)', violet: 'var(--shadow-violet)' },
      animation: {
        'fade-in': 'fadeIn 300ms ease forwards',
        'slide-up': 'slideUp 350ms cubic-bezier(.34,1.56,.64,1) forwards',
        'slide-down': 'slideDown 300ms ease forwards',
        'scale-in': 'scaleIn 200ms ease forwards',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
export default config
