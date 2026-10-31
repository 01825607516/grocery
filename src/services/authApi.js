// REAL shopper auth (Dokani backend: L2-01 .. L2-06) through OUR Next.js server (src/app/api/shop/[...path]/route.js).
// The browser never sees the Dokani service-account login; it only holds the SHOPPER token.
// Same method names / return shapes as mockApi.js, so the UI does not change.
import { http } from "./http";
import { tokenStore } from "./tokenStore";
import { AUTH_API_URL } from "./config";

const base = AUTH_API_URL;
const toUser = (u) => ({ id: u.id, name: u.name, email: u.email || "", phone: u.phone || "" });
// the rest of the app (cart / wishlist / orders) is still the browser mock, it needs to know who is logged in
const remember = (u) => { try { localStorage.setItem("gs_real_user", JSON.stringify(toUser(u))); } catch {} };
const forget = () => { try { localStorage.removeItem("gs_real_user"); } catch {} };

export const authApi = {
  // body { name, password, identifier, email | phone }  ->  { token, user }
  async register(body) { const r = await http("/auth/register", { method: "POST", body, auth: false, base }); tokenStore.set(r.token); remember(r.user); return { token: r.token, user: toUser(r.user) }; },
  async login(body) { const r = await http("/auth/login", { method: "POST", body, auth: false, base }); tokenStore.set(r.token); remember(r.user); return { token: r.token, user: toUser(r.user) }; },
  async me() { const u = await http("/auth/me", { base }); remember(u); return toUser(u); },
  async updateProfile(body) { const u = await http("/auth/profile", { method: "PUT", body, base }); remember(u); return toUser(u); },   // body { name } (phone, email, birth_date also accepted)
  changePassword: (body) => http("/auth/password", { method: "POST", body, base }),                                                    // body { current, next } -> 204
  async logout() { try { await http("/auth/logout", { method: "POST", base }); } catch {} tokenStore.clear(); forget(); },
};
