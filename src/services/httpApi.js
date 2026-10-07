// REAL BACKEND. Same method names / return shapes as mockApi.js.
// When the supervisor's API is ready: set NEXT_PUBLIC_API_URL, then adjust ONLY the paths / field names in this file
// (adapters at the top turn the server's JSON into the shapes the UI uses). Full contract: API_CONTRACT.md
import { http } from "./http";
import { tokenStore } from "./tokenStore";

const discountOf = (price, mrp) => (mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0);

// server product -> UI product
export const toProduct = (r) => {
  const price = Number(r.price), mrp = Number(r.mrp ?? r.price);
  const stock = r.stock ?? null;
  const status = stock === 0 ? "out" : r.status ?? (stock != null && stock <= 3 ? "low" : null); // "fresh" | "low" | "near" | "out" | null
  return {
    id: r.id, name: r.name, brand: r.brand, category: r.category, sub: r.sub ?? r.subCategory ?? "",
    price, mrp, unit: r.unit === "kg" ? "kg" : "pc", status, stock,
    image: r.image ?? r.imageUrl ?? r.image_url ?? "", fallback: r.fallback ?? "", kind: r.kind, color: r.color,
    discount: r.discount ?? discountOf(price, mrp), subscribable: !!r.subscribable,
    rating: r.rating ?? undefined, reviewCount: r.reviewCount ?? r.review_count ?? undefined, reviews: r.reviews, // optional, see API_CONTRACT.md
  };
};
const toCategory = (r) => ({ id: r.id, name: r.name, subs: r.subs ?? r.subCategories ?? [], image: r.image ?? r.imageUrl ?? "", fallback: r.fallback ?? "", color: r.color });
const toUser = (u) => ({ id: u.id, name: u.name, email: u.email });

export const httpApi = {
  // reviews ---------------------------------------------------------------------
  getReviews: (productId) => (productId ? http(`/products/${productId}/reviews`, { auth: false }) : Promise.resolve({})), // [{ id, name, rating, text, createdAt }]
  voteReview: (productId, reviewId) => http(`/products/${productId}/reviews/${reviewId}/helpful`, { method: "POST" }),         // toggles your "Helpful" vote -> the updated review
  addReview: (productId, body) => http(`/products/${productId}/reviews`, { method: "POST", body }),                   // body { rating: 1-5, text } -> the saved review
  // auth ---------------------------------------------------------------------
  async register(body) { const r = await http("/auth/register", { method: "POST", body, auth: false }); tokenStore.set(r.token); return { token: r.token, user: toUser(r.user) }; },
  async login(body) { const r = await http("/auth/login", { method: "POST", body, auth: false }); tokenStore.set(r.token); return { token: r.token, user: toUser(r.user) }; },
  async me() { return toUser(await http("/auth/me")); },
  updateProfile: async (body) => toUser(await http("/auth/profile", { method: "PUT", body })),            // body { name } -> user
  changePassword: (body) => http("/auth/password", { method: "POST", body }),                                 // body { current, next }
  async logout() { try { await http("/auth/logout", { method: "POST" }); } catch {} tokenStore.clear(); },

  // catalog (public) -----------------------------------------------------------
  async getCatalog() {
    const [cats, prods, offers, recipes, delivery, cfg] = await Promise.all([
      http("/categories", { auth: false }), http("/products", { auth: false }), http("/offers", { auth: false }),
      http("/recipes", { auth: false }), http("/delivery/options", { auth: false }), http("/config", { auth: false }),
    ]);
    const products = prods.map(toProduct);
    return {
      categories: cats.map(toCategory), products, brands: [...new Set(products.map((p) => p.brand))],
      offers: { weekend: offers.live ?? [], upcoming: offers.upcoming ?? [] },   // offer: { id, title, image, bg, cats[] , startsInHours? , endsAt? }
      recipes,                                                                    // recipe: { name, image?, items: [productName...] }
      areas: delivery.areas, slots: delivery.slots,                               // see API_CONTRACT.md
      payments: cfg.payments, config: { freeDeliveryLimit: cfg.freeDeliveryLimit, subscribePct: cfg.subscribePct, leadHours: cfg.leadHours ?? 1 },
    };
  },

  // cart / wishlist ------------------------------------------------------------
  getCart: () => http("/cart"),                                   // { items: { "<productId>": qty }, subscribed: [id], substitutions: { "<id>": "brand"|"remove"|"call" } }
  saveCart: (cart) => http("/cart", { method: "PUT", body: cart }),
  getWishlist: async () => (await http("/wishlist")).productIds,  // [productId]
  setWishlisted: async (id, on) => (await http(`/wishlist/${id}`, { method: on ? "PUT" : "DELETE" })).productIds,

  // addresses ------------------------------------------------------------------
  getAddresses: () => http("/addresses"),                          // [{ id, type: "Home"|"Office", line, areaId }]
  saveAddress: (a) => (a.id ? http(`/addresses/${a.id}`, { method: "PUT", body: a }) : http("/addresses", { method: "POST", body: a })),
  deleteAddress: (id) => http(`/addresses/${id}`, { method: "DELETE" }),

  // coupons / orders -----------------------------------------------------------
  validateCoupon: (body) => http("/coupons/validate", { method: "POST", body }),   // -> { code, type: "percent"|"flat", value, max?, min?, label? }  (422/404 + message when invalid)
  placeOrder: (body) => http("/orders", { method: "POST", body }),
  getOrders: () => http("/orders"),
  getOrder: (id) => http(`/orders/${id}`),
  requestReturn: (id, body) => http(`/orders/${id}/return`, { method: "POST", body }),                         // body { reason, note } -> the updated order (returnRequest set)
  cancelOrder: (id) => http(`/orders/${id}/cancel`, { method: "POST" }),                                      // -> the updated order (status "cancelled")
};
