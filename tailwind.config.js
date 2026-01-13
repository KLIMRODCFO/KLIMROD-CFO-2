// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        primary: {
          DEFAULT: '#181f2c',
          light: '#232c3d',
        },
        accent: '#e11d48',
        bg: '#f7f8fa',
      },
      borderRadius: {
        xl: '1rem',
      },
      boxShadow: {
        card: '0 2px 8px 0 rgba(24,31,44,0.06)',
      },
    },
  },
  plugins: [],
};
