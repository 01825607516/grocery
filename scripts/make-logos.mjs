// Generates a full logo (symbol + brand name) as public/brands/<brand-slug>.svg for every brand.
//   node scripts/make-logos.mjs
// Want a different logo? Drop your own file named <brand-slug>.svg or .png into public/brands - it wins over the built-in one.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "public", "brands");
fs.mkdirSync(dir, { recursive: true });
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const G = {
  leaf: (f) => `<path d="M60 88c-22-4-28-26-23-44 22 0 42 9 44 28 0 9-9 16-21 16z" fill="${f}"/><path d="M46 80c8-14 18-24 30-30" stroke="#0003" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  mountain: (f) => `<path d="M30 86l22-42 14 22 9-12 15 32z" fill="${f}"/><circle cx="82" cy="42" r="6" fill="${f}"/>`,
  heart: (f) => `<path d="M60 88s-26-15-26-33a14 14 0 0 1 26-7 14 14 0 0 1 26 7c0 18-26 33-26 33z" fill="${f}"/>`,
  crown: (f) => `<path d="M34 84V46l17 17 9-23 9 23 17-17v38z" fill="${f}"/>`,
  fish: (f) => `<ellipse cx="54" cy="60" rx="24" ry="15" fill="${f}"/><path d="M74 60l16-14v28z" fill="${f}"/>`,
  drop: (f) => `<path d="M60 32c15 19 24 29 24 42a24 24 0 0 1-48 0c0-13 9-23 24-42z" fill="${f}"/>`,
  wheat: (f) => `<path d="M60 92V36" stroke="${f}" stroke-width="4" stroke-linecap="round"/>` + [46, 60, 74].map((y) => `<ellipse cx="50" cy="${y}" rx="6" ry="11" fill="${f}" transform="rotate(-35 50 ${y})"/><ellipse cx="70" cy="${y}" rx="6" ry="11" fill="${f}" transform="rotate(35 70 ${y})"/>`).join("") + `<ellipse cx="60" cy="34" rx="6" ry="11" fill="${f}"/>`,
  bolt: (f) => `<path d="M68 28L40 66h16l-6 28 30-42H64z" fill="${f}"/>`,
  house: (f) => `<path d="M32 62L60 36l28 26v28H32z" fill="${f}"/><rect x="53" y="68" width="14" height="22" rx="2" fill="#0003"/>`,
  wave: (f) => `<path d="M32 52q14-16 28 0t28 0" stroke="${f}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M32 74q14-16 28 0t28 0" stroke="${f}" stroke-width="8" fill="none" stroke-linecap="round"/>`,
  star: (f) => `<polygon points="60,30 69,51 91,53 74,68 79,90 60,78 41,90 46,68 29,53 51,51" fill="${f}"/>`,
  moon: (f) => `<path d="M74 36a30 30 0 1 0 14 48 26 26 0 0 1-14-48z" fill="${f}"/>`,
  sun: (f) => `<circle cx="60" cy="60" r="16" fill="${f}"/>` + [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="60" y1="30" x2="60" y2="38" stroke="${f}" stroke-width="5" stroke-linecap="round" transform="rotate(${a} 60 60)"/>`).join(""),
  snow: (f) => [0, 60, 120].map((a) => `<line x1="60" y1="30" x2="60" y2="90" stroke="${f}" stroke-width="6" stroke-linecap="round" transform="rotate(${a} 60 60)"/>`).join("") + `<circle cx="60" cy="60" r="8" fill="${f}"/>`,
  flower: (f) => [0, 72, 144, 216, 288].map((a) => `<circle cx="60" cy="43" r="13" fill="${f}" transform="rotate(${a} 60 60)"/>`).join("") + `<circle cx="60" cy="60" r="9" fill="#0003"/>`,
  sparkle: (f) => `<path d="M60 30l8 22 22 8-22 8-8 22-8-22-22-8 22-8z" fill="${f}"/>`,
  flame: (f) => `<path d="M60 30c11 16 24 26 24 44a24 24 0 0 1-48 0c0-11 6-18 11-24 2 9 6 11 11 9-3-9-2-18 2-29z" fill="${f}"/>`,
  bowl: (f) => `<path d="M32 58h56a28 28 0 0 1-56 0z" fill="${f}"/><path d="M48 50l24-18M56 50l24-14" stroke="${f}" stroke-width="4" stroke-linecap="round"/>`,
  diamond: (f) => `<path d="M60 30l26 28-26 34-26-34z" fill="${f}"/>`,
  sunrise: (f) => `<path d="M34 76a26 26 0 0 1 52 0z" fill="${f}"/><path d="M30 86h60" stroke="${f}" stroke-width="5" stroke-linecap="round"/><path d="M60 36v8M36 48l6 6M84 48l-6 6" stroke="${f}" stroke-width="4" stroke-linecap="round"/>`,
  sprout: (f) => `<path d="M60 92V62" stroke="${f}" stroke-width="5" stroke-linecap="round"/><path d="M60 68c-16 0-24-8-24-22 14 0 24 8 24 22zM60 62c0-14 9-22 24-22 0 14-9 22-24 22z" fill="${f}"/>`,
  paw: (f) => `<path d="M60 62c-14 0-24 12-20 22 3 8 12 6 20 6s17 2 20-6c4-10-6-22-20-22z" fill="${f}"/><circle cx="40" cy="50" r="7" fill="${f}"/><circle cx="54" cy="38" r="7" fill="${f}"/><circle cx="68" cy="38" r="7" fill="${f}"/><circle cx="82" cy="50" r="7" fill="${f}"/>`,
  plus: (f) => `<path d="M52 32h16v20h20v16H68v20H52V68H32V52h20z" fill="${f}"/>`,
  ring: (f) => `<circle cx="60" cy="60" r="24" stroke="${f}" stroke-width="9" fill="none"/><circle cx="60" cy="60" r="7" fill="${f}"/>`,
};
const SHAPES = {
  circle: `<circle cx="60" cy="60" r="56"/>`,
  squircle: `<rect x="6" y="6" width="108" height="108" rx="34"/>`,
  hexagon: `<polygon points="60,4 108,32 108,88 60,116 12,88 12,32" stroke-linejoin="round"/>`,
  shield: `<path d="M60 6l46 16v38c0 28-20 46-46 54C34 106 14 88 14 60V22z"/>`,
};
// brand: [glyph, badge shape, colour, text style]  (text style: U = UPPERCASE, T = Title case, L = lowercase)
const LOGOS = {
  "Fresh Farm": ["leaf", "circle", "#2f6b45", "T"], "Green Roots": ["mountain", "squircle", "#588157", "T"], Orchard: ["heart", "circle", "#e63946", "U"],
  "Farm Fresh Meats": ["crown", "shield", "#9b2226", "T"], "Sea Catch": ["fish", "circle", "#0077b6", "U"], "Dairy Pure": ["drop", "squircle", "#4895ef", "T"],
  "Daily Bake": ["wheat", "hexagon", "#c68b59", "T"], Crispy: ["bolt", "squircle", "#f4a000", "U"], "Nut House": ["house", "shield", "#7f5539", "T"],
  "Sip Co": ["wave", "circle", "#00a6a6", "L"], Bertolli: ["star", "hexagon", "#6b8e23", "U"], Sundarban: ["moon", "squircle", "#bc6c25", "T"],
  "Golden Grain": ["sun", "squircle", "#e9a23b", "T"], Frosty: ["snow", "hexagon", "#2bb3d9", "U"], SCA: ["flower", "circle", "#d6336c", "U"],
  HomeCare: ["sparkle", "circle", "#3a86ff", "T"], "Spice Route": ["flame", "squircle", "#c1121f", "T"], "Wok & Co": ["bowl", "hexagon", "#e85d04", "T"],
  "Choco Bliss": ["diamond", "circle", "#5a3825", "T"], "Morning Bowl": ["sunrise", "squircle", "#f77f00", "T"], "Little Sprout": ["sprout", "circle", "#6dbb45", "T"],
  "Pet Pal": ["paw", "hexagon", "#8d6e63", "T"], VitaWell: ["plus", "shield", "#2a9d8f", "T"], PureCare: ["ring", "squircle", "#5e60ce", "T"],
};
const esc = (t) => t.replace(/&/g, "&amp;");

for (const [brand, [glyph, shape, color, style]] of Object.entries(LOGOS)) {
  const text = style === "U" ? brand.toUpperCase() : style === "L" ? brand.toLowerCase() : brand;
  const size = Math.min(30, Math.floor(168 / (text.length * 0.62)));
  const len = Math.min(Math.round(text.length * size * 0.6), 168);
  const sp = style === "U" ? 'letter-spacing="1.5"' : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 80" role="img" aria-label="${esc(brand)}"><title>${esc(brand)}</title>
<g transform="translate(4 4) scale(.6)"><g fill="${color}" stroke="none">${SHAPES[shape]}</g>${G[glyph]("#ffffff")}</g>
<text x="86" y="${40 + Math.round(size * 0.36)}" font-family="'Poppins','Segoe UI','Helvetica Neue',Arial,sans-serif" font-weight="800" font-size="${size}" fill="${color}" textLength="${len}" lengthAdjust="spacingAndGlyphs" ${sp}>${esc(text)}</text></svg>\n`;
  fs.writeFileSync(path.join(dir, `${slug(brand)}.svg`), svg);
}
console.log(`${Object.keys(LOGOS).length} logos written to public/brands`);
