import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: {
          100: 'var(--bg-100)',
          150: 'var(--bg-150)',
          200: 'var(--bg-200)',
          300: 'var(--bg-300)',
        },
        text: {
          100: 'var(--text-100)',
          200: 'var(--text-200)',
          300: 'var(--text-300)',
          400: 'var(--text-400)',
        },
        accent: {
          100: 'var(--accent-100)',
          200: 'var(--accent-200)',
        },
        border: {
          100: 'var(--border-100)',
          200: 'var(--border-200)',
        },
        success: 'var(--success)',
        error: 'var(--error)',
        warning: 'var(--warning)',
      },
      fontFamily: {
        ui: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['Source Code Pro', 'Fira Code', 'SF Mono', 'Monaco', 'monospace'],
      },
      animation: {
        'thinking-pulse': 'thinking-pulse 2s ease-in-out infinite',
        'cursor-blink': 'cursor-blink 800ms step-end infinite',
        'skeleton-shimmer': 'skeleton-shimmer 1.5s ease-in-out infinite',
        'spin-slow': 'spin 1.5s linear infinite',
        'dot-bounce': 'dot-bounce 1.4s ease-in-out infinite',
        'send-press': 'send-press 300ms ease',
        'send-ready': 'send-ready 200ms ease',
        'check-pop': 'check-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'drop-pulse': 'drop-pulse 1.2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config
