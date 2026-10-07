 
 "use client";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/format";

export default function MiniCart() {
  const { count, totals, method, setDrawerOpen, drawerOpen } = useCart();
  // The shopper can close the bar with the ✕. It stays closed while they keep shopping and only comes back
  // when a NEW item is added to the cart (so it never nags). When the cart is emptied it resets.
  const [closedAt, setClosedAt] = useState(null); // number of cart lines when the shopper closed it
  useEffect(() => { if (count === 0) setClosedAt(null); }, [count]);

  if (!count || drawerOpen) return null;
  if (closedAt !== null && count <= closedAt) return null;
  const left = totals.toFree;
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl animate-up items-center rounded-2xl bg-primary text-white shadow-2xl">
      <button onClick={() => setDrawerOpen(true)} className="flex min-w-0 flex-1 items-center justify-between gap-3 py-3 pl-5 pr-2 text-left">
        <span><b>{count} item{count > 1 && "s"}</b> · {money(totals.subtotal)}<br /><small className="text-white/80">{left > 0 ? `Add ${money(left)} more for free delivery` : method === "express" ? "Free delivery is for Standard delivery" : "You get free delivery"}</small></span>
        <span className="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold">View cart</span>
      </button>
      <button onClick={() => setClosedAt(count)} aria-label="Close cart bar" title="Close" className="mr-2 grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/70 transition hover:bg-white/15 hover:text-white">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
  );
}
