// MOCK BACKEND - lives in the browser (localStorage). Same methods/shapes as httpApi.js, so the UI never knows the difference.
// Plain-text passwords here are fine for a mock ONLY. Never do this on a real server.
import { AREAS, BRANDS, CATEGORIES, CONFIG, LAST_ORDER, PAYMENTS, PRODUCTS, RECIPES, SLOTS, UPCOMING_OFFERS, WEEKEND_OFFERS } from "../lib/data";
import { DEMO_REVIEWS, DEMO_VERSION, buildDemoReviews } from "../lib/demoReviews";
import { buildSlots, slotDate } from "../lib/delivery";
import { cleanEmail, isEmail, isPhone, maxQty, lineTotal } from "../lib/format";
import { ORDER_STEPS } from "../lib/orders";
import { computeTotals } from "../lib/pricing";
import { ApiError } from "./http";
import { tokenStore } from "./tokenStore";

export const STATIC_CATALOG = {
  categories: CATEGORIES, products: PRODUCTS, brands: BRANDS,
  offers: { weekend: WEEKEND_OFFERS, upcoming: UPCOMING_OFFERS }, recipes: RECIPES,
  areas: AREAS, slots: SLOTS, payments: PAYMENTS, config: CONFIG,
};

const COUPONS = {
  FRESH10: { code: "FRESH10", type: "percent", value: 10, max: 200, min: 300, label: "10% off (max ৳200, min order ৳300)" },
  WELCOME50: { code: "WELCOME50", type: "flat", value: 50, min: 500, label: "৳50 off (min order ৳500)" },
  FREESHIP: { code: "FREESHIP", type: "freedelivery", value: 0, min: 200, label: "Free delivery (min order ৳200)" },
};
// Demo speed: an order moves to the next status every ~25 s so tracking can be seen. A real backend sets these from the warehouse.
const STAGE_AFTER_SEC = [0, 20, 45, 75, 110];

// ---- tiny "database" -------------------------------------------------------
const mem = {};
const has = () => { try { return typeof window !== "undefined" && !!window.localStorage; } catch { return false; } };
const read = (k, d) => { try { const v = has() ? localStorage.getItem(k) : mem[k]; return v ? JSON.parse(v) : d; } catch { return d; } };
const write = (k, v) => { try { has() ? localStorage.setItem(k, JSON.stringify(v)) : (mem[k] = JSON.stringify(v)); } catch {} };
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const uid = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const byId = new Map(PRODUCTS.map((p) => [p.id, p]));

const users = () => read("gs_m_users", []);
const currentUser = () => {
  const t = tokenStore.get();
  const u = t && t.startsWith("mock.") ? users().find((x) => x.id === t.slice(5)) : null;
  if (!u) throw new ApiError("Please log in to continue.", 401);
  return u;
};
const publicUser = ({ id, name, email }) => ({ id, name, email });
const mine = (key, u, d) => read(`gs_m_${key}_${u.id}`, d);
const save = (key, u, v) => write(`gs_m_${key}_${u.id}`, v);

function withStatus(o) {
  if (o.status === "cancelled") return o;
  const sec = (Date.now() - o.createdAt) / 1000;
  const i = STAGE_AFTER_SEC.reduce((n, t, k) => (sec >= t ? k : n), 0);
  return { ...o, status: ORDER_STEPS[i].key };
}

// ---- the API ---------------------------------------------------------------
const shortName = (n) => { const [a, ...r] = String(n).trim().split(/\s+/); return r.length ? `${a} ${r[r.length - 1][0].toUpperCase()}.` : a; };

// DEMO: fill the mock database with sample reviews once (see lib/demoReviews.js). Real customer reviews already saved are kept.
function ensureDemoReviews() {
  if (!DEMO_REVIEWS || read("gs_m_reviews_seed", 0) === DEMO_VERSION) return;
  const all = read("gs_m_reviews", {});
  for (const [id, list] of Object.entries(buildDemoReviews(PRODUCTS))) all[id] = [...(all[id] || []).filter((r) => !String(r.id).startsWith("demo_")), ...list];
  write("gs_m_reviews", all); write("gs_m_reviews_seed", DEMO_VERSION);
}

