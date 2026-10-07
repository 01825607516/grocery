// Ratings + reviews. NO fake data: a product shows only reviews that really exist.
// Source of truth = the API. A product may arrive with `rating`, `reviewCount` and `reviews`,
// and the full list is fetched from GET /products/:id/reviews when its popup opens (see context/ReviewContext.js).
// A review looks like: { id, userId?, name, rating, text, createdAt (ms | ISO), verified?, helpful?, voted? }

const toMs = (t) => (typeof t === "number" ? t : t ? new Date(t).getTime() || 0 : 0);

const ago = (t) => {
  const ms = toMs(t);
  if (!ms) return "";
  const d = Math.floor((Date.now() - ms) / 864e5);
  if (d < 1) return "Today";
  if (d < 7) return `${d} day${d > 1 ? "s" : ""} ago`;
  if (d < 30) { const w = Math.floor(d / 7); return `${w} week${w > 1 ? "s" : ""} ago`; }
  const m = Math.floor(d / 30);
  return `${m} month${m > 1 ? "s" : ""} ago`;
};

// loaded = list fetched for this product (or undefined if not fetched yet); p = the product
// returns { rating, count, dist: [pct5..pct1], counts: [n5..n1], list }
export function summarize(loaded, p) {
  const list = loaded ?? p.reviews ?? [];
  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;
  const count = loaded ? list.length : (p.reviewCount ?? list.length);
  const rating = loaded ? avg : (p.rating ?? avg);
  const counts = [5, 4, 3, 2, 1].map((n) => list.filter((r) => Math.round(r.rating) === n).length);
  const dist = counts.map((c) => (list.length ? Math.round((c / list.length) * 100) : 0));
  return { rating: Number(rating) || 0, count, dist, counts, list: list.map((r) => ({ ...r, ts: toMs(r.createdAt), date: r.date ?? ago(r.createdAt) })) };
}

export const SORTS = [["new", "Newest"], ["helpful", "Most helpful"], ["high", "Highest rating"], ["low", "Lowest rating"]];

// star = 0 (all) or 1..5 ; sort = one of SORTS keys
export function arrange(list, sort = "new", star = 0) {
  const out = star ? list.filter((r) => Math.round(r.rating) === star) : list.slice();
  const by = {
    new: (a, b) => b.ts - a.ts,
    helpful: (a, b) => (b.helpful || 0) - (a.helpful || 0) || b.ts - a.ts,
    high: (a, b) => b.rating - a.rating || b.ts - a.ts,
    low: (a, b) => a.rating - b.rating || b.ts - a.ts,
  };
  return out.sort(by[sort] || by.new);
}

// Did this customer order the product (and not cancel it)? Used only for the hint in the review form;
// the real "verified" flag always comes from the server.
export const hasBought = (orders, productId) => (orders || []).some((o) => o.status !== "cancelled" && (o.items || []).some((i) => i.productId === productId));
