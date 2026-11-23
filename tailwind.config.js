import { heroui } from '@heroui/theme';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        subtle: 'var(--bg-subtle)',
        surface: 'var(--bg-surface)',
        'surface-hover': 'var(--bg-surface-hover)',
        'border-token': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        ink: 'var(--text-primary)',
        'ink-secondary': 'var(--text-secondary)',
        'ink-muted': 'var(--text-muted)',
        modality: {
          time: 'var(--accent-time)',
          'time-soft': 'var(--accent-time-soft)',
          'time-border': 'var(--accent-time-border)',
          reps: 'var(--accent-reps)',
          'reps-soft': 'var(--accent-reps-soft)',
          'reps-border': 'var(--accent-reps-border)',
          cardio: 'var(--accent-cardio)',
          'cardio-soft': 'var(--accent-cardio-soft)',
          'cardio-border': 'var(--accent-cardio-border)',
          mobility: 'var(--accent-mobility)',
          'mobility-soft': 'var(--accent-mobility-soft)',
          'mobility-border': 'var(--accent-mobility-border)',
          danger: 'var(--accent-danger)',
          'danger-soft': 'var(--accent-danger-soft)',
          'danger-border': 'var(--accent-danger-border)',
        },
        app: {
          bg: 'var(--bg-canvas)',
          card: 'var(--bg-surface)',
          surface: 'var(--bg-subtle)',
          border: 'var(--border-subtle)',
          primary: 'var(--accent-time)',
          secondary: 'var(--accent-reps)',
          cardio: 'var(--accent-cardio)',
          text: 'var(--text-primary)',
          textMuted: 'var(--text-muted)',
          danger: 'var(--accent-danger)',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.375rem',
        '4xl': '1.75rem',
      },
      keyframes: {
        'shimmer-sweep': {
          '0%': { transform: 'translateX(-100%)' },
          '60%, 100%': { transform: 'translateX(200%)' },
        },
      },
      animation: {
        'shimmer-sweep': 'shimmer-sweep 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: '#F4F5F7',
            foreground: '#0F172A',
            content1: '#FFFFFF',
            content2: '#EAEDF2',
            default: {
              100: '#EAEDF2',
              200: '#E4E4E7',
              foreground: '#0F172A',
            },
            primary: {
              DEFAULT: '#EA580C',
              foreground: '#FFFFFF',
            },
            secondary: {
              DEFAULT: '#0D9488',
              foreground: '#FFFFFF',
            },
            focus: '#EA580C',
          },
        },
        dark: {
          colors: {
            background: '#0D0F14',
            foreground: '#F1F5F9',
            content1: '#181C26',
            content2: '#141821',
            default: {
              100: '#141821',
              200: '#262B3A',
              foreground: '#F1F5F9',
            },
            primary: {
              DEFAULT: '#F59E0B',
              foreground: '#0D0F14',
            },
            secondary: {
              DEFAULT: '#14B8A6',
              foreground: '#0D0F14',
            },
            focus: '#F59E0B',
          },
        },
      },
    }),
  ],
};
