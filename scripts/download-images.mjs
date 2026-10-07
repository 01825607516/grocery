// Downloads one real photo per keyword (Wikimedia Commons) into public/images.
// Run from the project root:  node scripts/download-images.mjs      (Node 18+, internet needed)
// Existing files are skipped. Delete a bad photo and run again to get a different one.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

// Run data.js to collect every keyword registered through photo(...)
const code = readFileSync("src/lib/data.js", "utf8").replace(/export /g, "");
const { IMAGES } = new Function(`${code}\nreturn { IMAGES };`)();
const keywords = [...new Set(IMAGES.map((i) => i.kw.trim()))];

const headers = { "User-Agent": "grocery-store-demo/1.0 (local development)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failed = [];

async function getJson(url, tries = 3) {
  for (let t = 1; t <= tries; t++) {
    const res = await fetch(url, { headers });
    if (res.ok) return res.json();
    await sleep(1500 * t); // rate limited? wait and retry
  }
  throw new Error("API request failed");
}

mkdirSync("public/images", { recursive: true });
console.log(`${keywords.length} images to check...\n`);

for (const kw of keywords) {
  const name = kw.replace(/\s+/g, "-");
  const file = `public/images/${name}.jpg`;
  if (existsSync(file)) continue;
  try {
    const q = encodeURIComponent(`${kw} filetype:bitmap`);
    const api = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch=${q}&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`;
    const data = await getJson(api);
    const pages = Object.values(data.query?.pages || {}).sort((a, b) => a.index - b.index);
    const hit = pages.map((p) => p.imageinfo?.[0]).find((i) => i?.thumburl && i.mime === "image/jpeg");
    if (!hit) throw new Error("no jpeg result");
    const img = await fetch(hit.thumburl, { headers });
    if (!img.ok) throw new Error(`download ${img.status}`);
    writeFileSync(file, Buffer.from(await img.arrayBuffer()));
    console.log("ok   ", name);
  } catch (e) {
    failed.push(name);
    console.log("FAIL ", name, "-", e.message);
  }
  await sleep(500);
}

console.log(failed.length ? `\nMissing (add manually as public/images/<name>.jpg):\n  ${failed.join("\n  ")}` : "\nAll images ready. Refresh the browser.");
