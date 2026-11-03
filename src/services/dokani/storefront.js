// SERVER ONLY. Store-wide settings read from the Dokani database and turned into the shapes Freshly's screens use:
//   /settings                    -> config (free delivery limit...) + payments + site content
//   /delivery/options            -> areas + time slots
//   /campaigns (+ /manage)       -> offers { weekend (live now), upcoming }
//   /recipes                     -> recipes
// NO DEMO DATA: if the database has nothing for a part, that part is simply empty (the matching section of the website hides itself),
// and if a request fails the reason is logged and reported in `from` (see /api/dokani/catalog -> storeFrom) instead of hiding behind fake data.
import { dokaniSend } from "./client";
import { cfg } from "./config";
import { CONFIG } from "@/lib/data";

const TTL = 60 * 1000;
let cache = { at: 0, value: null, pending: null };
let seoCache = { at: 0, value: null, pending: null };
export const clearStoreCache = () => { cache = { at: 0, value: null, pending: null }; seoCache = { at: 0, value: null, pending: null }; };

async function getJson(path) {
  const res = await dokaniSend("GET", path);
  const j = await res.json().catch(() => null);
  if (!res.ok) throw new Error(j?.message || `HTTP ${res.status} for ${path}`);
  return j;
}
const num = (v, d = 0) => { const x = Number(v); return Number.isFinite(x) ? x : d; };

// "9 – 11 AM" -> 9, "4 – 6 PM" -> 16, "11 AM – 1 PM" -> 11
export function startHourOf(label) {
  const m = [...String(label).matchAll(/(\d{1,2})(?::\d{2})?\s*(am|pm)?/gi)];
  if (!m.length) return 9;
  const h1 = +m[0][1], ap1 = m[0][2]?.toLowerCase(), ap2 = m[1]?.[2]?.toLowerCase();
  let ap = ap1 || ap2 || "am";
  if (!ap1 && m[1] && h1 > +m[1][1] && ap2 === "pm") ap = "am"; // "11 – 1 PM": the 11 is in the morning
  if (ap === "pm" && h1 < 12) return h1 + 12;
  if (ap === "am" && h1 === 12) return 0;
  return h1;
}

// The settings table has no explicit payment list: Cash on Delivery always works; bKash / Nagad / Card are offered only when the server
// has a Dokani bank account to book them to (DOKANI_BANK_ID), otherwise the order would be refused at the end of checkout.
const defaultPayments = () => (cfg().bankId ? ["Cash on Delivery", "bKash", "Nagad", "Card"] : ["Cash on Delivery"]);

async function loadConfig() {
  const j = await getJson("/settings");
  const s = j?.settings && typeof j.settings === "object" && Object.keys(j.settings).length ? j.settings : j || {};
  const free = num(s.free_delivery_over, CONFIG.freeDeliveryLimit);
  const deliveryFee = num(s.delivery_fee, CONFIG.deliveryFee);
  const maxQtyPerLine = num(s.max_qty_per_line, CONFIG.maxQtyPerLine);
  return {
    config: { ...CONFIG, freeDeliveryLimit: free, deliveryFee, maxQtyPerLine, ...(num(s.subscribe_pct) > 0 ? { subscribePct: num(s.subscribe_pct) } : {}), ...(s.lead_hours != null ? { leadHours: num(s.lead_hours, CONFIG.leadHours) } : {}) },
    deliveryFee,
    expressFee: num(s.express_fee, 0),
    payments: Array.isArray(s.payments) && s.payments.length ? s.payments.map(String) : defaultPayments(),
    featureToggles: s.feature_toggles && typeof s.feature_toggles === "object" ? s.feature_toggles : {},
    siteContent: { ...(s.site_content && typeof s.site_content === "object" ? s.site_content : {}), ...(typeof s.site_logo_url === "string" ? { logo_url: s.site_logo_url } : {}), ...(typeof s.brand_name_en === "string" ? { brand_name: s.brand_name_en, brand_name_en: s.brand_name_en } : {}), ...(typeof s.brand_name_bn === "string" ? { brand_name_bn: s.brand_name_bn } : {}) },
    seo: s.seo && typeof s.seo === "object" ? s.seo : {},
    faviconUrl: s.favicon_url || "",
    language: s.language || "en",
    languageMode: s.language_mode || (s.language === "bn" ? "bn" : "en"),
    footerContent: s.footer_content && typeof s.footer_content === "object" ? s.footer_content : {},
    socialLinks: Array.isArray(s.social_links) ? s.social_links : [],
    infoPages: s.info_pages && typeof s.info_pages === "object" ? s.info_pages : {},
    support: s.support && typeof s.support === "object" ? s.support : {},
  };
}

