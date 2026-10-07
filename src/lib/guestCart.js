// Guest cart: no UI. Items are kept in localStorage while logged out, then merged into the account cart after login.
const KEY = "gs_guest_cart";
export const readGuestCart = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
export const writeGuestCart = (items) => { try { localStorage.setItem(KEY, JSON.stringify(items || {})); } catch {} };
export const clearGuestCart = () => { try { localStorage.removeItem(KEY); } catch {} };
// server cart wins on conflicts only for qty: we add quantities together, capped by maxQty
export function mergeCarts(server = {}, guest = {}, cap = () => Infinity) {
  const out = { ...server };
  for (const [id, q] of Object.entries(guest)) out[id] = Math.min(cap(id), (out[id] || 0) + q);
  return out;
}
