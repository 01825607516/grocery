"use client";
import { useMemo } from "react";
import ProductCard from "./ProductCard";
import { useCatalog } from "@/context/CatalogContext";
import { useI18n } from "@/context/I18nContext";
import { substitutes } from "@/lib/substitutes";

// Product page: shown under the product (title changes when it is out of stock).
// Cart page: pass `forProducts` = the cart's out-of-stock products, we show alternatives for each.
export default function SubstitutesSection({ product, forProducts, title }) {
  const { products } = useCatalog();
  const { t } = useI18n();
  const groups = useMemo(() => {
    const src = forProducts || (product ? [product] : []);
    return src.map((p) => ({ p, list: substitutes(p, products, 5) })).filter((g) => g.list.length);
  }, [product, forProducts, products]);
  if (!groups.length) return null;
  return (
    <section className="mt-8">
      {groups.map(({ p, list }) => (
        <div key={p.id} className="mb-6">
          <h2 className="font-display text-xl font-semibold">{title || (forProducts ? `${p.name} · ${t("substitutes")}` : p.status === "out" ? t("substitutes") : t("similar"))}</h2>
          <p className="mb-2 text-sm text-ink/60">{t("sub_hint")}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{list.map((x) => <ProductCard key={x.id} product={x} compact />)}</div>
        </div>
      ))}
    </section>
  );
}
