/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'space-black': '#0a0a1a',
        'neon-cyan': '#00ff88',
        'electric-purple': '#8b5cf6',
        'solar-orange': '#ff6b35',
        'plasma-red': '#ff0055',
        'hud-cyan': '#00f0ff',
        'hud-blue': '#0080ff',
        'hud-green': '#00ff9d',
        'hud-orange': '#ff9500',
        'hud-red': '#ff2d55',
        'hud-purple': '#bf5af2',
      },
      fontFamily: {
        sans: ['Rajdhani', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'hud-flicker': 'hud-flicker 4s ease-in-out infinite',
        'scan-line': 'scan-line 3s linear infinite',
        'data-stream': 'data-stream 2s linear infinite',
        'border-flow': 'border-flow 3s linear infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        'targeting': 'targeting 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 240, 255, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.6)' },
        },
        'hud-flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.97' },
          '52%': { opacity: '1' },
          '53%': { opacity: '0.94' },
          '54%': { opacity: '1' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'data-stream': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        },
        'border-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        'targeting': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
      },
      backgroundImage: {
        'hud-gradient': 'linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(0, 128, 255, 0.05) 100%)',
        'hud-border': 'linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.5), transparent)',
      },
    },
  },
  plugins: [],
};
