// "Notify me when back in stock" - stored per browser (mock). A real backend: POST /products/:id/notify.
const KEY = "gs_notify_me";
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
export const isWatching = (id) => read().includes(id);
export function setWatching(id, on) {
  const next = on ? [...new Set([...read(), id])] : read().filter((x) => x !== id);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  return next;
}
