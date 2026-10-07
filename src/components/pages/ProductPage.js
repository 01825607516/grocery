"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import ZoomImage from "@/components/product/ZoomImage";
import QuantityControl from "@/components/product/QuantityControl";
import StatusBadge from "@/components/product/StatusBadge";
import { DetailsReviews, Stars } from "@/components/product/ProductModal";
import { useCart } from "@/context/CartContext";
import { useCatalog } from "@/context/CatalogContext";
import { useReviews } from "@/context/ReviewContext";
import { lineTotal, money, qtyLabel, unitLabel } from "@/lib/format";
import { recommend } from "@/lib/recommend";
import { productIdFromSlug } from "@/lib/routes";
import VariantChips from "@/components/product/VariantChips";
import NotifyButton from "@/components/product/NotifyButton";
import DeliveryCheck from "@/components/product/DeliveryCheck";
import SubstitutesSection from "@/components/product/SubstitutesSection";
import { useI18n } from "@/context/I18nContext";
import { Crumbs, Missing } from "./common";

// Full product page (/product/12-tomato). Same content as the quick-view popup + delivery check + alternatives.
export default function ProductPage({ slug }) {
  const { getProduct, products, categories } = useCatalog();
  const { items, orders, isWished, toggleWish, startBuyNow, markViewed } = useCart();
  const { summary, load } = useReviews();
  const [tab, setTab] = useState("details");
  const p = getProduct(productIdFromSlug(slug));

  useEffect(() => { if (p) { markViewed(p.id); load(p.id); setTab("details"); } }, [p?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const related = useMemo(() => (p ? recommend({ products, cartIds: [], viewedIds: [p.id], orders, limit: 3 }).filter((x) => x.id !== p.id).slice(0, 3) : []), [p, products, orders]);
  const { t } = useI18n();

  if (!p) return <PageShell><Missing title="Product not found" text="This product may have been removed." /></PageShell>;
  const rv = summary(p);
  const qty = items[p.id] || 0;
  const save = Math.round(p.mrp - p.price);
  const out = p.status === "out";
  const category = categories.find((c) => c.id === p.category);

  return (
    <PageShell>
      <Crumbs items={[{ href: "/", label: t("home") }, { href: "/shop", label: t("shop") }, ...(category ? [{ href: `/category/${category.id}`, label: category.name }] : []), ...(p.sub && category ? [{ href: `/category/${category.id}?sub=${encodeURIComponent(p.sub)}`, label: p.sub }] : []), { label: p.name }]} />
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,22rem)_1fr]">
        <ZoomImage product={p} className="mx-auto w-full max-w-sm md:max-w-none" />
        <div className="flex flex-col gap-2 text-sm">
          <h1 className="font-display text-2xl font-semibold md:text-3xl">{p.name}</h1>
          <p className="text-ink/60">{p.brand} · {p.sub}</p>
          <button type="button" onClick={() => setTab("reviews")} className="flex w-fit items-center gap-1.5 text-xs text-ink/60 hover:text-ink">{rv.count > 0 ? <><Stars value={rv.rating} /> <b className="text-ink">{rv.rating.toFixed(1)}</b> ({rv.count} {rv.count > 1 ? "reviews" : "review"})</> : <span className="underline">No reviews yet · Write the first</span>}</button>
          <StatusBadge status={p.status} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {save > 0 && <s className="text-base text-ink/45">{money(p.mrp)}</s>}
            <span className="text-3xl font-extrabold leading-tight text-[#e11d2e]">{money(p.price)}<span className="text-sm font-semibold text-ink/60">{unitLabel(p)}</span></span>
          </div>
          {save > 0 && <p className="w-fit rounded-md bg-primary-light px-2.5 py-1 text-xs font-bold text-primary">You save {money(save)} <span className="font-semibold text-primary/70">({p.discount}% off)</span></p>}
          {p.unit === "kg" && <p className="rounded-lg bg-white p-2 text-xs text-ink/70">Sold by weight. Price updates with the weight you pick (500 g steps){qty ? <>: <b>{qtyLabel(p, qty)} = {money(lineTotal(p, qty))}</b></> : "."}</p>}
          <VariantChips p={p} />
          <div className="mt-2 grid max-w-sm grid-cols-2 gap-2 [&>div>button]:w-full [&>div>button]:!py-2.5 [&>div>div]:w-full [&>div>div]:justify-between">
            <div><QuantityControl product={p} label="Add to cart" /></div>
            {!out ? <button onClick={() => startBuyNow(p)} className="rounded-lg bg-[#e11d2e] py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#c4121e]">Buy now</button> : <NotifyButton p={p} />}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => toggleWish(p.id)} className="w-fit rounded-lg border border-accent/50 bg-white px-3 py-1.5 text-sm">{isWished(p.id) ? "♥ Saved" : "♡ Wishlist"}</button>
            {qty > 0 && <Link href="/cart" className="text-xs font-semibold text-primary underline">Go to cart →</Link>}
          </div>

          {/* will it reach me? */}
          <DeliveryCheck />
        </div>
      </div>

      <DetailsReviews p={p} tab={tab} setTab={setTab} rv={rv} related={related} />

      <SubstitutesSection product={p} />
    </PageShell>
  );
}
