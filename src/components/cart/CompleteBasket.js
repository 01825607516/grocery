"use client";
import { useMemo } from "react";
import Art from "@/components/ui/Art";
import { useCart } from "@/context/CartContext";
import { useCatalog } from "@/context/CatalogContext";
import { lineTotal, money, stepOf, unitLabel } from "@/lib/format";
import { completeRecipes, deliveryFillers } from "@/lib/shopping";

// Inside the cart (drawer + cart page): (1) "you have 2 of 5 ingredients for Chicken Curry & Rice - add the rest",
// (2) "৳120 more for free delivery - these get you there". Hidden when there is nothing useful to say.
export default function CompleteBasket({ compact = false }) {
  const { lines, totals, method, addLines } = useCart();
  const { products, recipes, byName } = useCatalog();
  const ids = useMemo(() => lines.map((l) => l.product.id), [lines]);
  const dishes = useMemo(() => completeRecipes(ids, recipes, byName, 2), [ids, recipes, byName]);
  const gap = method === "express" ? 0 : totals.toFree; // free delivery only counts for Standard delivery
  const fill = useMemo(() => deliveryFillers(products, ids, gap, 3), [products, ids, gap]);
  if (!lines.length || (!dishes.length && !fill.length)) return null;
  return (
    <div className="space-y-3">
      {dishes.map(({ r, products: all, have, missing }) => {
        const cost = missing.reduce((s, p) => s + lineTotal(p, stepOf(p)), 0);
        return (
          <div key={r.name} className="rounded-xl bg-white p-3 text-sm ring-1 ring-accent/30">
            <p className="font-display font-semibold text-primary-dark">🛒 Complete your meal: {r.name}</p>
            <p className="text-xs text-ink/60">You have {have.length} of {all.length} ingredients. Missing: {missing.map((p) => p.name).join(", ")}</p>
            <button onClick={(e) => addLines(missing.map((p) => ({ p, qty: stepOf(p) })), e.currentTarget)} className="btn mt-2 w-full !py-1.5 !text-xs">Add {missing.length} missing · {money(cost)}</button>
          </div>
        );
      })}
      {fill.length > 0 && (
        <div className="rounded-xl bg-white p-3 text-sm ring-1 ring-accent/30">
          <p className="font-display font-semibold text-primary-dark">🚚 {money(gap)} more for free delivery</p>
          <ul className="mt-1.5 space-y-1.5">
            {fill.map(({ p, cost }) => (
              <li key={p.id} className="flex items-center gap-2">
                <Art src={p.image} fallback={p.fallback} kind={p.kind} color={p.color} label="" className="h-9 w-9 shrink-0 rounded-lg" />
                <span className="min-w-0 flex-1 truncate text-xs font-semibold">{p.name}<span className="ml-1 font-normal text-ink/50">{cost >= gap ? "gets you there" : `${p.discount}% off`}</span></span>
                <b className="whitespace-nowrap text-xs text-primary">{money(cost)}{unitLabel(p) ? <span className="font-normal text-ink/50"> / 500 g</span> : ""}</b>
                <button onClick={(e) => addLines([{ p, qty: stepOf(p) }], e.currentTarget)} aria-label={`Add ${p.name}`} className="h-7 w-7 rounded bg-primary text-white">+</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
