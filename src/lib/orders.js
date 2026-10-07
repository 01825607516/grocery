export const ORDER_STEPS = [
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "packed", label: "Packed" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];
export const stepIndex = (status) => Math.max(0, ORDER_STEPS.findIndex((s) => s.key === status));
export const isActive = (o) => o.status !== "delivered" && o.status !== "cancelled";
export const etaText = (o) => (o.delivery.method === "express" ? "within ~90 minutes" : o.delivery.slot ? `${o.delivery.slot.day === "tomorrow" ? "tomorrow" : "today"}, ${o.delivery.slot.label}` : `in ${o.delivery.eta || "2–4 days"}`);
