// REAL shopper data (wishlist, addresses, reviews, coupons, orders, alerts) through our own Next.js server route /api/shop.
// Same method names and return shapes as mockApi.js, so no screen needs to change.
// The cart itself stays in the browser (mockApi): Dokani's cart only holds whole numbers (no 0.5 kg) and has no "subscribe / substitution" fields.
import { http } from "./http";
import { AUTH_API_URL } from "./config";

const base = AUTH_API_URL;
const call = (path, opts = {}) => http(path, { base, ...opts });

// Dokani has no "return requested" flag on an order, so the website remembers it per browser (the server also refuses a second request).
const RKEY = "gs_returns";
const rread = () => { try { return JSON.parse(localStorage.getItem(RKEY) || "{}"); } catch { return {}; } };
const rsave = (id, r) => { try { localStorage.setItem(RKEY, JSON.stringify({ ...rread(), [id]: r })); } catch {} };
const withReturn = (o) => { const r = rread()[o.id]; return r && !o.returnRequest ? { ...o, returnRequest: r } : o; };

export const realApi = {
  // cart (L2-19 / L2-20): saved on the server, so it follows the shopper to another phone / browser
  getCart: () => call("/cart"),
  saveCart: (cart) => call("/cart", { method: "PUT", body: cart }),

  // "Remind me" on an upcoming offer (L3-14 / L3-15). id looks like "c12"
  setOfferRemind: (id, on) => call(`/offers/${id}/remind`, { method: on ? "POST" : "DELETE" }),

  // reviews
  getReviews: (productId) => (productId ? call(`/products/${productId}/reviews`, { auth: false }) : Promise.resolve({})),
  addReview: (productId, body) => call(`/products/${productId}/reviews`, { method: "POST", body }),
  voteReview: (productId, reviewId) => call(`/products/${productId}/reviews/${reviewId}/helpful`, { method: "POST" }),

  // wishlist
  getWishlist: async () => (await call("/wishlist")).productIds,
  setWishlisted: async (id, on) => (await call(`/wishlist/${id}`, { method: on ? "PUT" : "DELETE" })).productIds,

  // addresses
  getAddresses: () => call("/addresses"),
  saveAddress: (a) => (a.id ? call(`/addresses/${a.id}`, { method: "PUT", body: a }) : call("/addresses", { method: "POST", body: a })),
  deleteAddress: (id) => call(`/addresses/${id}`, { method: "DELETE" }),

  // coupons / orders
  validateCoupon: (body) => call("/coupons/validate", { method: "POST", body }),
  placeOrder: (body) => call("/orders", { method: "POST", body }),
  getOrders: async () => (await call("/orders")).map(withReturn),
  getOrder: async (id) => withReturn(await call(`/orders/${id}`)),
  cancelOrder: (id) => call(`/orders/${id}/cancel`, { method: "POST" }),
  async requestReturn(id, body) {
    try { const o = await call(`/orders/${id}/return`, { method: "POST", body }); if (o.returnRequest) rsave(id, o.returnRequest); return withReturn(o); }
    catch (e) { if (e.status === 409) rsave(id, { reason: body.reason, note: body.note || "", at: Date.now() }); throw e; }
  },

  // alerts: "notify me when back in stock" / "tell me if the price drops". The screens keep their quick browser copy (lib/notify.js);
  // these calls save it on the server too, and getAlerts() restores it after login.
  getAlerts: () => call("/me/alerts"),
  setNotify: (id, on) => call(`/products/${id}/notify`, { method: on ? "POST" : "DELETE" }),
  setPriceAlert: (id, on) => call(`/products/${id}/price-alert`, { method: on ? "POST" : "DELETE" }),
};
