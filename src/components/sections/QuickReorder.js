"use client";
import { useCart } from "@/context/CartContext";
import { LAST_ORDER, PRODUCTS } from "@/lib/data";
import SectionHeading from "@/components/ui/SectionHeading";
import Img from "@/components/ui/Img";

export default function QuickReorder() {
  const { addMany } = useCart();
  const items = LAST_ORDER.map((id) => PRODUCTS.find((p) => p.id === id));
  const reorder = (e) => addMany(items, "items", e.currentTarget);
  return (
    <section className="container-x py-10">
      <SectionHeading title="Quick reorder" />
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-3 text-sm text-ink/60">Your last order</p>
          <div className="flex flex-wrap gap-4">
            {items.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <Img src={p.image} alt={p.name} className="h-14 w-14 rounded-lg object-cover" />
                <span className="text-sm">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={reorder} className="btn">Reorder all</button>
      </div>
    </section>
  );
}
