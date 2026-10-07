// One pricing function used by the cart drawer, checkout AND the mock backend (a real backend must repeat this maths itself).
// coupon = { code, type: "percent" | "flat", value, max?, min? }
export const couponDiscount = (coupon, base) => {
  if (!coupon || base <= 0 || (coupon.min && base < coupon.min)) return 0;
  const raw = coupon.type === "flat" ? coupon.value : (base * coupon.value) / 100;
  return Math.min(Math.round(raw), coupon.max || Infinity, base);
};

export function computeTotals({ lines, subscribed = [], coupon = null, area, method = "standard", cfg }) {
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const subDiscount = Math.round(lines.filter((l) => l.product.subscribable && subscribed.includes(l.product.id)).reduce((s, l) => s + l.total * (cfg.subscribePct / 100), 0));
  const couponOff = couponDiscount(coupon, subtotal - subDiscount);
  const express = method === "express" && area?.express;
  const free = subtotal >= cfg.freeDeliveryLimit && !express;
  const delivery = !lines.length ? 0 : free ? 0 : (area?.charge || 0) + (express ? area.expressCharge : 0);
  const mrpSavings = lines.reduce((s, l) => s + Math.round((l.product.mrp - l.product.price) * l.qty), 0);
  return {
    subtotal, subDiscount, couponDiscount: couponOff, delivery, free,
    savings: mrpSavings + subDiscount + couponOff + (free && area ? area.charge : 0),
    total: Math.max(0, subtotal - subDiscount - couponOff + delivery),
    toFree: Math.max(0, cfg.freeDeliveryLimit - subtotal),
  };
}
