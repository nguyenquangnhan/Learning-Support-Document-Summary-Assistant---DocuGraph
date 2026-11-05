/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        violet: {
          500: "#8B5CF6",
          600: "#7C3AED",
        },
        node: {
          concept: "#10B981", // Emerald
          formula: "#F59E0B", // Amber
          warning: "#EF4444", // Red
        }
      },
    },
  },
  plugins: [],
};

