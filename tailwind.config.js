/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b1020',
        panel: '#151a2e',
        panel2: '#1c2240',
        border: '#252b48',
        accent: '#7c5cff',
        accent2: '#22d3ee',
        good: '#22c55e',
        warn: '#f59e0b',
      },
    },
  },
  plugins: [],
}
