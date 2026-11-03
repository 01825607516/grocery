export const money = (n) => `৳${Math.round(n).toLocaleString("en-US")}`;
export const stepOf = (p) => (p.unit === "kg" ? 0.5 : 1);
export const unitLabel = (p) => (p.unit === "kg" ? "/kg" : "");
// 0.5 kg -> "500 g", 2 kg -> "2 kg", pieces -> "3"
export const qtyLabel = (p, q) => (p.unit === "kg" ? (q < 1 ? `${Math.round(q * 1000)} g` : `${+q.toFixed(2)} kg`) : `${q}`);
// Most the shopper may add: stock-limited ("Only 3 Left") or 20 per item.
export const maxQty = (p, configuredLimit = 10) => (p.status === "out" ? 0 : Math.min(p.stock == null ? configuredLimit : Number(p.stock), configuredLimit));
// Price for a quantity (weight-based items: price is per kg, so 500 g costs half). Whole taka.
export const lineTotal = (p, q) => Math.round(p.price * q);
export const isPhone = (v) => /^(?:\+?88)?01[3-9]\d{8}$/.test(String(v).replace(/[\s-]/g, ""));
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
export const cleanEmail = (v) => String(v || "").trim().toLowerCase();
export const cleanPhone = (v) => String(v).replace(/[\s-]/g, "").replace(/^\+?88/, "");
// Login / register accept ONE field: an email OR a Bangladeshi mobile number.
// Returns { type: "email" | "phone", value } (value is normalised), or null if it is neither.
export const parseIdentifier = (v) => {
  const raw = String(v || "").trim();
  if (isEmail(raw)) return { type: "email", value: cleanEmail(raw) };
  if (isPhone(raw)) return { type: "phone", value: cleanPhone(raw) };
  return null;
};
