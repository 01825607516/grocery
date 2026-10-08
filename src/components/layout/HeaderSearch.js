"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCatalog } from "@/context/CatalogContext";
import { money } from "@/lib/format";
import { hay } from "@/lib/searchText";
import { recipeHits } from "@/lib/shopping";
import QuantityControl from "@/components/product/QuantityControl";
import CollectionModal from "@/components/product/CollectionModal";
import RecipeHint from "@/components/product/RecipeHint";
import Art from "@/components/ui/Art";

const SEARCH = "M20 20l-3.5-3.5M11 18a7 7 0 100-14 7 7 0 000 14z";
const TRY = ["Milk", "Egg", "Rice", "Biryani", "Chicken"];

// Search icon in the header -> a search panel drops down from the top.
// Live suggestions (categories, brands, dish ingredients, products with + / - buttons). Enter = full results popup.
export default function HeaderSearch() {
  const { products: all, brands, categories, recipes, byName } = useCatalog();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null); // full results popup
  const [pick, setPick] = useState(null);       // brand chosen from the suggestions
  const inputRef = useRef(null);

  const close = () => { setOpen(false); setQ(""); };
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const esc = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const term = q.trim().toLowerCase();
  const match = (p) => [p.name, p.brand, p.sub].some((s) => hay(s).includes(term));
  const products = term ? all.filter(match).slice(0, 6) : [];
  const others = term ? [...brands.filter((b) => hay(b).includes(term)).map((b) => ({ type: "brand", name: b })), ...categories.filter((c) => hay(c.name).includes(term)).map((c) => ({ type: "category", name: c.name, id: c.id }))].slice(0, 3) : [];
  const dishes = term ? recipeHits(q, recipes, byName).slice(0, 1) : [];
  const showAll = () => { if (!term) return; setResults({ title: `Results for “${q.trim()}”`, list: all.filter(match) }); close(); };
  const openList = () => { close(); window.dispatchEvent(new CustomEvent("open-smart-list")); };

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Search" aria-haspopup="dialog" className="relative flex shrink-0 flex-col items-center text-primary">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={SEARCH} /></svg>
        <span className="hidden font-display text-xs italic md:block lg:hidden xl:block">Search</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] bg-black/50" onClick={close}>
          <div role="dialog" aria-label="Search" onClick={(e) => e.stopPropagation()} className="container-x mx-auto mt-2 max-w-2xl animate-up rounded-2xl bg-cream p-3 shadow-2xl md:mt-6 md:p-4">
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && showAll()} placeholder="Search products, brands, categories" aria-label="Search" className="w-full rounded-xl border border-accent/50 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-primary" />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/70" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d={SEARCH} /></svg>
              </div>
              <button onClick={close} aria-label="Close search" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
            </div>

            <div className="mt-2 max-h-[65svh] overflow-y-auto">
              {!term ? (
                <div className="p-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">Popular searches</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TRY.map((t) => <button key={t} onClick={() => { setQ(t); inputRef.current?.focus(); }} className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-primary ring-1 ring-accent/40 hover:bg-primary-light">{t}</button>)}
                  </div>
                  <button onClick={openList} className="mt-4 flex w-full items-center gap-3 rounded-xl bg-primary-light/70 p-3 text-left ring-1 ring-accent/30 transition hover:bg-primary-light">
                    <span className="text-xl" aria-hidden="true">📝</span>
                    <span className="min-w-0"><b className="block text-sm text-primary-dark">Have a whole shopping list?</b><span className="text-xs text-ink/60">Type it once, we fill your cart →</span></span>
                  </button>
                </div>
              ) : (
                <div className="rounded-xl bg-white p-2 text-ink">
                  {others.map((o) => <button key={o.type + o.name} onClick={() => { if (o.type === "category") { router.push(`/category/${o.id}`); close(); } else { setPick(o); close(); } }} className="block w-full rounded px-2 py-2 text-left text-sm text-ink/80 hover:bg-primary-light">{o.name} <span className="text-xs text-ink/50">· {o.type === "brand" ? "Brand" : "Category"}</span></button>)}
                  {dishes.map((r) => <RecipeHint key={r.name} recipe={r} compact />)}
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm">
                      <span className="flex min-w-0 items-center gap-2"><Art src={p.image} fallback={p.fallback} kind={p.kind} color={p.color} label={p.name} className="h-10 w-10 shrink-0 rounded" /><span className="truncate">{p.name}</span> <b className="text-primary">{money(p.price)}</b></span>
                      <QuantityControl product={p} />
                    </div>
                  ))}
                  {(products.length > 0 || others.length > 0 || dishes.length > 0) && <button onClick={showAll} className="mt-1 block w-full border-t px-2 py-2.5 text-left text-xs font-semibold text-primary">See all results for “{q.trim()}” →</button>}
                  {!products.length && !others.length && !dishes.length && <p className="p-3 text-sm text-ink/60">No match. Try a different word.</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {results && <CollectionModal key={results.title} open onClose={() => setResults(null)} title={results.title} products={results.list} />}
      {pick && <CollectionModal key={pick.name} open onClose={() => setPick(null)} title={pick.name} subs={[...new Set(all.filter((p) => p.brand === pick.name).map((p) => p.sub))]} products={all.filter((p) => p.brand === pick.name)} />}
    </>
  );
}