async function loadDelivery(expressFee, defaultDeliveryFee) {
  const j = await getJson("/delivery/options");
  const rows = (Array.isArray(j?.options) ? j.options : []).filter((r) => r && Number(r.status) !== 0);
  if (!rows.length) return null;
  const seen = new Set();
  const areas = rows.map((r) => {
    const days = num(r.estimated_days, 0), courier = days >= 2;
    return {
      id: String(r.area_id ?? r.id), optionId: Number(r.id), city: r.city || "", name: r.name || r.area || r.city || `Area ${r.id}`, charge: r.charge == null || r.charge === "" ? defaultDeliveryFee : num(r.charge, defaultDeliveryFee),
      express: !courier && expressFee > 0, expressCharge: !courier ? expressFee : 0, courier, ...(courier ? { eta: `${days} days` } : {}),
    };
  }).filter((a) => !seen.has(a.id) && seen.add(a.id));
  const labels = [...new Set(rows.flatMap((r) => String(r.slot || "").split(/[;|]/).map((s) => s.trim()).filter(Boolean)))];
  const slots = labels.map((label, i) => ({ id: `s${i + 1}`, label, startHour: startHourOf(label) }));
  return { areas, slots };
}

const dhaka = (s) => { if (!s) return null; const d = new Date(String(s).replace(" ", "T") + (/[zZ]|[+-]\d\d:?\d\d$/.test(String(s)) ? "" : "+06:00")); return Number.isNaN(+d) ? null : d; };

// A campaign's `content` may carry the Freshly extras as JSON, e.g. {"cats":["veg","fruits"],"bg":"#d6c5a2","off":30,"tag":"FLASH DEAL"}. Plain text content is simply ignored.
function toOffer(r) {
  let x = {}; try { const c = JSON.parse(r.content || ""); if (c && typeof c === "object") x = c; } catch {}
  return { id: `c${r.id}`, title: r.title_en || r.title || "", image: r.image_url || "", bg: x.bg || "#d6c5a2", cats: Array.isArray(x.cats) ? x.cats : [], ...(x.off != null ? { off: num(x.off) } : {}), ...(x.tag ? { tag: String(x.tag) } : {}) };
}
// Live offers come from the public /campaigns list (the shop's service token is enough). Offers that start LATER are only listed by the
// management endpoint, which needs the "Website Control" permission: if the service login lacks it, live offers still show and the note says why.
async function loadOffers() {
  const [pub, mgr] = await Promise.allSettled([getJson("/campaigns"), getJson("/storefront/campaigns/manage")]);
  if (pub.status === "rejected" && mgr.status === "rejected") throw pub.reason;
  const byId = new Map();
  for (const r of [pub, mgr]) for (const c of r.status === "fulfilled" && Array.isArray(r.value?.campaigns) ? r.value.campaigns : []) byId.set(c.id, c); // manage rows (later) win
  const now = new Date();
  const rows = [...byId.values()].filter((r) => Number(r.status) !== 0 && r.type !== "theme");
  const weekend = [], upcoming = [];
  for (const r of rows) {
    const s = dhaka(r.starts_at), e = dhaka(r.ends_at);
    if (s && s > now) upcoming.push({ ...toOffer(r), startsAt: s.toISOString() });
    else if (!e || e >= now) weekend.push({ ...toOffer(r), ...(e ? { endsAt: e.toISOString() } : {}) });
  }
  const note = mgr.status === "rejected" ? `upcoming offers unavailable: ${mgr.reason?.message || "no access to /storefront/campaigns/manage"}` : "";
  return { offers: { weekend, upcoming }, note };
}

