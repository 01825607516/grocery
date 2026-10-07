// Pack-size variants for weight-sold products (500g / 1kg / 5kg).
// Price comes from the product's per-kg price, so no backend change is needed.
// If the API sends `variants: [{ id, label, qty, price? }]` on a product, that wins.
export const DEFAULT_VARIANTS = [
  { id: "500g", label: "500 g", qty: 0.5 },
  { id: "1kg", label: "1 kg", qty: 1 },
  { id: "5kg", label: "5 kg", qty: 5 },
];

export function variantsOf(p) {
  if (!p) return [];
  if (Array.isArray(p.variants) && p.variants.length) return p.variants;
  return p.unit === "kg" ? DEFAULT_VARIANTS : [];
}

export const variantPrice = (p, v) => (v.price != null ? v.price : Math.round(p.price * v.qty));
