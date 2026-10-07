"use client";
import Link from "next/link";
import { useCatalog } from "@/context/CatalogContext";
import SectionHeading from "@/components/ui/SectionHeading";
import ProductCard from "@/components/product/ProductCard";

const SHOW = 10; // 2 rows x 5 products

// Home page "Shop": only 2 rows of 5 products. "All products" (small, on the right side of the heading) opens the full /shop page.
// Clicking a product opens the same product pop-up as everywhere else.
export default function ShopSection() {
  const { products } = useCatalog();
  return (
    <section className="container-x">
      <div className="relative">
        <SectionHeading title="Shop" />
        <Link href="/shop" className="absolute right-0 top-1/2 -translate-y-1/2 bg-cream pl-2 text-xs font-semibold text-primary hover:underline sm:text-sm">All products →</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {products.slice(0, SHOW).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}