/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // We are leaving this empty to ensure only default Tailwind styles are used.
    extend: {},
  },
  plugins: [],
}