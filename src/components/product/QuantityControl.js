"use client";
import { useCart } from "@/context/CartContext";
import { maxQty, qtyLabel, stepOf } from "@/lib/format";

// Add -> [ - qty + ]. Weight items move in 500 g steps ("500 g", "1 kg"...). "Only 3 Left" items stop at 3. Guests get the login popup on Add.
export default function QuantityControl({ product, label = "Add" }) {
  const { items, add, setQty } = useCart();
  const qty = items[product.id] || 0;
  const step = stepOf(product);
  const out = product.status === "out";
  const atMax = qty >= maxQty(product);

  if (!qty)
    return <button disabled={out} onClick={(e) => add(product, undefined, e.currentTarget)} className="btn !px-4 !py-1.5">{out ? "Unavailable" : label}</button>;
  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-primary text-sm font-semibold">
      <button aria-label="Decrease" onClick={() => setQty(product.id, qty - step)} className="h-8 w-8 bg-primary-light">−</button>
      <span className="min-w-[3.2rem] text-center">{qtyLabel(product, qty)}</span>
      <button aria-label="Increase" disabled={atMax} onClick={() => setQty(product.id, qty + step)} className="h-8 w-8 bg-primary text-white disabled:opacity-40">+</button>
    </div>
  );
}