const softUser = () => { try { return currentUser(); } catch { return null; } };
const pubReview = ({ helpfulBy = [], ...r }, me) => ({ ...r, helpful: helpfulBy.length, voted: !!me && helpfulBy.includes(me) });

export const mockApi = {
  // reviews: anyone can read, a logged-in customer can write. One review per customer per product (posting again updates it).
  // `verified` = the customer has a (non-cancelled) order containing that product. `helpful` = number of "Helpful" votes.
  async getReviews(productId) {
    await delay(60);
    ensureDemoReviews();
    const all = read("gs_m_reviews", {}); const me = softUser()?.id;
    if (productId) return (all[productId] || []).map((r) => pubReview(r, me));
    return Object.fromEntries(Object.entries(all).map(([id, list]) => [id, list.map((r) => pubReview(r, me))]));
  },
  async addReview(productId, { rating, text }) {
    await delay();
    const u = currentUser();
    const r = Math.round(Number(rating));
    if (!(r >= 1 && r <= 5)) throw new ApiError("Please choose 1 to 5 stars.", 422);
    if (!byId.has(productId)) throw new ApiError("Product not found.", 404);
    const all = read("gs_m_reviews", {}); const list = all[productId] || [];
    const old = list.find((x) => x.userId === u.id);
    const verified = mine("orders", u, []).some((o) => o.status !== "cancelled" && o.items.some((i) => i.productId === productId));
    const review = { id: old?.id || uid("rv"), userId: u.id, name: shortName(u.name), rating: r, text: String(text || "").trim().slice(0, 500), createdAt: Date.now(), verified, helpfulBy: old?.helpfulBy || [] };
    all[productId] = [review, ...list.filter((x) => x.userId !== u.id)];
    write("gs_m_reviews", all);
    return pubReview(review, u.id);
  },
  // "Helpful" vote: tap once to add, tap again to remove. You can't vote on your own review.
  async voteReview(productId, reviewId) {
    await delay(60);
    const u = currentUser();
    const all = read("gs_m_reviews", {}); const list = all[productId] || [];
    const r = list.find((x) => x.id === reviewId);
    if (!r) throw new ApiError("Review not found.", 404);
    if (r.userId === u.id) throw new ApiError("You can't vote on your own review.", 422);
    const by = r.helpfulBy || [];
    r.helpfulBy = by.includes(u.id) ? by.filter((x) => x !== u.id) : [...by, u.id];
    write("gs_m_reviews", all);
    return pubReview(r, u.id);
  },
  // auth
  async register({ name, email, password }) {
    await delay();
    if (!name?.trim()) throw new ApiError("Please enter your name.", 422);
    if (!isEmail(email)) throw new ApiError("Enter a valid email address.", 422);
    if ((password || "").length < 6) throw new ApiError("Password must be at least 6 characters.", 422);
    const list = users(); const em = cleanEmail(email);
    if (list.some((u) => u.email === em)) throw new ApiError("This email is already registered. Please log in.", 409);
    const user = { id: uid("u"), name: name.trim(), email: em, password };
    write("gs_m_users", [...list, user]);
    // demo only: give every new account one past order so Quick reorder / recommendations have something to show
    const items = LAST_ORDER.map((n) => PRODUCTS.find((p) => p.name === n)).filter(Boolean).map((p) => ({ productId: p.id, name: p.name, unit: p.unit, price: p.price, qty: 1, total: p.price }));
    save("orders", user, [{ id: "ORD-" + String(100000 + Math.floor(Math.random() * 899999)), createdAt: Date.now() - 3 * 864e5, status: "delivered", items, address: { type: "Home", line: "—" }, delivery: { method: "standard", areaId: "dhaka", slot: null, eta: "" }, payment: { method: "Cash on Delivery" }, totals: { total: items.reduce((s, i) => s + i.total, 0) }, sample: true }]);
    const token = "mock." + user.id; tokenStore.set(token);
    return { token, user: publicUser(user) };
  },
  async login({ email, password }) {
    await delay();
    const u = users().find((x) => x.email === cleanEmail(email) && x.password === password);
    if (!u) throw new ApiError("Wrong email or password.", 401);
    const token = "mock." + u.id; tokenStore.set(token);
    return { token, user: publicUser(u) };
  },
  async me() { await delay(60); return publicUser(currentUser()); },
  async updateProfile({ name }) {
    await delay(80); const u = currentUser();
    if (!String(name || "").trim()) throw new ApiError("Please enter your name.", 422);
    write("gs_m_users", users().map((x) => (x.id === u.id ? { ...x, name: name.trim() } : x)));
    return publicUser({ ...u, name: name.trim() });
  },
  async changePassword({ current, next }) {
    await delay(100); const u = currentUser();
    if (u.password !== current) throw new ApiError("Your current password is wrong.", 401);
    if ((next || "").length < 6) throw new ApiError("New password must be at least 6 characters.", 422);
    write("gs_m_users", users().map((x) => (x.id === u.id ? { ...x, password: next } : x)));
  },
  async logout() { tokenStore.clear(); },

  // catalog (public - guests can browse)
  async getCatalog() { await delay(60); return STATIC_CATALOG; },

  // cart / wishlist
  async getCart() { await delay(60); return mine("cart", currentUser(), { items: {}, subscribed: [], substitutions: {} }); },
  async saveCart(cart) { const u = currentUser(); save("cart", u, cart); return cart; },
  async getWishlist() { await delay(60); return mine("wish", currentUser(), []); },
  async setWishlisted(productId, on) {
    const u = currentUser(); const cur = mine("wish", u, []);
    const next = on ? [...new Set([...cur, productId])] : cur.filter((x) => x !== productId);
    save("wish", u, next); return next;
  },

  // addresses
  async getAddresses() { await delay(60); return mine("addr", currentUser(), []); },
  async saveAddress(a) {
    await delay(80); const u = currentUser();
    if (!a.line?.trim()) throw new ApiError("Please enter the full address.", 422);
    if (!["Home", "Office"].includes(a.type)) throw new ApiError("Address type must be Home or Office.", 422);
    const list = mine("addr", u, []);
    const rec = { id: a.id || uid("a"), type: a.type, line: a.line.trim(), areaId: a.areaId };
    const next = a.id ? list.map((x) => (x.id === a.id ? rec : x)) : [...list, rec];
    save("addr", u, next); return rec;
  },
  async deleteAddress(id) { const u = currentUser(); save("addr", u, mine("addr", u, []).filter((a) => a.id !== id)); },

  // coupons
  async validateCoupon({ code, subtotal }) {
    await delay(100); // guests can try a coupon too (login is only needed at checkout)
    const c = COUPONS[String(code || "").trim().toUpperCase()];
    if (!c) throw new ApiError("This coupon code is not valid.", 404);
    if (c.min && subtotal < c.min) throw new ApiError(`Add ৳${c.min - subtotal} more to use ${c.code} (minimum order ৳${c.min}).`, 422);
    return c;
  },

  // orders
  async placeOrder(p) {
    await delay(500); const u = currentUser();
    if (!p.items?.length) throw new ApiError("Your cart is empty.", 422);
    const lines = p.items.map((i) => {
      const prod = byId.get(i.productId);
      if (!prod) throw new ApiError("A product in your cart is no longer available.", 422);
      if (prod.status === "out") throw new ApiError(`${prod.name} is out of stock. Please remove it from your cart.`, 422);
      if (i.qty <= 0 || i.qty > maxQty(prod)) throw new ApiError(`Only ${maxQty(prod)} of ${prod.name} available.`, 422);
      return { product: prod, qty: i.qty, total: lineTotal(prod, i.qty), subscribe: !!i.subscribe && prod.subscribable, substitution: i.substitution || "brand" };
    });
    const area = AREAS.find((a) => a.id === p.areaId);
    if (!area) throw new ApiError("Please choose a delivery area.", 422);
    const method = p.method === "express" ? "express" : "standard";
    if (method === "express" && !area.express) throw new ApiError("Express delivery is not available in your area.", 422);
    if (!p.address?.line?.trim()) throw new ApiError("Please enter your delivery address.", 422);
    let slot = null;
    if (!area.courier && method === "standard") {
      const s = buildSlots(SLOTS).list.find((x) => x.id === p.slot?.id && x.day === p.slot?.day);
      if (!s || s.disabled) throw new ApiError("That delivery time slot is no longer available. Please pick another.", 422);
      slot = { id: s.id, label: s.label, day: s.day, date: slotDate(s.day) };
    }
    if (!PAYMENTS.includes(p.payment?.method)) throw new ApiError("Please choose a payment method.", 422);
    if (["bKash", "Nagad"].includes(p.payment.method) && !isPhone(p.payment.phone)) throw new ApiError(`Enter your ${p.payment.method} number.`, 422);
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    let coupon = null;
    if (p.couponCode) coupon = await mockApi.validateCoupon({ code: p.couponCode, subtotal });
    const subscribed = lines.filter((l) => l.subscribe).map((l) => l.product.id);
    const totals = computeTotals({ lines, subscribed, coupon, area, method, cfg: CONFIG });
    const order = {
      id: "ORD-" + String(100000 + Math.floor(Math.random() * 899999)), createdAt: Date.now(), status: "confirmed",
      items: lines.map((l) => ({ productId: l.product.id, name: l.product.name, unit: l.product.unit, price: l.product.price, qty: l.qty, total: l.total, subscribe: l.subscribe, substitution: l.substitution })),
      address: { type: p.address.type, line: p.address.line.trim() },
      delivery: { method, areaId: area.id, areaName: area.name, slot, eta: area.eta || "" },
      payment: { method: p.payment.method, phone: p.payment.phone || null, status: p.payment.method === "Cash on Delivery" ? "pay_on_delivery" : "pending" },
      coupon: coupon ? coupon.code : null, totals,
    };
    save("orders", u, [order, ...mine("orders", u, [])]);
    return order;
  },
  async cancelOrder(id) { // allowed until the order is packed
    await delay(150); const u = currentUser();
    const list = mine("orders", u, []); const o = list.find((x) => x.id === id);
    if (!o) throw new ApiError("Order not found.", 404);
    if (!["confirmed", "preparing"].includes(withStatus(o).status)) throw new ApiError("This order is already packed and cannot be cancelled. Please call us.", 422);
    const next = list.map((x) => (x.id === id ? { ...x, status: "cancelled" } : x));
    save("orders", u, next); return withStatus(next.find((x) => x.id === id));
  },
  async requestReturn(id, { reason, note }) { // delivered orders only, once per order
    await delay(200); const u = currentUser();
    const list = mine("orders", u, []); const o = list.find((x) => x.id === id);
    if (!o) throw new ApiError("Order not found.", 404);
    if (withStatus(o).status !== "delivered") throw new ApiError("Only delivered orders can be returned.", 422);
    if (o.returnRequest) throw new ApiError("A return was already requested for this order.", 409);
    if (!String(reason || "").trim()) throw new ApiError("Please choose a reason.", 422);
    const next = list.map((x) => (x.id === id ? { ...x, returnRequest: { reason, note: note || "", at: Date.now() } } : x));
    save("orders", u, next); return withStatus(next.find((x) => x.id === id));
  },
  async getOrders() { await delay(60); return mine("orders", currentUser(), []).map(withStatus); },
  async getOrder(id) {
    const o = mine("orders", currentUser(), []).find((x) => x.id === id);
    if (!o) throw new ApiError("Order not found.", 404);
    return withStatus(o);
  },
};
