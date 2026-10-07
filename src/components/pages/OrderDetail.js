"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import OrderTracker from "@/components/ui/OrderTracker";
import { useCart } from "@/context/CartContext";
import { api } from "@/services";
import OrderActionModal from "./OrderActionModal";
import InvoiceButton from "./InvoiceButton";
import { useI18n } from "@/context/I18nContext";
import { money, qtyLabel } from "@/lib/format";
import { etaText, isActive } from "@/lib/orders";
import { Crumbs, Missing, Row, fmtDate, payStatus } from "./common";

export const itemQty = (i) => qtyLabel({ unit: i.unit }, i.qty);
export const itemPrice = (i) => `${money(i.price)}${i.unit === "kg" ? "/kg" : ""}`;
const CANCELLABLE = ["confirmed", "preparing"];
const RETURN_DAYS = 3; // return window after delivery (shown in Return policy page)

export default function OrderDetail({ id }) {
  const { reorder } = useCart();
  const { t } = useI18n();
  const [order, setOrder] = useState(null);
  const [missing, setMissing] = useState(false);
  const [action, setAction] = useState(null); // null | "cancel" | "return"

  const load = useCallback(() => api.getOrder(id).then((o) => { setOrder(o); setMissing(false); }).catch(() => setMissing(true)), [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!order || !isActive(order)) return;
    const t = setInterval(load, 5000); // live tracking
    return () => clearInterval(t);
  }, [order, load]);

  if (missing) return <Missing title="Order not found" text="Check the order ID or open it from My orders." />;
  if (!order) return <p className="py-16 text-center text-ink/60">Loading order…</p>;
  const tot = order.totals;
  const cancelled = order.status === "cancelled";
  const d = order.delivery;
  const delivered = order.status === "delivered";
  const canReturn = delivered && !order.returnRequest && Date.now() - (order.deliveredAt || order.createdAt) < RETURN_DAYS * 864e5;
  return (
    <>
      <Crumbs items={[{ href: "/", label: "Home" }, { href: "/account", label: "Account" }, { href: "/account/orders", label: "Orders" }, { label: order.id }]} />
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div><p className="font-display text-lg font-semibold">{order.id}</p><p className="text-xs text-ink/60">Placed {fmtDate(order.createdAt)}</p></div>
              {!cancelled && isActive(order) && <p className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">Arriving {etaText(order)}</p>}
            </div>
            {cancelled ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">This order was cancelled.</p> : <OrderTracker status={order.status} />}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h3 className="mb-3 font-display text-lg font-semibold">Items</h3>
            <ul className="divide-y divide-accent/20 text-sm">
              {order.items.map((i) => (
                <li key={`${i.productId}`} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0"><Link href={`/product/${i.productId}`} className="font-medium hover:underline">{i.name}</Link><span className="block text-xs text-ink/60">{itemQty(i)} × {itemPrice(i)}</span></span>
                  <b className="shrink-0">{money(i.total)}</b>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="space-y-1.5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <Row k="Subtotal" v={tot.subtotal} />
            <Row k="Delivery fee" v={tot.delivery} free={tot.free} />
            {tot.subDiscount > 0 && <Row k="Subscribe & save" v={tot.subDiscount} neg />}
            {tot.couponDiscount > 0 && <Row k={`Coupon${order.coupon ? ` (${order.coupon})` : ""}`} v={tot.couponDiscount} neg />}
            <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{money(tot.total)}</span></div>
          </section>
          <section className="rounded-2xl bg-white p-5 text-sm shadow-sm ring-1 ring-black/5">
            <p className="font-semibold">Deliver to</p>
            <p className="text-ink/70">{order.address.type}, {order.address.line}</p>
            <p className="mt-3 font-semibold">Delivery</p>
            <p className="text-ink/70">{d.method === "express" ? "Express · within ~90 minutes" : d.slot ? `Standard · ${d.slot.day === "tomorrow" ? "tomorrow" : "today"}, ${d.slot.label}` : `Courier · ${d.eta || "2–4 days"}`}{d.areaName ? ` · ${d.areaName}` : ""}</p>
            <p className="mt-3 font-semibold">Payment</p>
            <p className="text-ink/70">{order.payment.method} · {payStatus(order.payment.status)}</p>
          </section>
          <div className="flex flex-col gap-2">
            <InvoiceButton id={order.id} />
            <button onClick={(e) => reorder(order, e.currentTarget)} className="rounded-lg border border-primary py-2.5 text-sm font-semibold text-primary hover:bg-primary-light">{t("buy_again")}</button>
            {order.returnRequest && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Return requested · {order.returnRequest.reason}</p>}
            {canReturn && <button onClick={() => setAction("return")} className="rounded-lg border border-accent/60 bg-white py-2.5 text-sm font-semibold hover:bg-primary-light">{t("return_order")}</button>}
            {CANCELLABLE.includes(order.status) && <button onClick={() => setAction("cancel")} className="text-sm text-red-600 underline">{t("cancel_order")}</button>}
          </div>
        </aside>
      </div>
      {action && <OrderActionModal mode={action} order={order} onClose={() => setAction(null)} onDone={(o) => o && setOrder(o)} />}
    </>
  );
}
