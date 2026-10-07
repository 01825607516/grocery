"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import OrderTracker from "@/components/ui/OrderTracker";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/format";
import { etaText, isActive } from "@/lib/orders";
import { EmptyState, fmtDate } from "./common";
import InvoiceButton from "./InvoiceButton";
import { useI18n } from "@/context/I18nContext";

const TABS = [["all", "All"], ["active", "On the way"], ["delivered", "Delivered"], ["cancelled", "Cancelled"]];
const match = (tab, o) => tab === "all" || (tab === "active" ? isActive(o) : o.status === tab);

export default function OrdersView() {
  const { orders, refreshOrders, reorder } = useCart();
  const { t } = useI18n();
  const [tab, setTab] = useState("all");
  const active = orders.some(isActive);

  useEffect(() => {
    refreshOrders();
    if (!active) return;
    const t = setInterval(refreshOrders, 5000); // live tracking
    return () => clearInterval(t);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!orders.length) return <EmptyState title="No orders yet" text="Your orders and their live tracking will show here." />;
  const list = orders.filter((o) => match(tab, o));
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-full px-4 py-1.5 text-sm ${tab === id ? "bg-primary text-white" : "bg-white"}`}>{label} <span className="opacity-60">({orders.filter((o) => match(id, o)).length})</span></button>)}
      </div>
      {!list.length ? <p className="rounded-xl bg-white p-8 text-center text-sm text-ink/60">No orders in this list.</p> : (
        <div className="space-y-4">
          {list.map((o) => (
            <article key={o.id} className="rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/account/orders/${o.id}`} className="font-semibold text-primary underline">{o.id}</Link>
                <p className="text-ink/60">{fmtDate(o.createdAt)}</p>
              </div>
              <p className="mt-1 text-ink/70">{o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}</p>
              <div className="my-3">{o.status === "cancelled" ? <p className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">Cancelled</p> : <OrderTracker status={o.status} compact />}</div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>{isActive(o) ? <>Arriving {etaText(o)} · </> : null}<b>{money(o.totals.total)}</b></span>
                <span className="flex gap-2">
                  <Link href={`/account/orders/${o.id}`} className="rounded-lg border border-primary px-4 py-1.5 text-sm font-semibold text-primary hover:bg-primary-light">Details</Link>
                  <button onClick={(e) => reorder(o, e.currentTarget)} className="btn !px-4 !py-1.5">⚡ {t("reorder")}</button>
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
