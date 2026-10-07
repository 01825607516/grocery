"use client";
import { useCart } from "@/context/CartContext";
import { useCatalog } from "@/context/CatalogContext";
import SectionHeading from "@/components/ui/SectionHeading";
import ProductCard from "@/components/product/ProductCard";

// Products the shopper opened recently (guests too, kept in this browser). Hidden until there is something to show.
export default function RecentlyViewed() {
  const { viewed } = useCart();
  const { getProduct } = useCatalog();
  const list = viewed.map(getProduct).filter(Boolean).slice(0, 5);
  if (!list.length) return null;
  return (
    <section className="container-x py-8">
      <SectionHeading title="Recently viewed" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{list.map((p) => <ProductCard key={p.id} product={p} />)}</div>
    </section>
  );
}
