 // Freshly catalogue read straight from Dokani Cloud (server only). Cached in memory for CATALOG_TTL_MS.
import { assertShop, dokaniGet } from "./client";
import { CATALOG_TTL_MS, cfg } from "./config";
import { isSellable, mapProduct, toCategory } from "./mapper";

const PER_PAGE = 100;
let cache = { at: 0, rows: null, pending: null };
let verified = null; // "<login>|<shopId>" once the shop check passed


async function categoryRows() {
  const j = await dokaniGet("/shops/category");
  const rows = Array.isArray(j.category) ? j.category : j.category?.data ?? [];
  assertShop(rows); // every row carries shop_id: proves which shop this login belongs to
  return rows;
}
async function verifyShopOnce() {
  const c = cfg();
  if (!c.shopId) return;
  const key = `${c.login}|${c.shopId}`;
  if (verified === key) return;
  await categoryRows();
  verified = key;
}

// GET /shops/products page by page. Dokani sends `pagination.last_page` when per_page is used; the older "short page = last page" check stays as a fallback.
async function fetchAllRows() {
  const all = [];
  let firstId = null;
  for (let page = 1; page <= 50; page++) {
    const j = await dokaniGet("/shops/products", { per_page: PER_PAGE, page, status: 1 });
    const box = j.products;
    const rows = Array.isArray(box) ? box : Array.isArray(box?.data) ? box.data : [];
    if (rows.length === 0 || (page > 1 && rows[0]?.id === firstId)) break; // empty, or the API ignores "page" and repeats
    firstId = firstId ?? rows[0]?.id;
    all.push(...rows);
    const last = Number(j.pagination?.last_page);
    if (Number.isFinite(last) && last > 0) { if (page >= last) break; continue; }
    const hasNext = !Array.isArray(box) && (box?.links || []).some((l) => l.label === "Next" && l.url);
    if (!hasNext && rows.length < PER_PAGE) break;
  }
  return all;
}

async function rawRows() {
  if (cache.rows && Date.now() - cache.at < CATALOG_TTL_MS) return cache.rows;
  if (!cache.pending) {
    cache.pending = verifyShopOnce()
      .then(fetchAllRows)
      .then((rows) => { assertShop(rows); cache = { at: Date.now(), rows, pending: null }; return rows; })
      .catch((e) => { cache.pending = null; throw e; });
  }
  return cache.pending;
}

// company.logo can be a full URL, a "/path", or just a file name. Full URL / "/path" are used as is; a bare file name is tried under {server}/storage/
// (if that guess is wrong the browser simply falls back to the local public/brands logo or the built-in symbol, nothing breaks).
function logoUrl(logo) {
  const l = String(logo ?? "").trim();
  if (!l) return "";
  if (/^https?:\/\//i.test(l)) return l;
  const origin = cfg().baseUrl.replace(/\/api$/i, "");
  return `${origin}/${l.startsWith("/") ? l.replace(/^\/+/, "") : `storage/${l}`}`;
}

// -> { products, categories, brands, brandLogos } in Freshly's shapes. Only categories that have at least one product are returned.
export async function getCatalog() {
  const rows = (await rawRows()).filter(isSellable);
  const now = Date.now();
  const products = rows.map((p) => mapProduct(p, now));
  // "Most bought today" only makes sense if something was really sold today: otherwise drop the field and the home row stays on its normal ranking.
  if (!products.some((p) => p.soldToday > 0)) products.forEach((p) => { delete p.soldToday; });
  const names = new Map(rows.map((p) => [mapProduct(p, now).category, p.category?.name]));
  const categories = [...new Set(products.map((p) => p.category))].map((id) => toCategory(id, names.get(id)));
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))];
  const brandLogos = {}; // { "Brand name": logo url } only for brands whose Dokani company has a logo
  for (const p of rows) { const n = p.company?.name, u = logoUrl(p.company?.logo); if (n && u && !brandLogos[n]) brandLogos[n] = u; }
  return { products, categories, brands, brandLogos };
}

// Raw Dokani product rows (cached, same cache as the catalogue). Used by the order flow to read buy price / MRP on the server.
export async function getRawProducts() { return rawRows(); }
