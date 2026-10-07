"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useCatalog } from "@/context/CatalogContext";
import SectionHeading from "@/components/ui/SectionHeading";
import Pagination from "@/components/ui/Pagination";
import Art from "@/components/ui/Art";

const PER_PAGE = 8; // 8 categories visible at a time

// Round photo tiles, tight spacing: 4 x 2 on phones/tablets, one row of 8 on desktop.
export default function ShopByCategory() {
  const { categories: CATEGORIES, products: PRODUCTS } = useCatalog();
  const COUNTS = useMemo(() => Object.fromEntries(CATEGORIES.map((c) => [c.id, PRODUCTS.filter((p) => p.category === c.id).length])), [CATEGORIES, PRODUCTS]);
  const [page, setPage] = useState(1);
  const pages = Math.ceil(CATEGORIES.length / PER_PAGE);
  const list = CATEGORIES.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <section className="container-x">
      <SectionHeading title="Shop by category" />
      <div className="grid grid-cols-4 gap-x-2 gap-y-5 md:gap-x-3 lg:grid-cols-8">
        {list.map((c) => (
          <Link key={c.id} href={`/category/${c.id}`} aria-label={`Shop ${c.name}`} className="group flex flex-col items-center text-center">
            <Art src={c.image} fallback={c.fallback} kind={c.kind} color={c.color} label={c.name} round className="aspect-square w-full max-w-[150px] shadow-md ring-1 ring-black/10 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:ring-2 group-hover:ring-coffee" />
            <span className="mt-2.5 text-xs font-semibold leading-tight sm:text-sm">{c.name}</span>
            <span className="hidden text-[11px] text-ink/50 md:block">{COUNTS[c.id]} items</span>
          </Link>
        ))}
      </div>
      <Pagination page={page} pages={pages} onChange={setPage} />
    </section>
  );
}