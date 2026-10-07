"use client";
import { useEffect } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import OrderTracker from "@/components/ui/OrderTracker";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/format";
import { etaText, isActive } from "@/lib/orders";

// "My account": profile, logout, and every order with live tracking (Confirmed -> ... -> Delivered).
export default function AccountModal() {
  const { user, accountOpen, setAccountOpen, logout } = useAuth();
  const { orders, refreshOrders, reorder } = useCart();
  const active = orders.some(isActive);

  useEffect(() => {
    if (!accountOpen) return;
    refreshOrders();
    if (!active) return;
    const t = setInterval(refreshOrders, 5000);
    return () => clearInterval(t);
  }, [accountOpen, active]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;
  return (
    <Modal open={accountOpen} onClose={() => setAccountOpen(false)} title="My account" z="z-[70]">
      <div className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-white p-4">
        <div><p className="font-semibold">{user.name}</p><p className="text-sm text-ink/60">{user.email}</p></div>
        <button onClick={logout} className="rounded-lg border border-primary px-4 py-1.5 text-sm font-semibold text-primary hover:bg-primary-light">Log out</button>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-2">
        <Link href="/account" onClick={() => setAccountOpen(false)} className="rounded-lg border border-primary px-4 py-2 text-center text-sm font-semibold text-primary hover:bg-primary-light">My account</Link>
        <Link href="/account/orders" onClick={() => setAccountOpen(false)} className="rounded-lg border border-primary px-4 py-2 text-center text-sm font-semibold text-primary hover:bg-primary-light">All orders</Link>
      </div>
      <h4 className="mb-3 font-display text-lg font-semibold">Your orders</h4>
      {!orders.length ? <p className="py-8 text-center text-sm text-ink/60">No orders yet. Your orders and their tracking will show here.</p> : (
        <div className="space-y-4">
          {orders.map((o) => (
            <article key={o.id} className="rounded-xl bg-white p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{o.id}{o.sample && <span className="ml-2 rounded bg-primary-light px-1.5 py-0.5 text-[10px] font-medium text-primary">sample</span>}</p>
                <p className="text-ink/60">{new Date(o.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <p className="mt-1 text-ink/70">{o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}</p>
              <div className="my-3"><OrderTracker status={o.status} compact /></div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>{isActive(o) ? <>Arriving {etaText(o)} · </> : null}<b>{money(o.totals.total)}</b></span>
                <button onClick={(e) => { reorder(o, e.currentTarget); setAccountOpen(false); }} className="btn !px-4 !py-1.5">Reorder</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Modal>
  );
}