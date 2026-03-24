/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Forge & Octagon – Industrial Luxury Palette
        // Primary accent: Burnished Forge Gold (replaces neon green, kept for backward compat)
        'neon-green': '#C9A84C',
        // Danger / loss accent: Deep Oxblood (replaces alert red)
        'alert-red': '#8B2020',
        // Backgrounds – matte dark charcoals
        'dark-bg': '#09090B',
        'dark-secondary': '#111318',
        'dark-tertiary': '#1A1C24',
        // New explicit tokens
        'forge-gold': '#C9A84C',
        'burnished': '#A07830',
        'steel': '#7B8FA5',
        'iron': '#2E3140',
        'oxblood': '#8B2020',
        'gunmetal': '#1A1C24',
        'ash': '#4A505E',
        'concrete': '#161820',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
        oswald: ['Oswald', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
