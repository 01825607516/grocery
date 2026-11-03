// Dokani product -> the shape Freshly's screens use (see PRODUCTS in src/lib/data.js). Pure functions, no network.
// Product photos come only from the product's own Dokani image fields; missing photos stay blank.
import { CATEGORIES } from "@/lib/data";
import { categoryFallback, categoryImage } from "@/lib/images";
import { CATEGORY_RULES, KG_UNITS, NEAR_EXPIRY_DAYS } from "./config";

const num = (v, d = 0) => { const x = Number(v); return Number.isFinite(x) ? x : d; };
const slug = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "other";
const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));
// Dokani category name -> Freshly category id
export function categoryKey(name) {
  const n = String(name ?? "").trim();
  for (const [re, id] of CATEGORY_RULES) if (re.test(n)) return id;
  return slug(n);
}

// Freshly category object for an id. Known ids reuse the built-in look; a new id gets a generic one.
// `row` = the category's Dokani row (optional): the picture saved in the database (image_url) always wins over the built-in one.
export function toCategory(id, dokaniName, row) {
  const known = BY_ID.get(id);
  const dbImage = typeof row?.image_url === "string" ? row.image_url.trim() : "";
  if (known) return { ...known, ...(dbImage ? { image: dbImage } : {}), dokaniName };
  return { id, name: dokaniName || id, subs: [], kind: "box", color: row?.tint_colour || "#4fa86b", image: dbImage || categoryImage(id), fallback: categoryFallback(id), dokaniName };
}

// "2026-10-14" / "14-10-2026" -> Date | null
export function parseDate(s) {
  const m = /^(\d{1,2})-(\d{1,2})-(\d{4})/.exec(String(s ?? ""));
  const d = m ? new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])) : new Date(s);
  return Number.isNaN(+d) ? null : d;
}

// Nearest expiry date among batches that still have stock: the nearest NOT-yet-expired batch wins (fresh stock keeps the product sellable);
// if every batch with stock is already expired, the oldest date is returned (-> product shows as out).
function nearestExpiry(p, now) {
  const dates = (Array.isArray(p.batch_infos) ? p.batch_infos : [])
    .filter((b) => b && Number(b.status) !== 0 && num(b.available_quantity) > 0)
    .map((b) => parseDate(b.expiry_date))
    .filter(Boolean)
    .sort((a, b) => +a - +b);
  if (dates.length) return dates.find((d) => +d >= now - 86_400_000) || dates[0];
  return p.expiry_enabled ? parseDate(p.expiry_date) : null;
}

// weight or piece: Dokani "kind" (weight / piece) wins when the shop filled it, else the unit name / short name decides.
function unitOf(p) {
  if (p.kind === "weight") return "kg";
  if (p.kind === "piece") return "pc";
  const names = [p.unit?.short_name, p.unit?.name].map((x) => String(x ?? "").trim());
  return names.some((n) => KG_UNITS.test(n)) ? "kg" : "pc";
}

export function mapProduct(p, now = Date.now()) {
  const category = categoryKey(p.category?.name);
  const meta = BY_ID.get(category);

  // price: shop_price = selling price, mrp = printed price. A Dokani discount lowers the selling price.
  const base = num(p.shop_price) || num(p.mrp);
  let price = base, mrp = Math.max(num(p.mrp), base);
  if (p.has_discount && num(p.discount_value) > 0) {
    price = Math.max(0, Math.round(p.discount_type === "percentage" ? base * (1 - num(p.discount_value) / 100) : base - num(p.discount_value)));
  }
  const unit = unitOf(p);
  const stock = num(p.stock?.stock_amount);

  // status badge: out / low / near (expiry) / null. Freshly: "fresh" | "low" | "near" | "out" | null
  let status = null;
  if (stock <= 0 || p.stock?.status === "out") status = "out";
  else if (num(p.alarming_stock) > 0 ? stock <= num(p.alarming_stock) : stock <= 3) status = "low";
  const exp = nearestExpiry(p, now);
  if (exp && status !== "out") {
    const left = +exp - now;
    if (left < 0) status = "out";                          // expired: cannot be sold
    else if (left < NEAR_EXPIRY_DAYS * 86_400_000) status = "near";
  }

  const photos = [p.cover_image_url, ...(Array.isArray(p.feature_image_urls) ? p.feature_image_urls : [])]
    .filter((url) => typeof url === "string" && url.trim())
    .map((url) => url.trim());
  const reviewCount = num(p.review_count);
  const name = String(p.name ?? p.display_name ?? "").trim() || `Product ${p.id}`; // a product with no name in Dokani still shows up (and never crashes the page)
  return {
    id: p.id, name, brand: p.company?.name || "", category, sub: p.model || "",
    price, mrp, unit, status, stock,
    kind: meta?.kind || "box", color: meta?.color || "#4fa86b",
    image: photos[0] || "", images: photos, fallback: "",
    discount: mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0,
    subscribable: Boolean(p.subscribable), description: p.description ?? "", barcode: p.barcode || "",
    // optional fields: only sent when Dokani has real data, so the UI never shows fake numbers
    ...(reviewCount > 0 ? { rating: num(p.rating), reviewCount } : {}),
    ...(p.sold_today != null ? { soldToday: num(p.sold_today) } : {}),
    source: "dokani",
  };
}

// Sellable = active, not a service, not hidden from the website (web_visible false), not expired.
export const isSellable = (p) => p && p.status !== 0 && !p.is_service && p.web_visible !== false && p.web_visible !== 0;
