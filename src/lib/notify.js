// "Notify me when back in stock" - stored per browser (mock). A real backend: POST /products/:id/notify.
const KEY = "gs_notify_me";
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
export const isWatching = (id) => read().includes(id);
export function setWatching(id, on) {
  const next = on ? [...new Set([...read(), id])] : read().filter((x) => x !== id);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  return next;
}

// "Tell me if the price drops" - same idea, stored per browser (mock). A real backend: POST /products/:id/price-alert.
const PKEY = "gs_price_alert";
const pread = () => { try { return JSON.parse(localStorage.getItem(PKEY) || "[]"); } catch { return []; } };
export const isPriceWatching = (id) => pread().includes(id);
export function setPriceWatching(id, on) {
  const next = on ? [...new Set([...pread(), id])] : pread().filter((x) => x !== id);
  try { localStorage.setItem(PKEY, JSON.stringify(next)); } catch {}
  return next;
}

// Price the product had when the shopper saved it to the wishlist, so the wishlist can say "cheaper now".
const WKEY = "gs_wish_price";
const wread = () => { try { return JSON.parse(localStorage.getItem(WKEY) || "{}"); } catch { return {}; } };
export const getWishPrice = (id) => { const v = wread()[id]; return typeof v === "number" ? v : null; };
export function setWishPrice(id, price) {
  const all = wread();
  if (price == null) delete all[id]; else if (all[id] == null) all[id] = price;
  try { localStorage.setItem(WKEY, JSON.stringify(all)); } catch {}
}
