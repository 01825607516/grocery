"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { money, qtyLabel, stepOf, maxQty } from "@/lib/format";
import Art from "@/components/ui/Art";
import DeliveryPicker from "./DeliveryPicker";
import CheckoutModal from "./CheckoutModal";

const Row = ({ k, v, neg, free }) => <div className="flex justify-between text-sm"><span>{k}</span><span className={neg || free ? "text-primary" : ""}>{free ? "Free" : <>{neg ? "−" : ""}{money(v)}</>}</span></div>;

export default function CartDrawer() {
  const { user, requireLogin } = useAuth();
  const { lines, totals, method, drawerOpen, setDrawerOpen, setQty, subscribed, toggleSub, subst, setSubst, coupon, setCoupon, applyCoupon, cfg, buyNow, closeBuyNow } = useCart();
  const [code, setCode] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkout, setCheckout] = useState(false);

  const apply = async () => {
    if (!code.trim()) return;
    setChecking(true); setCouponMsg("");
    try { await applyCoupon(code); setCode(""); } catch (e) { setCouponMsg(e.message || "Could not apply this coupon."); } finally { setChecking(false); }
  };
  const goCheckout = () => (user ? setCheckout(true) : requireLogin(() => setCheckout(true), "Please log in to place your order."));

  return (
    <>
      {drawerOpen && <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setDrawerOpen(false)} />}
      <aside className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-accent/30 p-4">
          <h3 className="font-display text-xl font-semibold">Your cart</h3>
          <button onClick={() => setDrawerOpen(false)} aria-label="Close cart"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </div>
        {!lines.length ? <p className="p-10 text-center text-ink/60">Your cart is empty. Add something fresh.</p> : (
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-white"><div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (totals.subtotal / cfg.freeDeliveryLimit) * 100)}%` }} /></div>
              <p className="mt-1 text-xs">{totals.toFree > 0 ? `Add ${money(totals.toFree)} more for free delivery` : method === "express" ? "Free delivery applies to Standard delivery only. Express always has a fee." : "Free delivery unlocked"}</p>
            </div>
            {lines.map(({ product: p, qty, total: t }) => (
              <div key={p.id} className="rounded-xl bg-white p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Art src={p.image} fallback={p.fallback} kind={p.kind} color={p.color} label="" className="h-9 w-9 rounded" /><b>{p.name}</b></span><b>{money(t)}</b>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(p.id, qty - stepOf(p))} aria-label={`Decrease ${p.name}`} className="h-7 w-7 rounded bg-primary-light">−</button>
                    <span>{qtyLabel(p, qty)}</span>
                    <button onClick={() => setQty(p.id, qty + stepOf(p))} disabled={qty >= maxQty(p)} aria-label={`Increase ${p.name}`} className="h-7 w-7 rounded bg-primary text-white disabled:opacity-40">+</button>
                  </div>
                  <select value={subst[p.id] || "brand"} onChange={(e) => setSubst({ ...subst, [p.id]: e.target.value })} aria-label={`If ${p.name} is unavailable`} className="rounded border border-accent/40 px-1 py-1 text-xs">
                    <option value="brand">Replace with similar brand</option><option value="remove">Remove if unavailable</option><option value="call">Call me</option>
                  </select>
                </div>
                {p.subscribable && <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={subscribed.includes(p.id)} onChange={() => toggleSub(p.id)} /> Subscribe & save {cfg.subscribePct}%</label>}
              </div>
            ))}
            <DeliveryPicker />
            <div className="rounded-xl bg-white p-3 text-sm">
              {coupon ? (
                <div className="flex items-center justify-between"><span>Coupon <b className="text-primary">{coupon.code}</b> applied{totals.couponDiscount === 0 && <span className="block text-xs text-ink/60">Not applicable now. Minimum order {money(coupon.min || 0)}.</span>}</span><button onClick={() => setCoupon(null)} className="text-xs underline">Remove</button></div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setCouponMsg(""); }} onKeyDown={(e) => e.key === "Enter" && apply()} placeholder="Coupon code (try FRESH10)" aria-label="Coupon code" className="flex-1 rounded border border-accent/40 px-2 py-1.5" />
                    <button onClick={apply} disabled={checking || !code.trim()} className="btn !px-3 !py-1.5">{checking ? "…" : "Apply"}</button>
                  </div>
                  {couponMsg && <p role="alert" className="mt-1 text-xs text-red-600">{couponMsg}</p>}
                </>
              )}
            </div>
            <div className="space-y-1.5 rounded-xl bg-white p-3">
              <Row k="Subtotal" v={totals.subtotal} />
              <Row k="Delivery fee" v={totals.delivery} free={totals.free} />
              {totals.subDiscount > 0 && <Row k="Subscribe & save" v={totals.subDiscount} neg />}
              {totals.couponDiscount > 0 && <Row k="Coupon" v={totals.couponDiscount} neg />}
              <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{money(totals.total)}</span></div>
              {totals.savings > 0 && <p className="text-right text-xs font-medium text-primary">You save {money(totals.savings)} on this order</p>}
            </div>
          </div>
        )}
        <div className="flex gap-2 border-t border-accent/30 p-4">
          <Link href="/cart" onClick={() => setDrawerOpen(false)} className="shrink-0 rounded-lg border border-primary px-4 py-2.5 text-center text-sm font-semibold text-primary transition hover:bg-primary-light">View cart</Link>
          <button disabled={!lines.length} onClick={goCheckout} className="btn flex-1">Checkout · {money(totals.total)}</button>
        </div>
      </aside>
      <CheckoutModal open={checkout && !buyNow} onClose={() => setCheckout(false)} />
      {/* "Buy now" checkout: one product only, opened straight from a product card */}
      <CheckoutModal open={!!buyNow} onClose={closeBuyNow} />
    </>
  );
}