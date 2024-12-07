/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        bobbing: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-3px)' },
          '50%': { transform: 'translateX(3px)' },
          '75%': { transform: 'translateX(-3px)' },
        },
      },
      animation: {
        bobbing: 'bobbing 3s ease-in-out infinite',
        shake: 'shake 0.8s ease-in-out 1s infinite',
      },
      borderRadius: {
        'custom': '20px 20px 0 20px', // Bo góc theo vị trí mong muốn
      },
    },
  },
  daisyui: {
    themes: ["light", "dark", "winter"],
  },
  plugins: [require("daisyui"), require("tailwind-scrollbar")],
  variants: {
    scrollbar: ["rounded"],
  },
};
