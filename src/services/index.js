// The ONLY file the UI imports data-access from:   import { api } from "@/services";
import { USE_MOCK, AUTH_API_URL } from "./config";
import { mockApi, setMockProducts } from "./mockApi";
import { httpApi } from "./httpApi";
import { authApi } from "./authApi";
import { realApi } from "./realApi";

// NEXT_PUBLIC_AUTH_API set -> real shopper account + wishlist, addresses, reviews, coupons, orders, alerts (Dokani backend, through /api/shop).
//   The cart stays in the browser (see realApi.js). Set NEXT_PUBLIC_REAL_SHOP=0 to go back to "auth only, the rest mock".
// Empty -> pure mock. NEXT_PUBLIC_API_URL set -> full real API (httpApi.js).
const REAL_SHOP = process.env.NEXT_PUBLIC_REAL_SHOP !== "0";
export const api = USE_MOCK ? (AUTH_API_URL ? { ...mockApi, ...authApi, ...(REAL_SHOP ? realApi : {}) } : mockApi) : httpApi;
export { USE_MOCK } from "./config";
export { ApiError } from "./http";
export { STATIC_CATALOG } from "./mockApi";
// Tell the mock which products exist (used when the catalogue comes from Dokani Cloud). Does nothing with a real backend API.
export const registerProducts = (items) => { if (USE_MOCK) setMockProducts(items); };
