/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1f4d3a", dark: "#133427", light: "#e7efe9" }, // deep green
        accent: { DEFAULT: "#b9a36b", dark: "#8f7a45" },                    // brass / antique gold (borders, rules, rings)
        coffee: { DEFAULT: "#1f4d3a", dark: "#133427" },                    // heading pills, offer bars = deep green
        cream: "#f8f6ef",                                                   // page background
        sand: "#f1ecdc",                                                    // trust strip above the footer
        ink: "#1f2a24",                                                     // text
        sale: "#1f4d3a",                                                    // discount badge
      },
      fontFamily: { display: ["var(--font-display)", "serif"], hero: ["var(--font-hero)", "serif"], body: ["var(--font-body)", "sans-serif"] },
      keyframes: {
        kenburns: { "0%": { transform: "scale(1)" }, "100%": { transform: "scale(1.07)" } },
        shine: { "0%": { transform: "translateX(-150%) skewX(-20deg)" }, "55%, 100%": { transform: "translateX(450%) skewX(-20deg)" } },
        tick: { from: { transform: "translateY(-40%)", opacity: 0 }, to: { transform: "none", opacity: 1 } },
        wiggle: { "0%, 60%, 100%": { transform: "rotate(0)" }, "10%, 30%, 50%": { transform: "rotate(-16deg)" }, "20%, 40%": { transform: "rotate(16deg)" } },
        progress: { from: { width: "0%" }, to: { width: "100%" } }, up: { from: { transform: "translateY(24px)", opacity: 0 }, to: { transform: "none", opacity: 1 } } },
      animation: {
        kenburns: "kenburns 14s ease-in-out infinite alternate",
        shine: "shine 6s ease-in-out infinite",
        tick: "tick .3s ease-out",
        wiggle: "wiggle 2.8s ease-in-out infinite",
        up: "up .25s ease-out", progress: "progress linear forwards" },
    },
  },
  plugins: [],
};
