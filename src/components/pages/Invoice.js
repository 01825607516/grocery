"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services";
import { money } from "@/lib/format";
import { Missing, fmtDate, payStatus } from "./common";
import { itemPrice, itemQty } from "./OrderDetail";

// Printable invoice. "Print / Save as PDF" opens the browser print dialog (choose "Save as PDF"), which works in Bangla too.
// With a real backend, swap the button for a link to its PDF endpoint (see the API list).
export default function Invoice({ id }) {
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => { api.getOrder(id).then(setOrder).catch(() => setMissing(true)); }, [id]);
  // ?print=1 (from the "Download invoice" buttons): open the print dialog once, so one click gives a PDF
  useEffect(() => {
    if (!order || typeof window === "undefined" || new URLSearchParams(window.location.search).get("print") !== "1") return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [order]);

  if (missing) return <Missing title="Invoice not found" />;
  if (!order) return <p className="py-16 text-center text-ink/60">Loading invoice…</p>;
  const t = order.totals;
  const Line = ({ k, v, neg }) => <div className="flex justify-between py-0.5"><span>{k}</span><span>{neg ? "−" : ""}{typeof v === "string" ? v : money(v)}</span></div>;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href={`/account/orders/${order.id}`} className="text-sm font-semibold text-primary underline">← Back to order</Link>
        <button onClick={() => window.print()} className="btn">Print / Save as PDF</button>
      </div>
      <article className="rounded-2xl bg-white p-6 text-sm shadow-md ring-1 ring-black/5 md:p-10 print:rounded-none print:p-0 print:shadow-none print:ring-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-accent pb-5">
          <div><p className="font-display text-3xl font-bold text-primary">Freshly<span className="text-accent">.</span></p><p className="mt-1 text-xs text-ink/60">Fresh groceries delivered to your door<br />09 4932 4782 · support@freshly.example</p></div>
          <div className="text-right"><p className="font-display text-2xl font-semibold uppercase tracking-widest">Invoice</p><p className="mt-1">No. <b>{order.id}</b></p><p className="text-ink/60">{fmtDate(order.createdAt)}</p></div>
        </header>
        <section className="grid gap-4 py-5 sm:grid-cols-2">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Billed to</p><p className="font-semibold">{user?.name}</p><p className="text-ink/70">{user?.email}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-widest text-accent-dark">Deliver to</p><p className="text-ink/80">{order.address.type}, {order.address.line}</p>{order.delivery.areaName && <p className="text-ink/60">{order.delivery.areaName}</p>}</div>
        </section>
        <table className="w-full text-left">
          <thead><tr className="border-y border-accent/40 text-xs uppercase tracking-wide text-ink/60"><th className="py-2 pr-2 font-semibold">Item</th><th className="py-2 pr-2 text-right font-semibold">Price</th><th className="py-2 pr-2 text-right font-semibold">Qty</th><th className="py-2 text-right font-semibold">Total</th></tr></thead>
          <tbody>{order.items.map((i) => <tr key={i.productId} className="border-b border-accent/20"><td className="py-2 pr-2">{i.name}</td><td className="py-2 pr-2 text-right">{itemPrice(i)}</td><td className="py-2 pr-2 text-right">{itemQty(i)}</td><td className="py-2 text-right font-medium">{money(i.total)}</td></tr>)}</tbody>
        </table>
        <section className="ml-auto mt-4 w-full max-w-xs">
          <Line k="Subtotal" v={t.subtotal} />
          <Line k="Delivery fee" v={t.free ? "Free" : t.delivery} />
          {t.subDiscount > 0 && <Line k="Subscribe & save" v={t.subDiscount} neg />}
          {t.couponDiscount > 0 && <Line k={`Coupon${order.coupon ? ` (${order.coupon})` : ""}`} v={t.couponDiscount} neg />}
          <div className="mt-1 flex justify-between border-t-2 border-accent pt-2 text-base font-bold"><span>Total</span><span>{money(t.total)}</span></div>
        </section>
        <footer className="mt-8 border-t border-accent/30 pt-4 text-xs text-ink/60">
          <p>Payment: <b className="text-ink">{order.payment.method}</b> · {payStatus(order.payment.status)}</p>
          <p className="mt-1">Thank you for shopping with Freshly. This is a computer-generated invoice.</p>
        </footer>
      </article>
    </div>
  );
}
