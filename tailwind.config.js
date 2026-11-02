/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crm: {
          dark: '#0a0f1d',
          card: '#111827',
          border: '#1f2937',
          accent: '#10b981', // Emerald
        }
      }
    },
  },
  plugins: [],
}
