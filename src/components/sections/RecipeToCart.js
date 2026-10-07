"use client";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { PRODUCTS, RECIPES } from "@/lib/data";
import SectionHeading from "@/components/ui/SectionHeading";
import Pagination from "@/components/ui/Pagination";
import Img from "@/components/ui/Img";

const PER_PAGE = 3;
const byId = (ids) => ids.map((id) => PRODUCTS.find((p) => p.id === id));

export default function RecipeToCart() {
  const { addMany } = useCart();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const term = q.trim().toLowerCase();
  const list = RECIPES.filter((r) => !term || r.name.toLowerCase().includes(term) || byId(r.items).some((p) => p.name.toLowerCase().includes(term)));
  const addAll = (ids, el) => addMany(byId(ids), "ingredients", el);

  return (
    <section className="container-x py-10">
      <SectionHeading title="Recipe to cart" right={
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search recipe or ingredient" className="w-48 rounded-lg border border-accent/50 bg-white px-3 py-2 text-sm outline-none focus:border-primary md:w-72" />
      } />
      {list.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {list.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((r) => (
            <div key={r.name} className="flex flex-col rounded-2xl bg-white p-3">
              <Img src={r.image} alt={r.name} className="h-40 w-full rounded-xl object-cover" />
              <h4 className="mt-3 font-semibold">{r.name}</h4>
              <p className="mb-3 text-xs text-ink/60">{byId(r.items).map((p) => p.name).join(" · ")}</p>
              <button onClick={(e) => addAll(r.items, e.currentTarget)} className="btn mt-auto">Add all ingredients</button>
            </div>
          ))}
        </div>
      ) : <p className="py-8 text-center text-ink/60">No recipe found. Try an ingredient like “egg” or “mango”.</p>}
      <Pagination page={page} pages={Math.ceil(list.length / PER_PAGE)} onChange={setPage} />
    </section>
  );
}
