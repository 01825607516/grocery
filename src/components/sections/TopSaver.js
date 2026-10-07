"use client";
import { useMemo, useState } from "react";
import { useCatalog } from "@/context/CatalogContext";
import useCountdown from "@/hooks/useCountdown";
import SectionHeading from "@/components/ui/SectionHeading";
import Pagination from "@/components/ui/Pagination";
import ProductCard from "@/components/product/ProductCard";

const PER_PAGE = 5;

export default function TopSaver() {
  const { products } = useCatalog();
  const DEALS = useMemo(() => [...products].filter((p) => p.status !== "out").sort((a, b) => b.discount - a.discount).slice(0, 15), [products]);
  const [page, setPage] = useState(1);
  const [h, m, s] = useCountdown();
  return (
    <section className="container-x">
      <SectionHeading title="Top saver today" right={
        <div className="flex items-center gap-1 text-sm font-semibold"><span className="mr-1 font-normal text-ink/60">Deals end in</span>{[h, m, s].map((v, i) => <span key={i} className="rounded bg-primary-light px-2 py-1 text-coffee">{v}</span>)}</div>
      } />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {DEALS.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      <Pagination page={page} pages={Math.ceil(DEALS.length / PER_PAGE)} onChange={setPage} />
    </section>
  );
}
