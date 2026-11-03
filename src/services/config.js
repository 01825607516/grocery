// ---------------------------------------------------------------------------
// Where the website gets its data. There is NO mock / demo mode any more.
//   - catalogue (products, categories, offers, recipes, delivery areas ...) -> /api/dokani/catalog (our Next.js server -> Dokani database)
//   - shopper account, cart, wishlist, addresses, reviews, coupons, orders  -> /api/shop          (our Next.js server -> Dokani database)
// The browser never talks to Dokani directly; the shop login stays on the server (see src/services/dokani/).
// ---------------------------------------------------------------------------
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, ""); // only used by the optional generic REST adapter (httpApi.js)
export const AUTH_API_URL = (process.env.NEXT_PUBLIC_AUTH_API || "/api/shop").replace(/\/$/, "");
