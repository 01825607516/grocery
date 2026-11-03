"use client";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminSession";
import { Badge, Btn, Card, Empty, Loading, takaFmt } from "../ui";
import { ORDER_TONE, PAY_TONE, orderStatus, payStatus } from "./Orders";

const nice = (s) => String(s || "").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export default function Overview({ go }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { adminApi("/orders", { query: { per_page: 5 } }).then(setD).catch((e) => { setErr(e.message); setD({}); }); }, []);
  const by = d?.summary?.by_status || {};
  const recent = d?.orders?.data || [];
  const tiles = [["All orders", d?.summary?.total, ""], ["Waiting to start", by.pending, "pending"], ["In progress", (by.confirmed || 0) + (by.processing || 0) + (by.packed || 0) + (by.shipped || 0), ""], ["Delivered", by.delivered, "delivered"]];
  return (
    <div className="grid gap-5">
      {err && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(([label, n]) => (
          <div key={label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</p>
            <p className="mt-1 font-display text-3xl font-semibold text-primary">{!d ? "…" : n ?? 0}</p>
          </div>
        ))}
      </div>
      {d?.summary?.awaiting_payment_check > 0 && <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">{d.summary.awaiting_payment_check} payment(s) are waiting to be checked. <button type="button" onClick={() => go("orders")} className="font-semibold underline">Open orders</button></p>}
      <Card title="Latest orders" actions={<Btn variant="secondary" onClick={() => go("orders")}>All orders</Btn>}>
        {!d ? <Loading /> : !recent.length ? <Empty>No orders yet.</Empty> : (
          <ul className="divide-y divide-accent/25">
            {recent.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span><b>{o.order_no || `#${o.id}`}</b> <span className="text-ink/60">· {o.customer?.name || "Customer"}</span></span>
                <span className="flex flex-wrap items-center gap-2"><Badge tone={ORDER_TONE[orderStatus(o)]}>{nice(orderStatus(o))}</Badge><Badge tone={PAY_TONE[payStatus(o)]}>{nice(payStatus(o))}</Badge><b>{takaFmt(o.final_amount)}</b></span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="What would you like to change?">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[["campaigns", "Offers & campaigns", "Banners, sale dates, product discounts"], ["coupons", "Coupons", "Discount codes for customers"], ["delivery", "Delivery areas & slots", "Charges and time slots"], ["homepage", "Homepage & menu", "Headline, hero picture, menu links"], ["brand", "Brand, language & SEO", "Store name, logo, Google preview"], ["appearance", "Look & feel", "Colours, fonts, corners"], ["layout", "Home layout & pictures", "Show/hide/reorder sections, category pictures"], ["content", "Contact, pages & footer", "Phone, social links, policy pages"]].map(([id, title, text]) => (
            <button key={id} type="button" onClick={() => go(id)} className="rounded-xl border border-accent/40 p-4 text-left transition hover:bg-primary-light"><span className="font-display font-semibold text-primary-dark">{title}</span><span className="mt-1 block text-xs text-ink/60">{text}</span></button>
          ))}
        </div>
      </Card>
    </div>
  );
}
