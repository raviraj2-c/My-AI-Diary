/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sky: {
          DEFAULT: '#87CEEB',
          50: '#F4FAFD',
          100: '#E6F4FA',
          200: '#C6E7F5',
          300: '#87CEEB',
          400: '#5BBCE4',
          500: '#0EA5E9',
          700: '#0369A1',
        },
        primary: {
          DEFAULT: '#87CEEB',
          50: '#F4FAFD',
          100: '#E6F4FA',
          200: '#C6E7F5',
          300: '#87CEEB',
          400: '#5BBCE4',
          500: '#0EA5E9',
          700: '#0369A1',
        },
        ink: {
          DEFAULT: '#0A0A0A',
          950: '#0A0A0A',
          900: '#171717',
          800: '#262626',
        },
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'ui-serif', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.5' }],
        lg: ['20px', { lineHeight: '1.5' }],
        xl: ['28px', { lineHeight: '1.5' }],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '12px',
        card: '12px',
        chip: '999px',
      },
    },
  },
  plugins: [],
};
