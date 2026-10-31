// SERVER ONLY. Store-wide settings read from the Dokani backend and turned into the shapes Freshly's screens use:
//   /settings            -> config (free delivery limit...) + payments
//   /delivery/options    -> areas + time slots
//   /storefront/campaigns/manage -> offers { weekend (live now), upcoming }
// Every part has a safe fallback to the built-in demo data (src/lib/data.js), so an empty table never leaves the website blank.
import { dokaniSend } from "./client";
import { AREAS, CONFIG, PAYMENTS, SLOTS, UPCOMING_OFFERS, WEEKEND_OFFERS } from "@/lib/data";

const TTL = 60 * 1000;
let cache = { at: 0, value: null, pending: null };
export const clearStoreCache = () => { cache = { at: 0, value: null, pending: null }; };

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

async function loadConfig() {
  const j = await getJson("/settings");
  const s = j?.settings && typeof j.settings === "object" && Object.keys(j.settings).length ? j.settings : j || {};
  const free = num(s.free_delivery_over, 0);
  return {
    config: { ...CONFIG, ...(free > 0 ? { freeDeliveryLimit: free } : {}), ...(num(s.subscribe_pct) > 0 ? { subscribePct: num(s.subscribe_pct) } : {}), ...(s.lead_hours != null ? { leadHours: num(s.lead_hours, CONFIG.leadHours) } : {}) },
    expressFee: num(s.express_fee, 0),
    payments: Array.isArray(s.payments) && s.payments.length ? s.payments.map(String) : PAYMENTS,
    siteContent: s.site_content && typeof s.site_content === "object" ? s.site_content : {},
    support: s.support && typeof s.support === "object" ? s.support : {},
  };
}

async function loadDelivery(expressFee) {
  const j = await getJson("/delivery/options");
  const rows = (Array.isArray(j?.options) ? j.options : []).filter((r) => r && Number(r.status) !== 0);
  if (!rows.length) return null;
  const seen = new Set();
  const areas = rows.map((r) => {
    const days = num(r.estimated_days, 0), courier = days >= 2;
    return {
      id: String(r.area_id ?? r.id), name: r.name || r.area || r.city || `Area ${r.id}`, charge: num(r.charge),
      express: !courier && expressFee > 0, expressCharge: !courier ? expressFee : 0, courier, ...(courier ? { eta: `${days} days` } : {}),
    };
  }).filter((a) => !seen.has(a.id) && seen.add(a.id));
  const labels = [...new Set(rows.flatMap((r) => String(r.slot || "").split(/[;|]/).map((s) => s.trim()).filter(Boolean)))];
  const slots = labels.length ? labels.map((label, i) => ({ id: `s${i + 1}`, label, startHour: startHourOf(label) })) : SLOTS;
  return { areas, slots };
}

const dhaka = (s) => { if (!s) return null; const d = new Date(String(s).replace(" ", "T") + (/[zZ]|[+-]\d\d:?\d\d$/.test(String(s)) ? "" : "+06:00")); return Number.isNaN(+d) ? null : d; };

// A campaign's `content` may carry the Freshly extras as JSON, e.g. {"cats":["veg","fruits"],"bg":"#d6c5a2","off":30,"tag":"FLASH DEAL"}. Plain text content is simply ignored.
function toOffer(r) {
  let x = {}; try { const c = JSON.parse(r.content || ""); if (c && typeof c === "object") x = c; } catch {}
  return { id: `c${r.id}`, title: r.title_en || r.title || "", image: r.image_url || "", bg: x.bg || "#d6c5a2", cats: Array.isArray(x.cats) ? x.cats : [], ...(x.off != null ? { off: num(x.off) } : {}), ...(x.tag ? { tag: String(x.tag) } : {}) };
}
async function loadOffers() {
  const j = await getJson("/storefront/campaigns/manage");
  const now = new Date();
  const rows = (Array.isArray(j?.campaigns) ? j.campaigns : []).filter((r) => Number(r.status) !== 0 && r.type !== "theme");
  const weekend = [], upcoming = [];
  for (const r of rows) {
    const s = dhaka(r.starts_at), e = dhaka(r.ends_at);
    if (s && s > now) upcoming.push({ ...toOffer(r), startsAt: s.toISOString() });
    else if (!e || e >= now) weekend.push({ ...toOffer(r), ...(e ? { endsAt: e.toISOString() } : {}) });
  }
  return weekend.length || upcoming.length ? { weekend, upcoming } : null;
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

async function build() {
  const out = { config: CONFIG, payments: PAYMENTS, areas: AREAS, slots: SLOTS, offers: { weekend: WEEKEND_OFFERS, upcoming: UPCOMING_OFFERS }, recipes: null, siteContent: {}, support: {}, from: {} };
  let expressFee = 0;
  try { const c = await loadConfig(); out.config = c.config; out.payments = c.payments; out.siteContent = c.siteContent; out.support = c.support; expressFee = c.expressFee; out.from.config = "dokani"; } catch (e) { out.from.config = `demo (${e.message})`; }
  try { const d = await loadDelivery(expressFee); if (d) { out.areas = d.areas; out.slots = d.slots; out.from.delivery = "dokani"; } else out.from.delivery = "demo (no rows in storefront_delivery_options)"; } catch (e) { out.from.delivery = `demo (${e.message})`; }
  try { const o = await loadOffers(); if (o) { out.offers = o; out.from.offers = "dokani"; } else out.from.offers = "demo (no campaigns)"; } catch (e) { out.from.offers = `demo (${e.message})`; }
  try { const r = await loadRecipes(); if (r) { out.recipes = r; out.from.recipes = "dokani"; } else out.from.recipes = "demo (no recipes)"; } catch (e) { out.from.recipes = `demo (${e.message})`; }
  return out;
}

export function getStoreExtras() {
  if (cache.value && Date.now() - cache.at < TTL) return Promise.resolve(cache.value);
  if (!cache.pending) cache.pending = build().then((v) => { cache = { at: Date.now(), value: v, pending: null }; return v; }).catch((e) => { cache.pending = null; throw e; });
  return cache.pending;
}
