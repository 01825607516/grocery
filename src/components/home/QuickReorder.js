"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useCatalog } from "@/context/CatalogContext";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

// Home section: your last order, one tap to put everything back in the cart.
export default function QuickReorder() {
  const { user } = useAuth();
  const { orders, reorder } = useCart();
  const { t } = useI18n();
  const last = useMemo(() => [...orders].filter((o) => o.status !== "cancelled").sort((a, b) => b.createdAt - a.createdAt)[0], [orders]);
  if (!user || !last) return null;
  return (
    <section id="quick-reorder" className="container-x my-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold">{t("reorder")}</h2>
          <p className="truncate text-sm text-ink/60">{last.items.slice(0, 4).map((i) => i.name).join(", ")}{last.items.length > 4 ? ` +${last.items.length - 4}` : ""}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/account/orders/${last.id}`} className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-light">{last.id}</Link>
          <button onClick={(e) => reorder(last, e.currentTarget)} className="btn">{t("buy_again")}</button>
        </div>
      </div>
    </section>
  );
}
