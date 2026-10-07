"use client";
import { useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useCatalog } from "@/context/CatalogContext";
import { recommend } from "@/lib/recommend";
import SectionHeading from "@/components/ui/SectionHeading";
import Pagination from "@/components/ui/Pagination";
import ProductCard from "@/components/product/ProductCard";

const PER_PAGE = 5;

function Row({ title, list, classic = false }) {
  const [page, setPage] = useState(1);
  const pages = Math.ceil(list.length / PER_PAGE);
  const cur = Math.min(page, pages);
  return (
    <div className="mb-4 last:mb-0">
      <SectionHeading title={title} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{list.slice((cur - 1) * PER_PAGE, cur * PER_PAGE).map((p, i) => <ProductCard key={p.id} product={p} classic={classic} rank={classic ? (cur - 1) * PER_PAGE + i + 1 : undefined} />)}</div>
      <Pagination page={cur} pages={pages} onChange={setPage} />
    </div>
  );
}

// Popular picks first; once the shopper views / adds / has bought things it becomes "Recommended for you"
// (same sub-category, bought together with what is in the cart or was viewed, and usual repurchases - see lib/recommend.js)
const FEATURED = ["Carrot", "Orange", "Beef Mince", "Brown Eggs (6)", "Vanilla Cupcakes (4)"]; // shown first (page 1)

export default function Recommendations() {
  const { lines, viewed, orders } = useCart();
  const { products, byName } = useCatalog();
  const popular = useMemo(() => {
    const featured = byName(FEATURED);
    return [...featured, ...[...products].filter((p) => p.status !== "out" && !FEATURED.includes(p.name)).sort((a, b) => ((b.id * 7) % 11) - ((a.id * 7) % 11))].slice(0, 15);
  }, [products, byName]);
  const rec = useMemo(() => recommend({ products, cartIds: lines.map((l) => l.product.id), viewedIds: viewed, orders }), [products, lines, viewed, orders]);
  return (
    <section className="container-x">
      <Row title={rec.length ? "Recommended for you" : "Popular picks"} list={rec.length ? rec : popular} classic={!rec.length} />
    </section>
  );
}
