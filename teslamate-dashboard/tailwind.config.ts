/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'tm-bg': '#0a0e17',
        'tm-panel': '#111827',
        'tm-panel-light': '#1a2332',
        'tm-border': '#1e3a5f',
        'tm-green': '#00ff41',
        'tm-cyan': '#00d4ff',
        'tm-orange': '#ff6b35',
        'tm-red': '#ff2d55',
        'tm-yellow': '#ffd700',
        'tm-text': '#e0e7ff',
        'tm-text-dim': '#6b7fa3',
        'tm-purple': '#a855f7',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 10px rgba(0, 255, 65, 0.3), 0 0 20px rgba(0, 255, 65, 0.1)',
        'glow-cyan': '0 0 10px rgba(0, 212, 255, 0.3), 0 0 20px rgba(0, 212, 255, 0.1)',
        'glow-orange': '0 0 10px rgba(255, 107, 53, 0.3), 0 0 20px rgba(255, 107, 53, 0.1)',
        'glow-red': '0 0 10px rgba(255, 45, 85, 0.3), 0 0 20px rgba(255, 45, 85, 0.1)',
      },
      keyframes: {
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'data-scroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'scan-line': 'scan-line 8s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'data-scroll': 'data-scroll 30s linear infinite',
      },
    },
  },
  plugins: [],
};
