"use client";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCatalog } from "@/context/CatalogContext";
import { money, qtyLabel, unitLabel } from "@/lib/format";
import SectionHeading from "@/components/ui/SectionHeading";
import Pagination from "@/components/ui/Pagination";
import Art from "@/components/ui/Art";
import { hay } from "@/lib/searchText";

const PER_PAGE = 3;
const PANEL = "flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-accent/40";
const THUMB = "shrink-0 rounded-lg ring-1 ring-accent/40 sepia-[.1] contrast-[1.03]";

// Panel header: title + one-line hint (and an optional control on the right)
function PanelHead({ title, hint, children }) {
  return (
    <div className="flex flex-col gap-2.5 border-b border-accent/25 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:px-5">
      <div className="min-w-0">
        <h3 className="font-display text-lg font-semibold leading-tight text-primary-dark">{title}</h3>
        <p className="mt-0.5 text-xs text-ink/60">{hint}</p>
      </div>
      {children}
    </div>
  );
}

// 2 x 2 photo tile for recipes that have no photo of their own
function Mosaic({ items, label }) {
  return (
    <div role="img" aria-label={label} className="grid h-14 w-14 shrink-0 grid-cols-2 grid-rows-2 gap-px overflow-hidden rounded-xl bg-accent/30 ring-1 ring-accent/40">
      {items.slice(0, 4).map((p) => <Art key={p.id} src={p.image} fallback={p.fallback} kind={p.kind} color={p.color} label="" className="h-full w-full" />)}
    </div>
  );
}

