"use client";
import { useMemo, useState } from "react";
import { useCatalog } from "@/context/CatalogContext";
import BrandLogo, { PHOTO_LOGOS } from "@/components/ui/BrandLogo";
import CollectionModal from "@/components/product/CollectionModal";

const PER_PAGE = 8; // 8 logos in one line, the rest on the next pages (dots below)

// Brand strip just above the footer: only logos (brands with a real logo photo come first), page dots underneath.
// Click a logo to see that brand's products.
export default function ShopByBrand() {
  const { brands, products: PRODUCTS } = useCatalog();
  const BRANDS = useMemo(() => [...brands.filter((b) => PHOTO_LOGOS.includes(b)), ...brands.filter((b) => !PHOTO_LOGOS.includes(b))], [brands]);
  const [brand, setBrand] = useState(null);
  const [page, setPage] = useState(1);
  const pages = Math.ceil(BRANDS.length / PER_PAGE);
  const shown = BRANDS.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const list = brand ? PRODUCTS.filter((p) => p.brand === brand) : [];
  return (
    <div id="brands" className="border-t border-accent/40 bg-sand py-4">
      <div className="container-x">
        <div className="grid grid-cols-4 gap-x-3 gap-y-4 lg:grid-cols-8">
          {shown.map((b) => (
            <button key={b} onClick={() => setBrand(b)} aria-label={`Shop ${b}`} title={b} className="group mx-auto w-full max-w-[64px] sm:max-w-[72px]">
              <span className="grid aspect-square w-full place-items-center overflow-hidden rounded-full bg-white shadow ring-1 ring-black/10 transition duration-300 group-hover:-translate-y-0.5 group-hover:ring-2 group-hover:ring-primary">
                <BrandLogo brand={b} badge className="h-full w-full" />
              </span>
            </button>
          ))}
        </div>
        {pages > 1 && (
          <div className="mt-5 flex items-center justify-center gap-2" role="tablist" aria-label="Brand pages">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)} role="tab" aria-selected={n === page} aria-label={`Brands page ${n}`} className={`h-2.5 rounded-full transition-all ${n === page ? "w-6 bg-primary" : "w-2.5 bg-primary/30 hover:bg-primary/50"}`} />
            ))}
          </div>
        )}
      </div>
      {brand && <CollectionModal key={brand} open onClose={() => setBrand(null)} title={brand} subs={[...new Set(list.map((p) => p.sub))]} products={list} />}
    </div>
  );
}