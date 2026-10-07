// Downloads one real photo per keyword from Wikimedia Commons into /public/images
// Usage: npm run images   (needs internet, Node 18+). Safe to re-run: existing files are skipped.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "images");
const source = fs.readFileSync(path.join(root, "src/lib/data.js"), "utf8").replace(/export /g, "");
const { IMAGES } = new Function(`${source}; return { IMAGES };`)();

const wanted = new Map(); // keyword -> widest size needed
IMAGES.forEach(({ kw, w }) => wanted.set(kw, Math.max(w, wanted.get(kw) || 0)));
const headers = { "User-Agent": "GroceryStoreDemo/1.0 (local development)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const credits = {};

async function find(kw, w) {
  const params = new URLSearchParams({
    action: "query", generator: "search", gsrsearch: `${kw} filetype:bitmap`, gsrnamespace: "6", gsrlimit: "10",
    prop: "imageinfo", iiprop: "url|mime|size", iiurlwidth: String(w), format: "json",
  });
  const json = await (await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers })).json();
  return Object.values(json.query?.pages ?? {})
    .sort((a, b) => a.index - b.index)
    .map((p) => p.imageinfo?.[0])
    .find((i) => i && i.mime === "image/jpeg" && i.width >= 500 && i.height >= 350);
}

fs.mkdirSync(outDir, { recursive: true });
let ok = 0, failed = [];
for (const [kw, w] of wanted) {
  const file = path.join(outDir, `${kw.replace(/\s+/g, "-")}.jpg`);
  if (fs.existsSync(file)) { ok++; continue; }
  try {
    const info = await find(kw, w);
    if (!info) throw new Error("no result");
    const res = await fetch(info.thumburl, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    credits[kw] = info.descriptionurl;
    ok++; console.log("✓", kw);
  } catch (e) { failed.push(kw); console.log("✗", kw, "-", e.message); }
  await sleep(400);
}
fs.writeFileSync(path.join(outDir, "CREDITS.json"), JSON.stringify(credits, null, 2));
console.log(`\nDone: ${ok}/${wanted.size} images.${failed.length ? " Missing: " + failed.join(", ") : ""}`);
