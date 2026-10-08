"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Art from "@/components/ui/Art";
import ProductCard from "@/components/product/ProductCard";
import DeliveryPicker from "@/components/cart/DeliveryPicker";
import CompleteBasket from "@/components/cart/CompleteBasket";
import CouponBox from "@/components/cart/CouponBox";
import SubstitutesSection from "@/components/product/SubstitutesSection";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useCatalog } from "@/context/CatalogContext";
import { maxQty, money, qtyLabel, stepOf } from "@/lib/format";
import { productHref } from "@/lib/routes";
import { EmptyState, Row } from "./common";

// Full cart page. Same data and rules as the cart drawer (it reads the same cart), plus "Save for later".
export default function CartView() {
  const router = useRouter();
  const { user, requireLogin } = useAuth();
  const { products } = useCatalog();
  const { lines, totals, method, setQty, subscribed, toggleSub, subst, setSubst, cfg, wishlist, isWished, toggleWish, addMany } = useCart();
  const { t } = useI18n();
  const goCheckout = () => (user ? router.push("/checkout") : requireLogin(() => router.push("/checkout"), "Please log in to place your order."));
  const saveForLater = (p) => { if (!isWished(p.id)) toggleWish(p.id); setQty(p.id, 0); };
  const inCart = new Set(lines.map((l) => String(l.product.id)));
  const saved = products.filter((p) => wishlist.some((w) => String(w) === String(p.id)) && !inCart.has(String(p.id)));

  return (
    <>
      {!lines.length ? (
        <EmptyState title={t("empty_cart")} text="Add something fresh and it will show up here." />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-3">
            <div className="rounded-xl bg-white p-3">
              <div className="h-2 overflow-hidden rounded-full bg-cream"><div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (totals.subtotal / cfg.freeDeliveryLimit) * 100)}%` }} /></div>
              <p className="mt-1 text-xs">{totals.toFree > 0 ? `Add ${money(totals.toFree)} more for free delivery` : method === "express" ? "Free delivery applies to Standard delivery only. Express always has a fee." : "Free delivery unlocked"}</p>
            </div>
            {lines.map(({ product: p, qty, total: lt }) => (
              <div key={p.id} className="rounded-xl bg-white p-3 text-sm shadow-sm ring-1 ring-black/5">
                <div className="flex items-center justify-between gap-3">
                  <Link href={productHref(p)} className="flex min-w-0 items-center gap-3"><Art src={p.image} fallback={p.fallback} kind={p.kind} color={p.color} label="" className="h-14 w-14 shrink-0 rounded-lg" /><span className="min-w-0"><b className="block truncate">{p.name}</b><span className="text-xs text-ink/60">{p.brand} · {money(p.price)}{p.unit === "kg" ? "/kg" : ""}</span></span></Link>
                  <b className="shrink-0">{money(lt)}</b>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(p.id, qty - stepOf(p))} aria-label={`Decrease ${p.name}`} className="h-8 w-8 rounded bg-primary-light">−</button>
                    <span className="min-w-[3.2rem] text-center">{qtyLabel(p, qty)}</span>
                    <button onClick={() => setQty(p.id, qty + stepOf(p))} disabled={qty >= maxQty(p)} aria-label={`Increase ${p.name}`} className="h-8 w-8 rounded bg-primary text-white disabled:opacity-40">+</button>
                  </div>
                  <select value={subst[p.id] || "brand"} onChange={(e) => setSubst({ ...subst, [p.id]: e.target.value })} aria-label={`If ${p.name} is unavailable`} className="rounded border border-accent/40 px-1 py-1 text-xs">
                    <option value="brand">Replace with similar brand</option><option value="remove">Remove if unavailable</option><option value="call">Call me</option>
                  </select>
                </div>
                {p.subscribable && <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={subscribed.includes(p.id)} onChange={() => toggleSub(p.id)} /> Subscribe & save {cfg.subscribePct}%</label>}
                <div className="mt-2 flex gap-4 text-xs">
                  <button onClick={() => saveForLater(p)} className="font-semibold text-primary underline">{t("save_later")}</button>
                  <button onClick={() => setQty(p.id, 0)} className="text-ink/60 underline">{t("remove")}</button>
                </div>
              </div>
            ))}
            <CompleteBasket />
          </div>

          <aside className="space-y-3 lg:sticky lg:top-[calc(var(--header-h,9rem)+0.75rem)]">
            <DeliveryPicker />
            <CouponBox />
            <div className="space-y-1.5 rounded-xl bg-white p-3">
              <Row k={t("subtotal")} v={totals.subtotal} />
              <Row k={t("delivery_fee")} v={totals.delivery} free={totals.free} />
              {totals.subDiscount > 0 && <Row k="Subscribe & save" v={totals.subDiscount} neg />}
              {totals.couponDiscount > 0 && <Row k="Coupon" v={totals.couponDiscount} neg />}
              <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{money(totals.total)}</span></div>
              {totals.savings > 0 && <p className="text-right text-xs font-medium text-primary">You save {money(totals.savings)} on this order</p>}
            </div>
            <button onClick={goCheckout} className="btn w-full">{t("checkout")} · {money(totals.total)}</button>
            <Link href="/shop" className="block text-center text-sm font-semibold text-primary underline">{t("continue_shopping")}</Link>
          </aside>
        </div>
      )}

      {saved.length > 0 && (
        <section className="mt-10">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-semibold">{t("saved_later")}</h2>
            <button onClick={(e) => addMany(saved, "saved items", e.currentTarget)} className="rounded-lg border border-primary px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary-light">{t("add_all")}</button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{saved.map((p) => <ProductCard key={p.id} product={p} compact />)}</div>
        </section>
      )}
      <SubstitutesSection forProducts={lines.map((l) => l.product).filter((p) => p.status === "out")} />
    </>
  );
}
