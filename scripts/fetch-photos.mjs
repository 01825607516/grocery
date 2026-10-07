// Downloads real Unsplash photos for every product, category and campaign banner into public/images.
//   1. Free key: https://unsplash.com/oauth/applications  (New Application -> copy "Access Key")
//   2. Run:  node scripts/fetch-photos.mjs YOUR_ACCESS_KEY     (or set UNSPLASH_ACCESS_KEY)
// - Search words for each item live in scripts/queries.json. Don't like a photo? Edit its query, delete
//   that jpg from public/images, run again. Existing files are skipped, so the script is resumable.
// - Demo keys are limited to 50 requests/hour: the script waits automatically and carries on.
//   (Add --no-wait to stop instead.)  Credits are saved in public/images/credits.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public", "images");
const args = process.argv.slice(2);
const key = args.find((a) => !a.startsWith("--")) || process.env.UNSPLASH_ACCESS_KEY;
const wait = !args.includes("--no-wait");
if (!key) { console.log("Missing key. Usage: node scripts/fetch-photos.mjs YOUR_UNSPLASH_ACCESS_KEY"); process.exit(1); }

const src = fs.readFileSync(path.join(root, "src/lib/data.js"), "utf8").replace(/export /g, "");
const { PRODUCTS, CATEGORIES, CAMPAIGNS } = new Function(`${src}; return { PRODUCTS, CATEGORIES, CAMPAIGNS };`)();
const overrides = JSON.parse(fs.readFileSync(path.join(root, "scripts/queries.json"), "utf8"));
const clean = (n) => n.replace(/\(.*?\)/g, "").replace(/\b\d+(\.\d+)?\s?(kg|g|ml|l)\b/gi, "").replace(/\s+/g, " ").trim().toLowerCase();

// banners first (most visible), then categories, then products
const jobs = [
  ...CAMPAIGNS.map((c) => ({ file: c.image, q: overrides[`banner:${c.id}`] || c.title, w: 1600, h: 640, orientation: "landscape" })),
  ...CATEGORIES.map((c) => ({ file: c.image, q: overrides[c.name] || c.name, w: 400, h: 400, orientation: "squarish" })),
  ...PRODUCTS.map((p) => ({ file: p.image, q: overrides[p.name] || clean(p.name), w: 520, h: 520, orientation: "squarish" })),
];

const H = { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const credits = fs.existsSync(path.join(out, "credits.json")) ? JSON.parse(fs.readFileSync(path.join(out, "credits.json"), "utf8")) : {};
fs.mkdirSync(out, { recursive: true });

async function search(q, orientation) {
  for (;;) {
    const res = await fetch(`https://api.unsplash.com/search/photos?per_page=1&content_filter=high&orientation=${orientation}&query=${encodeURIComponent(q)}`, { headers: H });
    if ((res.status === 403 || res.status === 429) && wait) { console.log("Hourly limit reached - waiting 61 min, then continuing (Ctrl+C to stop; re-run later to resume)..."); await sleep(61 * 60 * 1000); continue; }
    if (res.status === 401) { console.log("Invalid access key."); process.exit(1); }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).results?.[0];
  }
}

let done = 0; const missing = [];
for (const { file, q, w, h, orientation } of jobs) {
  const dest = path.join(root, "public", file);
  if (fs.existsSync(dest)) { done++; continue; }
  try {
    const photo = await search(q, orientation);
    if (!photo) throw new Error("no photo found");
    const url = `${photo.urls.raw}&w=${w}&h=${h}&fit=crop&crop=entropy&q=80&fm=jpg`;
    fs.writeFileSync(dest, Buffer.from(await (await fetch(url)).arrayBuffer()));
    fetch(photo.links.download_location, { headers: H }).catch(() => {}); // Unsplash API rule: report the download
    credits[file] = { by: photo.user.name, link: `${photo.user.links.html}?utm_source=freshly&utm_medium=referral` };
    fs.writeFileSync(path.join(out, "credits.json"), JSON.stringify(credits, null, 1));
    done++; console.log(`ok   [${done}/${jobs.length}]`, q);
  } catch (e) { missing.push(q); console.log("fail", q, "-", e.message); }
  await sleep(300);
}
console.log(`\n${done}/${jobs.length} photos ready.${missing.length ? " Missing: " + missing.join(", ") : ""}`);
