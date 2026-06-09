/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        cyber: {
          bg: '#020408',
          surface: '#080e16',
          panel: '#0d1824',
          border: '#0f2133',
          accent: '#00d4ff',
          green: '#00ff88',
          red: '#ff2052',
          yellow: '#ffb800',
          purple: '#a855f7',
          text: '#c8d8e8',
          muted: '#4a6070',
        }
      },
      animation: {
        'scan-line': 'scanLine 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'fade-up': 'fadeUp 0.5s ease forwards',
        'terminal-blink': 'terminalBlink 1s step-end infinite',
        'radar': 'radar 3s linear infinite',
        'matrix-rain': 'matrixRain 10s linear infinite',
      },
      keyframes: {
        scanLine: {
          '0%, 100%': { transform: 'translateY(-100%)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px #00d4ff40' },
          '50%': { boxShadow: '0 0 20px #00d4ff80, 0 0 40px #00d4ff40' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        terminalBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        radar: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      backgroundImage: {
        'grid-cyber': 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
        'gradient-cyber': 'linear-gradient(135deg, #00d4ff10 0%, transparent 50%, #00ff8808 100%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      }
    },
  },
  plugins: [],
}
