// Look & feel the admin can change (colours, fonts, corners). Stored in site_content.theme and applied as CSS variables:
// tailwind.config.js reads them (rgb(var(--c-primary) / <alpha-value>)), so every existing class follows the theme.
export const DEFAULT_THEME = { primary: "#1f4d3a", accent: "#b9a36b", cream: "#f8f6ef", ink: "#1f2a24", card: "#ffffff", primary_dark: "", primary_light: "", accent_dark: "", font_display: "playfair", font_body: "source", font_custom_display: "", font_custom_body: "", text_size: "normal", radius: "soft" };

// Optional colours: empty = worked out automatically from the main / accent colour.
export const TEXT_SIZES = { small: { label: "Small", size: "93.75%" }, normal: { label: "Normal (default)", size: "100%" }, large: { label: "Large", size: "108%" }, xlarge: { label: "Extra large", size: "116%" } };

export const PRESETS = [
  { id: "forest", label: "Forest (default)", ...DEFAULT_THEME },
  { id: "ocean", label: "Ocean", primary: "#1e4e79", accent: "#c9a24a", cream: "#f5f8fb", ink: "#1b2733" },
  { id: "berry", label: "Berry", primary: "#7a2048", accent: "#c79a5b", cream: "#fbf5f7", ink: "#2b1a22" },
  { id: "sunset", label: "Sunset", primary: "#b4491f", accent: "#d9a441", cream: "#fdf6ee", ink: "#2d211a" },
  { id: "charcoal", label: "Charcoal", primary: "#2f3a45", accent: "#b9a36b", cream: "#f6f6f4", ink: "#1c2127" },
];

export const FONTS = {
  playfair: { label: "Playfair Display (elegant serif)", css: "var(--font-display), serif" },
  cormorant: { label: "Cormorant Garamond (light serif)", css: "var(--font-hero), serif" },
  source: { label: "Source Sans (clean sans)", css: "var(--font-body), sans-serif" },
  georgia: { label: "Georgia (classic serif)", css: "Georgia, 'Times New Roman', serif" },
  system: { label: "System default (fast)", css: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  trebuchet: { label: "Trebuchet (friendly sans)", css: "'Trebuchet MS', Verdana, sans-serif" },
};

export const RADII = {
  sharp: { label: "Sharp corners", md: "0px", lg: "0px", xl: "0px", "2xl": "0px" },
  soft: { label: "Soft corners (default)", md: ".375rem", lg: ".5rem", xl: ".75rem", "2xl": "1rem" },
  round: { label: "Very round", md: ".75rem", lg: "1rem", xl: "1.5rem", "2xl": "2rem" },
};

export const isHex = (v) => /^#[0-9a-f]{6}$/i.test(String(v || "").trim());
const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));
const css = (c) => c.join(" ");
const toHex = (c) => "#" + c.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
// the colour the website picks by itself when the optional colour is left empty (shown as the starting value in the admin)
export const autoColor = (t, key) => {
  const x = { ...DEFAULT_THEME, ...t };
  const primary = rgb(isHex(x.primary) ? x.primary : DEFAULT_THEME.primary), accent = rgb(isHex(x.accent) ? x.accent : DEFAULT_THEME.accent);
  if (key === "primary_dark") return toHex(mix(primary, [0, 0, 0], 0.35));
  if (key === "primary_light") return toHex(mix(primary, [255, 255, 255], 0.9));
  if (key === "accent_dark") return toHex(mix(accent, [0, 0, 0], 0.22));
  return "#000000";
};
const fontCss = (custom, id, fallbackId) => {
  const name = String(custom || "").replace(/["'<>;{}\\]/g, "").trim();
  return name ? `"${name}", ${(FONTS[id] || FONTS[fallbackId]).css}` : (FONTS[id] || FONTS[fallbackId]).css;
};

// theme object -> { "--c-primary": "31 77 58", ... }
export function themeVars(theme = {}) {
  const t = { ...DEFAULT_THEME, ...theme };
  const primary = rgb(isHex(t.primary) ? t.primary : DEFAULT_THEME.primary);
  const accent = rgb(isHex(t.accent) ? t.accent : DEFAULT_THEME.accent);
  const cream = rgb(isHex(t.cream) ? t.cream : DEFAULT_THEME.cream);
  const ink = rgb(isHex(t.ink) ? t.ink : DEFAULT_THEME.ink);
  const r = RADII[t.radius] || RADII.soft;
  const own = (k, auto) => (isHex(t[k]) ? rgb(t[k]) : auto);
  const card = rgb(isHex(t.card) ? t.card : DEFAULT_THEME.card);
  return {
    "--c-primary": css(primary), "--c-primary-dark": css(own("primary_dark", mix(primary, [0, 0, 0], 0.35))), "--c-primary-light": css(own("primary_light", mix(primary, [255, 255, 255], 0.9))),
    "--c-accent": css(accent), "--c-accent-dark": css(own("accent_dark", mix(accent, [0, 0, 0], 0.22))),
    "--c-cream": css(cream), "--c-sand": css(mix(cream, accent, 0.12)), "--c-ink": css(ink), "--c-card": css(card),
    "--ff-display": fontCss(t.font_custom_display, t.font_display, "playfair"), "--ff-body": fontCss(t.font_custom_body, t.font_body, "source"),
    "--fs-root": (TEXT_SIZES[t.text_size] || TEXT_SIZES.normal).size,
    "--r-md": r.md, "--r-lg": r.lg, "--r-xl": r.xl, "--r-2xl": r["2xl"],
  };
}

export function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const has = theme && typeof theme === "object" && Object.keys(theme).length;
  const vars = themeVars(has ? theme : DEFAULT_THEME);
  for (const [k, v] of Object.entries(vars)) { if (has) root.style.setProperty(k, v); else root.style.removeProperty(k); }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && has) meta.setAttribute("content", isHex(theme.primary) ? theme.primary : DEFAULT_THEME.primary);
}

// Home page sections the admin can show / hide / reorder.
export const HOME_SECTIONS = [
  ["categories", "Shop by category"], ["shop", "Shop (products)"], ["top-saver", "Top saver"], ["recommended", "Recommended for you"], ["reorder", "Reorder & recipes"], ["brands", "Shop by brand"],
];
export const mergeSections = (saved) => {
  const known = HOME_SECTIONS.map(([id]) => id);
  const list = (Array.isArray(saved) ? saved : []).filter((s) => known.includes(s?.id)).map((s) => ({ id: s.id, show: s.show !== false }));
  for (const id of known) if (!list.some((s) => s.id === id)) list.push({ id, show: true });
  return list;
};
// Headings the admin can reword (key = the built-in English title).
export const HEADINGS = ["Shop by category", "Shop", "Special offers", "Top saver today", "Recently viewed", "Reorder & Recipes", "Quick reorder", "Recipe to cart"];
