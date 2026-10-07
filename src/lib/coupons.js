// Coupons incl. free delivery. `type: "freedelivery"` waives the delivery fee (Standard + Express).
// Shape matches what /coupons/validate returns: { code, type: "percent"|"flat"|"freedelivery", value, max?, min?, label? }
export function couponDiscount(c, subtotal, delivery = 0) {
  if (!c || (c.min && subtotal < c.min)) return 0;
  if (c.type === "freedelivery") return delivery;
  if (c.type === "flat") return Math.min(c.value, subtotal);
  return Math.min(Math.round((subtotal * c.value) / 100), c.max || Infinity);
}
export const isFreeDelivery = (c) => c?.type === "freedelivery";
