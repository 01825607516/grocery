"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/format";
import { getWishPrice, isPriceWatching, setPriceWatching } from "@/lib/notify";
import NotifyButton from "./NotifyButton";

// Under each wishlist card: "cheaper than when you saved it", a price-drop alert and (for out-of-stock items) a back-in-stock alert.
// Saved price + alerts are kept per browser for now; with a real backend: POST /products/:id/price-alert.
export default function WishExtras({ p }) {
  const { notify } = useCart();
  const [saved, setSaved] = useState(null);
  const [watch, setWatch] = useState(false);
  useEffect(() => { setSaved(getWishPrice(p.id)); setWatch(isPriceWatching(p.id)); }, [p.id]);
  const diff = saved == null ? 0 : Math.round(p.price - saved);
  const toggle = () => { const next = !watch; setPriceWatching(p.id, next); setWatch(next); notify?.(next ? `We will tell you if ${p.name} gets cheaper` : "Price alert off"); };
  return (
    <div className="mt-2 flex flex-col items-center gap-1.5 text-center text-xs">
      {saved != null && (diff === 0
        ? <p className="text-ink/55">Saved at {money(saved)}</p>
        : <p className={`font-semibold ${diff < 0 ? "text-primary" : "text-[#e11d2e]"}`}>{diff < 0 ? "↓" : "↑"} {money(Math.abs(diff))} {diff < 0 ? "cheaper" : "higher"} than when you saved it ({money(saved)})</p>)}
      {p.status !== "out" && (
        <button type="button" onClick={toggle} aria-pressed={watch} className={`rounded-lg border px-2.5 py-1.5 font-semibold transition ${watch ? "border-primary bg-primary-light text-primary" : "border-accent/60 text-ink/70 hover:bg-white"}`}>🔔 {watch ? "We will tell you if the price drops" : "Alert me if price drops"}</button>
      )}
      <NotifyButton p={p} />
    </div>
  );
}
