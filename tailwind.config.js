/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nex-orange': '#FF6B35',
        'nex-pink': '#FF1493',
        'nex-blue': '#0B1220', // Dark background (RGB: 11, 18, 32)
        'nex-dark': '#0d1440',
        'nex-black': '#000000', // Logo background color
        // Keep admin colors for backward compatibility
        'admin-primary': '#FF6B35', // Using nex-orange
        'admin-secondary': '#FF1493', // Using nex-pink
        'admin-dark': '#000000', // Using black (logo bg color)
        'admin-gray': '#1e293b',
        'admin-light': '#f1f5f9',
      },
      backgroundImage: {
        'gradient-nex': 'linear-gradient(to right, #FF6B35, #FF1493)',
        'gradient-nex-vertical': 'linear-gradient(to bottom, #FF6B35, #FF1493)',
      },
    },
  },
  plugins: [],
}
