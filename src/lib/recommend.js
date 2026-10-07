// "Smart recommendation": scores products from what the shopper viewed, put in the cart and bought before.
//  + bought together with something in the cart / viewed (order history co-occurrence)  + same sub-category / category  + usual repurchase
export function recommend({ products, cartIds = [], viewedIds = [], orders = [], limit = 15 }) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const cart = new Set(cartIds);
  const seeds = [...cartIds, ...viewedIds].map((id) => byId.get(id)).filter(Boolean);
  const boughtCount = new Map();
  const together = new Map();
  for (const o of orders) {
    const ids = o.items.map((i) => i.productId);
    ids.forEach((id) => boughtCount.set(id, (boughtCount.get(id) || 0) + 1));
    for (const s of seeds) if (ids.includes(s.id)) ids.forEach((id) => id !== s.id && together.set(id, (together.get(id) || 0) + 1));
  }
  const subs = new Set(seeds.map((p) => `${p.category}/${p.sub}`));
  const cats = new Set(seeds.map((p) => p.category));
  const ranked = products
    .filter((p) => p.status !== "out" && !cart.has(p.id))
    .map((p) => ({ p, score: (together.get(p.id) || 0) * 3 + (subs.has(`${p.category}/${p.sub}`) ? 2 : 0) + (cats.has(p.category) ? 1 : 0) + (boughtCount.get(p.id) ? 1.5 : 0) + p.discount / 100 }))
    .filter((x) => x.score >= 1)
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit).map((x) => x.p);
}
