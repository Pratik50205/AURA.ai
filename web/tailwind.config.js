/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // AURA Brand Colors (from logo - red to orange gradient)
        aura: {
          primary: '#D9042B',        // Deep Premium Red
          'primary-vibrant': '#FF3344', // Vibrant Red
          accent: '#FF7B00',          // Clean Orange
          'gradient-start': '#D9042B',
          'gradient-mid': '#FF3344',
          'gradient-end': '#FF7B00',
        },
        // Semantic colors (dark theme)
        background: '#0a0a0f',
        surface: '#13131a',
        'surface-elevated': '#1a1a24',
        primary: '#D9042B',
        'primary-hover': '#FF3344',
        secondary: '#FF7B00',
        accent: '#FF7B00',
        muted: '#71717a',
        border: '#2a2a3a',
        card: '#13131a',
        'card-border': '#2a2a3a',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(217, 4, 43, 0.3)',
        'glow-primary-lg': '0 0 40px rgba(217, 4, 43, 0.5)',
        'glow-accent': '0 0 20px rgba(255, 123, 0, 0.3)',
        'glow-gradient': '0 0 30px rgba(217, 4, 43, 0.4), 0 0 60px rgba(255, 123, 0, 0.2)',
      },
      backgroundImage: {
        'gradient-aura': 'linear-gradient(to right, #D9042B, #FF3344, #FF7B00)',
        'gradient-aura-vertical': 'linear-gradient(to bottom, #D9042B, #FF3344, #FF7B00)',
        'gradient-aura-radial': 'radial-gradient(at 0% 0%, hsla(355, 98%, 43%, 0.15) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(355, 100%, 51%, 0.1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(24, 100%, 50%, 0.1) 0, transparent 50%)',
      },
    },
  },
  plugins: [],
}
