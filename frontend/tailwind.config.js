/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Space Command theme colors from gameart
        'space': {
          'dark': '#0a0c14',
          'darker': '#060810',
          'panel': '#0d1424',
          'border': '#1a2744',
        },
        'galactic': {
          'blue': '#0ea5e9',
          'cyan': '#22d3ee',
          'light': '#67e8f9',
          'glow': '#00b4d8',
        },
        'energy': {
          'yellow': '#fbbf24',
          'gold': '#d4a00a',
          'amber': '#f59e0b',
        },
        'metallic': {
          'silver': '#94a3b8',
          'steel': '#475569',
          'dark': '#1e293b',
        },
        'neon-cyan': '#00ff88',
        'electric-purple': '#8b5cf6',
        'solar-orange': '#ff6b35',
        'plasma-red': '#ff0055',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Orbitron', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'space-gradient': 'linear-gradient(180deg, #0a0c14 0%, #0d1424 50%, #060810 100%)',
        'panel-gradient': 'linear-gradient(135deg, rgba(13, 20, 36, 0.9) 0%, rgba(10, 12, 20, 0.95) 100%)',
        'button-gradient': 'linear-gradient(180deg, #1a2744 0%, #0d1424 100%)',
        'button-hover': 'linear-gradient(180deg, #243454 0%, #1a2744 100%)',
        'cyan-glow': 'radial-gradient(ellipse at center, rgba(34, 211, 238, 0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'panel': '0 0 20px rgba(34, 211, 238, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'button': '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'cyan-glow': '0 0 20px rgba(34, 211, 238, 0.3), 0 0 40px rgba(34, 211, 238, 0.1)',
        'gold-glow': '0 0 20px rgba(251, 191, 36, 0.3), 0 0 40px rgba(251, 191, 36, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(34, 211, 238, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(34, 211, 238, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
};
