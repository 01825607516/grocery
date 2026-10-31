// Bulk-add REAL products (with opening stock) to the Dokani backend from products.csv
//
//   node scripts/add-products.mjs --dry-run     # only shows what would happen
//   node scripts/add-products.mjs               # really adds them
//   node scripts/add-products.mjs my-file.csv   # use another csv
//
// CSV `image` column: a file path (images/rice.jpg) OR a web link (https://...jpg). Max 2MB, jpg/png/webp/gif.
// Reads DOKANI_BASE_URL / DOKANI_LOGIN / DOKANI_PASSWORD from .env.local (same login Freshly uses).
// Missing categories / units / brands are created automatically. Products whose name already exists are skipped.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const csvPath = args.find((a) => !a.startsWith("--")) || "products.csv";

// ---------- .env.local ----------
function loadEnv() {
  const env = {};
  for (const f of [".env.local", ".env"]) {
    if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}
const env = loadEnv();
const BASE = (env.DOKANI_BASE_URL || "").replace(/\/$/, "");
if (!BASE || !env.DOKANI_LOGIN || !env.DOKANI_PASSWORD) {
  console.error("DOKANI_BASE_URL / DOKANI_LOGIN / DOKANI_PASSWORD .env.local e nai. Project folder theke run koro.");
  process.exit(1);
}

// ---------- csv ----------
function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); cell = ""; if (row.some((x) => x.trim() !== "")) rows.push(row); row = []; }
    else cell += c;
  }
  row.push(cell); if (row.some((x) => x.trim() !== "")) rows.push(row);
  const head = rows.shift().map((h) => h.trim().toLowerCase());
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}
if (!fs.existsSync(csvPath)) { console.error(`${csvPath} file pai nai.`); process.exit(1); }
const items = parseCsv(fs.readFileSync(csvPath, "utf8"));
console.log(`${items.length} ta row paoa gelo (${csvPath})${DRY ? "  [DRY RUN]" : ""}\n`);

// ---------- api ----------
let TOKEN = "";
async function api(method, url, body) {
  const res = await fetch(BASE + url, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json", ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}) },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text(); let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 300) }; }
  if (!res.ok) { const err = new Error(json.message || `HTTP ${res.status}`); err.status = res.status; err.json = json; throw err; }
  return json;
}
const arr = (j, key) => (Array.isArray(j?.[key]) ? j[key] : Array.isArray(j?.[key]?.data) ? j[key].data : Array.isArray(j?.data) ? j.data : []);

async function login() {
  const res = await fetch(`${BASE}/login`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ login: env.DOKANI_LOGIN, password: env.DOKANI_PASSWORD }) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.token) throw new Error("Login hoyni: " + (j.message || res.status));
  TOKEN = j.token;
}

const maps = { category: new Map(), unit: new Map(), company: new Map() };
const key = (s) => s.trim().toLowerCase();
async function loadMaps() {
  for (const r of arr(await api("GET", "/shops/category"), "category")) maps.category.set(key(r.name), r.id);
  for (const r of arr(await api("GET", "/shops/units"), "units")) maps.unit.set(key(r.name), r.id);
  for (const r of arr(await api("GET", "/shops/companies"), "companies")) maps.company.set(key(r.name), r.id);
}
async function ensure(kind, name) {
  if (!name) return undefined;
  const k = key(name);
  if (maps[kind].has(k)) return maps[kind].get(k);
  if (DRY) { console.log(`  (notun ${kind} hobe: ${name})`); maps[kind].set(k, 0); return 0; }
  const url = { category: "/shops/category", unit: "/shops/units", company: "/shops/companies" }[kind];
  const j = await api("POST", url, { name, status: 1 });
  const id = j?.data?.id ?? j?.[kind]?.id;
  if (!id) throw new Error(`${kind} "${name}" banano gelo na`);
  maps[kind].set(k, id); console.log(`  + notun ${kind}: ${name}`);
  return id;
}