// GET /recipes (L3-11) -> Freshly { name, image, items: [product names], amounts }. null when the shop has none yet (the built-in recipes stay).
async function loadRecipes() {
  const j = await getJson("/recipes");
  const rows = Array.isArray(j?.recipes) ? j.recipes : [];
  if (!rows.length) return null;
  return rows.map((r) => ({
    id: r.id, name: r.name, ...(r.image_url ? { image: r.image_url } : {}),
    items: (r.items || []).map((i) => i.name).filter(Boolean),
    ...(r.per_person && Object.keys(r.per_person).length ? { amounts: r.per_person } : {}),
  }));
}

const fail = (part, e) => { console.error(`[storefront] ${part}:`, e?.message || e); return `error: ${e?.message || e}`; };

async function build() {
  const out = { config: CONFIG, payments: defaultPayments(), areas: [], slots: [], offers: { weekend: [], upcoming: [] }, recipes: [], siteContent: {}, seo: {}, faviconUrl: "", language: "en", languageMode: "en", featureToggles: {}, support: {}, footerContent: {}, socialLinks: [], infoPages: {}, from: {} };
  let expressFee = 0;
  let deliveryFee = CONFIG.deliveryFee;
  try { const c = await loadConfig(); out.config = c.config; out.payments = c.payments; out.siteContent = c.siteContent; out.seo = c.seo; out.faviconUrl = c.faviconUrl; out.language = c.language; out.languageMode = c.languageMode; out.featureToggles = c.featureToggles; out.support = c.support; out.footerContent = c.footerContent; out.socialLinks = c.socialLinks; out.infoPages = c.infoPages; expressFee = c.expressFee; deliveryFee = c.deliveryFee; out.from.config = "dokani"; } catch (e) { out.from.config = fail("settings", e); }
  try { const d = await loadDelivery(expressFee, deliveryFee); if (d) { out.areas = d.areas; out.slots = d.slots; out.from.delivery = "dokani"; } else out.from.delivery = "empty (no active rows in storefront_delivery_options)"; } catch (e) { out.from.delivery = fail("delivery options", e); }
  try { const o = await loadOffers(); out.offers = o.offers; out.from.offers = o.offers.weekend.length + o.offers.upcoming.length ? `dokani${o.note ? ` (${o.note})` : ""}` : `empty (no live or upcoming campaigns)${o.note ? ` (${o.note})` : ""}`; } catch (e) { out.from.offers = fail("offers", e); }
  try { const r = await loadRecipes(); if (r) { out.recipes = r; out.from.recipes = "dokani"; } else out.from.recipes = "empty (no recipes)"; } catch (e) { out.from.recipes = fail("recipes", e); }
  return out;
}

export function getStoreExtras() {
  if (cache.value && Date.now() - cache.at < TTL) return Promise.resolve(cache.value);
  if (!cache.pending) cache.pending = build().then((v) => { cache = { at: Date.now(), value: v, pending: null }; return v; }).catch((e) => { cache.pending = null; throw e; });
  return cache.pending;
}

// Metadata needs only the settings endpoint; fetching delivery, offers and recipes
// here would delay the initial HTML for every route when the shop API is slow.
export async function getStoreSEO() {
  if (seoCache.value && Date.now() - seoCache.at < TTL) return Promise.resolve(seoCache.value);
  if (!seoCache.pending) {
    seoCache.pending = getJson("/settings").then((json) => {
      const settings = json?.settings && typeof json.settings === "object" ? json.settings : json || {};
      const value = { seo: settings.seo || {}, faviconUrl: settings.favicon_url || "", language: settings.language || "en", languageMode: settings.language_mode || (settings.language === "bn" ? "bn" : "en") };
      seoCache = { at: Date.now(), value, pending: null };
      return value;
    }).catch(() => { seoCache.pending = null; throw new Error("Store SEO settings are unavailable."); });
  }
  let timer;
  try {
    return await Promise.race([
      seoCache.pending,
      new Promise((resolve) => { timer = setTimeout(() => resolve(seoCache.value || {}), 1800); }),
    ]);
  } finally { clearTimeout(timer); }
}