// One section, two panels side by side: Quick reorder (left) + Recipe to cart (right). They stack on phones.
export default function SmartShopping() {
  const { addMany, reorder, orders } = useCart();
  const { user, requireLogin } = useAuth();
  const { recipes: RECIPES, byName, getProduct } = useCatalog();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [openRecipe, setOpenRecipe] = useState(null); // recipe whose ingredient list is expanded
  const [skip, setSkip] = useState({});               // { "recipe name": [ids of ingredients the shopper un-ticked] }
  const picked = (r) => r.products.filter((p) => p.status !== "out" && !(skip[r.name] || []).includes(p.id));
  const toggleIng = (r, id) => setSkip((s) => { const cur = s[r.name] || []; return { ...s, [r.name]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] }; });

  // Quick reorder = the shopper's most recent order (newest first from the API); guests are asked to log in
  const lastOrder = orders[0];
  const last = lastOrder ? lastOrder.items.map((i) => ({ item: i, p: getProduct(i.productId) })).filter((x) => x.p) : [];
  const term = q.trim().toLowerCase();
  const recipes = RECIPES.map((r) => ({ ...r, products: byName(r.items) }))
    .filter((r) => !term || hay(r.name).includes(term) || r.products.some((p) => hay(p.name).includes(term)));
  const pages = Math.ceil(recipes.length / PER_PAGE);
  const cur = Math.min(page, Math.max(pages, 1));

  return (
    <section className="container-x">
      <SectionHeading title="Reorder & Recipes" />
      <div className="mx-auto grid max-w-5xl items-stretch gap-4 md:grid-cols-2 md:gap-5">

        {/* Quick reorder */}
        <div className={PANEL}>
          <PanelHead title="Quick reorder" hint="Your last order, back in your cart in one tap" />
          {!user ? (
            <p className="px-5 py-10 text-center text-sm text-ink/60">Log in to see your last order and reorder it in one tap.<br /><button onClick={() => requireLogin(null, "Please log in to see your previous orders.")} className="btn mt-3">Log in</button></p>
          ) : !last.length ? (
            <p className="px-5 py-10 text-center text-sm text-ink/60">No previous orders yet. Once you order, it will show up here.</p>
          ) : (
            <>
              <ul className="divide-y divide-accent/20 px-4 md:px-5">
                {last.map(({ item, p }) => (
                  <li key={p.id} className="flex items-center gap-3 py-2.5">
                    <Art src={p.image} fallback={p.fallback} kind={p.kind} color={p.color} label={p.name} className={`h-11 w-11 ${THUMB}`} />
                    <span className="min-w-0 flex-1 truncate font-display text-[15px] font-semibold">{p.name}{item.qty !== 1 && <span className="ml-1 text-xs font-normal text-ink/50">× {qtyLabel(p, item.qty)}</span>}</span>
                    <span className="whitespace-nowrap text-sm"><b className="text-primary">{money(p.price)}</b><span className="text-ink/50">{unitLabel(p)}</span></span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-accent/25 bg-cream/50 px-4 py-3 md:px-5">
                <span className="text-sm text-ink/60">{last.length} items</span>
                <button onClick={(e) => reorder(lastOrder, e.currentTarget)} className="btn">Reorder all</button>
              </div>
            </>
          )}
        </div>

        {/* Recipe to cart */}
        <div className={PANEL}>
          <PanelHead title="Recipe to cart" hint="Pick a dish, we add every ingredient">
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search recipe or ingredient" aria-label="Search recipe or ingredient" className="w-full rounded-lg border border-accent/50 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary sm:w-52" />
          </PanelHead>
          {recipes.length ? (
            <ul className="space-y-2 p-3 md:px-4">
              {recipes.slice((cur - 1) * PER_PAGE, cur * PER_PAGE).map((r) => (
<li key={r.name} className="rounded-xl bg-cream/60 p-2 ring-1 ring-accent/20">
                  <div className="flex items-center gap-3">
                    {r.image
                      ? <Art src={r.image} color="#b9a36b" label={r.name} className={`h-14 w-14 !rounded-xl ${THUMB}`} />
                      : <Mosaic items={r.products} label={r.name} />}
                    <button onClick={() => setOpenRecipe(openRecipe === r.name ? null : r.name)} aria-expanded={openRecipe === r.name} className="min-w-0 flex-1 text-left">
                      <span className="block truncate font-display text-base font-semibold leading-tight">{r.name}</span>
                      <span className="mt-0.5 block line-clamp-2 text-xs leading-snug text-ink/60">{openRecipe === r.name ? "Tick the ingredients you need" : r.products.map((p) => p.name).join(", ")}</span>
                      <span className="mt-0.5 block text-[11px] font-semibold text-primary">{openRecipe === r.name ? "Hide ingredients ▲" : "Choose ingredients ▼"}</span>
                    </button>
                    <button onClick={(e) => addMany(r.products, "ingredients", e.currentTarget)} aria-label={`Add all ingredients for ${r.name}`} className="btn whitespace-nowrap !px-3.5 !py-2">Add all</button>
                  </div>
                  {openRecipe === r.name && (
                    <div className="mt-2 border-t border-accent/25 pt-2">
                      <ul className="space-y-1">
                        {r.products.map((p) => (
                          <li key={p.id}>
                            <label className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${p.status === "out" ? "opacity-50" : "cursor-pointer hover:bg-white"}`}>
                              <input type="checkbox" disabled={p.status === "out"} checked={p.status !== "out" && !(skip[r.name] || []).includes(p.id)} onChange={() => toggleIng(r, p.id)} />
                              <span className="min-w-0 flex-1 truncate">{p.name}{p.status === "out" && <span className="ml-1 text-xs text-ink/50">(out of stock)</span>}</span>
                              <span className="whitespace-nowrap text-xs"><b className="text-primary">{money(p.price)}</b><span className="text-ink/50">{unitLabel(p)}</span></span>
                            </label>
                          </li>
                        ))}
                      </ul>
                      <button disabled={!picked(r).length} onClick={(e) => addMany(picked(r), "ingredients", e.currentTarget)} className="btn mt-2 w-full !py-2">Add selected ({picked(r).length})</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : <p className="px-5 py-10 text-center text-sm text-ink/60">No recipe found. Try an ingredient like “egg” or “mango”.</p>}
          {pages > 1 && <div className="mt-auto pb-3"><Pagination page={cur} pages={pages} onChange={setPage} compact /></div>}
        </div>

      </div>
    </section>
  );
}
