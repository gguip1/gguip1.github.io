/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0908',
        'ink-soft': '#2a2823',
        paper: '#f3ece0',
        'paper-deep': '#ebe2d1',
        mist: '#efe9dc',
        'mist-deep': '#e4dccb',
        'mist-cool': '#e8e6df',
        stamp: '#b0220f',
        'stamp-hot': '#ff5a3d',
        vermillion: '#a53a20',
        ghost: '#5c5446',
        'rule-soft': '#d6cdb9',
      },
      fontFamily: {
        serif: ['"Noto Serif KR"', 'Georgia', 'serif'],
        sans: [
          '"IBM Plex Sans KR"',
          'Inter',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        hero: 'clamp(3.5rem, 11vw, 10rem)',
        display: 'clamp(3rem, 10vw, 9rem)',
        mega: 'clamp(4rem, 13vw, 12rem)',
        ultra: 'clamp(5rem, 17vw, 16rem)',
      },
      letterSpacing: {
        'tightest-kr': '-0.04em',
      },
      keyframes: {
        'fade-rise': {
          '0%': { opacity: '0', transform: 'translateY(2rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'reveal-up': {
          '0%': { opacity: '0', transform: 'translateY(1rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'rule-grow': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        'marquee-x': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'mesh-drift': {
          '0%': { transform: 'translate3d(0,0,0) scale(1)' },
          '100%': { transform: 'translate3d(3%, -2%, 0) scale(1.04)' },
        },
      },
      animation: {
        'fade-rise': 'fade-rise 0.9s cubic-bezier(0.2, 0.7, 0.1, 1) both',
        'reveal-up': 'reveal-up 0.9s cubic-bezier(0.2, 0.7, 0.1, 1) both',
        'rule-grow': 'rule-grow 1.4s cubic-bezier(0.2, 0.7, 0.1, 1) both',
        'marquee-x': 'marquee-x 60s linear infinite',
        'mesh-drift': 'mesh-drift 24s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
}
