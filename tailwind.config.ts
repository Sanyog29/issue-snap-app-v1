import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'var(--font-deva)',
          'var(--font-telu)',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          ink: 'var(--primary-ink)',
          foreground: 'var(--on-primary)',
        },
        'on-primary': 'var(--on-primary)',
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--on-accent)',
        },
        'on-accent': 'var(--on-accent)',
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        ink: { DEFAULT: 'var(--ink)', muted: 'var(--ink-muted)' },
        line: { DEFAULT: 'var(--line)', soft: 'var(--line-soft)' },
        green: 'var(--green)',
        amber: 'var(--amber)',
        red: 'var(--red)',
        focus: 'var(--focus)',
        // shadcn compatibility tokens mapped to design system variables
        background: 'var(--bg)',
        foreground: 'var(--ink)',
        card: { DEFAULT: 'var(--surface)', foreground: 'var(--ink)' },
        popover: { DEFAULT: 'var(--surface)', foreground: 'var(--ink)' },
        secondary: { DEFAULT: 'var(--surface)', foreground: 'var(--ink)' },
        muted: { DEFAULT: 'var(--surface)', foreground: 'var(--ink-muted)' },
        destructive: { DEFAULT: 'var(--red)', foreground: '#FFFFFF' },
        border: 'var(--line-soft)',
        input: 'var(--line-soft)',
        ring: 'var(--primary)',
      },
      borderRadius: {
        control: '10px',
        photo: '12px',
        sheet: '20px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
