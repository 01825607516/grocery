/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Colours come from CSS variables (defaults in globals.css, changed by Website Management > Look & feel).
        primary: { DEFAULT: "rgb(var(--c-primary) / <alpha-value>)", dark: "rgb(var(--c-primary-dark) / <alpha-value>)", light: "rgb(var(--c-primary-light) / <alpha-value>)" },
        accent: { DEFAULT: "rgb(var(--c-accent) / <alpha-value>)", dark: "rgb(var(--c-accent-dark) / <alpha-value>)" },
        coffee: { DEFAULT: "rgb(var(--c-primary) / <alpha-value>)", dark: "rgb(var(--c-primary-dark) / <alpha-value>)" },
        cream: "rgb(var(--c-cream) / <alpha-value>)",
        sand: "rgb(var(--c-sand) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        sale: "rgb(var(--c-primary) / <alpha-value>)",
      },
      borderRadius: { md: "var(--r-md)", lg: "var(--r-lg)", xl: "var(--r-xl)", "2xl": "var(--r-2xl)" },
      fontFamily: { display: ["var(--ff-display, var(--font-display))", "serif"], hero: ["var(--font-hero)", "serif"], body: ["var(--ff-body, var(--font-body))", "sans-serif"] },
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
