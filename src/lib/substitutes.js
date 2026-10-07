// "Not available? Try these." Same category first, then same sub-category / brand, then the closest price. Never suggests out-of-stock items.
export function substitutes(p, products, limit = 5) {
  if (!p) return [];
  return products
    .filter((x) => x.id !== p.id && x.status !== "out" && x.category === p.category)
    .map((x) => ({ x, score: (x.sub === p.sub ? 100 : 0) + (x.brand === p.brand ? 10 : 0) - (Math.abs(x.price - p.price) / Math.max(p.price, 1)) * 20 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.x);
}