async function existingNames() {
  const names = new Set(); let firstId = null;
  for (let page = 1; page <= 50; page++) {
    const j = await api("GET", `/shops/products?per_page=100&page=${page}`);
    const rows = arr(j, "products");
    if (!rows.length || (page > 1 && rows[0]?.id === firstId)) break;
    firstId = firstId ?? rows[0]?.id;
    rows.forEach((p) => names.add(key(p.name)));
    const last = Number(j.pagination?.last_page); if (Number.isFinite(last) && page >= last) break;
    if (rows.length < 100) break;
  }
  return names;
}

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };
const num = (v) => (v === "" || v == null || Number.isNaN(Number(v)) ? undefined : Number(v));

// ---------- run ----------
await login();
await loadMaps();
const have = await existingNames();
let ok = 0, skipped = 0, failed = 0;

for (const [i, r] of items.entries()) {
  const label = `[${i + 1}/${items.length}] ${r.name}`;
  try {
    if (!r.name) throw new Error("name khali");
    if (have.has(key(r.name))) { console.log(`${label}  -> already ache, skip`); skipped++; continue; }
    const price = num(r.price), mrp = num(r.mrp) ?? price;
    if (price == null) throw new Error("price (selling price) dao");
    const categoryId = await ensure("category", r.category);
    const unitId = await ensure("unit", r.unit);
    const companyId = await ensure("company", r.brand);

    const f = new FormData();
    const set = (k, v) => { if (v !== undefined && v !== "") f.append(k, String(v)); };
    set("name", r.name); set("description", r.description);
    set("category_id", categoryId); set("unit_id", unitId); set("company_id", companyId);
    set("mrp", mrp); set("shop_price", price); set("whole_sale_price", price);
    set("last_buy_price", num(r.buy_price)); set("avg_buy_price", num(r.buy_price));
    set("initial_balance", num(r.stock) ?? 0); set("alarming_stock", num(r.low_stock_at));
    if (r.expiry_date) { set("expiry_enabled", 1); set("expiry_date", r.expiry_date); }
    set("kind", ["weight", "piece"].includes((r.kind || "").toLowerCase()) ? r.kind.toLowerCase() : undefined);
    set("web_visible", 1); set("status", 1);
    if (r.image) {
      let buf, ext, fname;
      if (/^https?:\/\//i.test(r.image)) {
        // image link: download it first, then upload to the backend
        const res = await fetch(r.image, { redirect: "follow" });
        if (!res.ok) throw new Error(`image link kaj kore na (HTTP ${res.status}): ${r.image}`);
        const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
        ext = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" }[type];
        if (!ext) throw new Error(`link-ta chhobi na (${type || "unknown type"}): ${r.image}`);
        buf = Buffer.from(await res.arrayBuffer());
        fname = `product${ext}`;
      } else {
        ext = path.extname(r.image).toLowerCase();
        if (!fs.existsSync(r.image)) throw new Error(`image file pai nai: ${r.image} (path project folder theke dao)`);
        if (!MIME[ext]) throw new Error(`image format hobe jpg/png/webp/gif: ${r.image}`);
        buf = fs.readFileSync(r.image);
        fname = path.basename(r.image);
      }
      if (buf.length > 2 * 1024 * 1024) throw new Error(`image 2MB-r beshi (${(buf.length / 1048576).toFixed(1)}MB): ${r.image}`);
      f.append("cover_image", new Blob([buf], { type: MIME[ext] }), fname);
    }
    if (DRY) { console.log(`${label}  -> add hobe (price ${price}, stock ${num(r.stock) ?? 0})`); ok++; continue; }
    await api("POST", "/shops/products", f);
    have.add(key(r.name)); ok++; console.log(`${label}  -> added`);
  } catch (e) {
    failed++; console.log(`${label}  -> FAILED: ${e.message}${e.json?.errors ? " " + JSON.stringify(e.json.errors) : ""}`);
  }
}
console.log(`\nShesh: ${ok} ${DRY ? "add hobe" : "added"}, ${skipped} skip, ${failed} failed.`);
if (!DRY && ok) console.log("Freshly 1 minute-er moddhe nijei notun product dekhabe (refresh dio).");
