"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCatalog } from "@/context/CatalogContext";
import ProductCard from "@/components/product/ProductCard";
import Pagination from "@/components/ui/Pagination";
import { Crumbs } from "./common";
import { hay } from "@/lib/searchText";
import RecipeHint from "@/components/product/RecipeHint";
import { recipeHits } from "@/lib/shopping";

const PER_PAGE = 12;
const SORTS = [["relevance", "Relevance"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["discount", "Biggest discount"], ["name", "Name A–Z"]];
const SORT_FN = {
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  discount: (a, b) => b.discount - a.discount,
  name: (a, b) => a.name.localeCompare(b.name),
};
const FIELD = "rounded-lg border border-accent/40 bg-white px-2 py-1.5 text-sm outline-none focus:border-primary";
const chip = (on) => `rounded-full px-4 py-1.5 text-sm transition ${on ? "bg-primary text-white" : "bg-white hover:bg-primary-light"}`;

// Product listing with filters + sort + pagination. All choices live in the URL (?q=&sub=&brand=&min=&max=&sort=&stock=1&offer=1&page=),
// so a filtered list can be shared / bookmarked and the back button works.
// `category` is set on /category/[id]; on /shop the category is a filter (?cat=).
export default function ShopView({ category = null }) {
  const { products, categories, recipes, byName } = useCatalog();
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const q = sp.get("q") || "";
  const catId = category?.id || sp.get("cat") || "";
  const sub = sp.get("sub") || "";
  const brands = sp.get("brand") ? sp.get("brand").split(",") : [];
  const min = sp.get("min") || "";
  const max = sp.get("max") || "";
  const sort = sp.get("sort") || "relevance";
  const inStock = sp.get("stock") === "1";
  const offersOnly = sp.get("offer") === "1";
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const cat = category || categories.find((c) => c.id === catId) || null;

  const set = (patch) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) (v === "" || v == null || v === false ? next.delete(k) : next.set(k, v === true ? "1" : String(v)));
    if (!("page" in patch)) next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
  };

  const scope = useMemo(() => products.filter((p) => !cat || p.category === cat.id), [products, cat]); // facets come from the chosen category
  const allBrands = useMemo(() => [...new Set(scope.map((p) => p.brand))].sort(), [scope]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const catName = (id) => categories.find((c) => c.id === id)?.name || "";
    const lo = parseFloat(min), hi = parseFloat(max);
    const out = scope.filter((p) =>
      (!needle || [p.name, p.brand, p.sub, catName(p.category)].some((t) => hay(t).includes(needle))) &&
      (!sub || p.sub === sub) && (!brands.length || brands.includes(p.brand)) &&
      (isNaN(lo) || p.price >= lo) && (isNaN(hi) || p.price <= hi) &&
      (!inStock || p.status !== "out") && (!offersOnly || p.discount > 0));
    return SORT_FN[sort] ? [...out].sort(SORT_FN[sort]) : out;
  }, [scope, categories, q, sub, brands.join(","), min, max, sort, inStock, offersOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const dishes = useMemo(() => (q ? recipeHits(q, recipes, byName).slice(0, 2) : []), [q, recipes, byName]);
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const visible = list.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);
  const filtered = !!(q || sub || brands.length || min || max || inStock || offersOnly || (!category && catId));
  const toggleBrand = (b) => set({ brand: (brands.includes(b) ? brands.filter((x) => x !== b) : [...brands, b]).join(",") });

  return (
    <>
      <Crumbs items={[{ href: "/", label: "Home" }, ...(category ? [{ href: "/shop", label: "Shop" }, { label: category.name }] : [{ label: "Shop" }])]} />

      {/* category chips (on /shop) or sub-category chips (on a category page) */}
      <div className="mb-4 flex flex-wrap gap-2">
        {category ? (
          <>
            <button onClick={() => set({ sub: "" })} className={chip(!sub)}>All</button>
            {category.subs.map((s) => <button key={s} onClick={() => set({ sub: s })} className={chip(sub === s)}>{s}</button>)}
          </>
        ) : (
          <>
            <button onClick={() => set({ cat: "", sub: "", brand: "" })} className={chip(!catId)}>All</button>
            {categories.map((c) => <button key={c.id} onClick={() => set({ cat: c.id, sub: "", brand: "" })} className={chip(catId === c.id)}>{c.name}</button>)}
          </>
        )}
      </div>
      {!category && cat && cat.subs.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">{cat.subs.map((s) => <button key={s} onClick={() => set({ sub: sub === s ? "" : s })} className={chip(sub === s)}>{s}</button>)}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-[15rem_1fr]">
        {/* filters */}
        <aside>
          <button onClick={() => setShowFilters((v) => !v)} className="mb-3 w-full rounded-lg border border-accent/40 bg-white px-3 py-2 text-sm font-semibold lg:hidden">{showFilters ? "Hide filters" : "Show filters"}</button>
          <div className={`${showFilters ? "block" : "hidden"} space-y-4 rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5 lg:block`}>
            <div>
              <p className="mb-1 font-semibold">Search</p>
              <input key={q} defaultValue={q} onKeyDown={(e) => e.key === "Enter" && set({ q: e.target.value.trim() })} onBlur={(e) => e.target.value.trim() !== q && set({ q: e.target.value.trim() })} placeholder="Name, brand…" aria-label="Search products" className={`${FIELD} w-full`} />
            </div>
            <div>
              <p className="mb-1 font-semibold">Price (৳)</p>
              <div className="flex items-center gap-2">
                <input key={`min${min}`} defaultValue={min} inputMode="numeric" placeholder="Min" aria-label="Minimum price" onBlur={(e) => e.target.value !== min && set({ min: e.target.value.replace(/\D/g, "") })} onKeyDown={(e) => e.key === "Enter" && e.target.blur()} className={`${FIELD} w-full`} />
                <span>–</span>
                <input key={`max${max}`} defaultValue={max} inputMode="numeric" placeholder="Max" aria-label="Maximum price" onBlur={(e) => e.target.value !== max && set({ max: e.target.value.replace(/\D/g, "") })} onKeyDown={(e) => e.key === "Enter" && e.target.blur()} className={`${FIELD} w-full`} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2"><input type="checkbox" checked={inStock} onChange={(e) => set({ stock: e.target.checked })} /> In stock only</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={offersOnly} onChange={(e) => set({ offer: e.target.checked })} /> Offers only</label>
            </div>
            <div>
              <p className="mb-1 font-semibold">Brand</p>
              <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                {allBrands.map((b) => <label key={b} className="flex items-center gap-2"><input type="checkbox" checked={brands.includes(b)} onChange={() => toggleBrand(b)} /> {b}</label>)}
              </div>
            </div>
            {filtered && <button onClick={() => router.replace(category ? path : path, { scroll: false })} className="w-full rounded-lg border border-primary py-1.5 font-semibold text-primary hover:bg-primary-light">Clear filters</button>}
          </div>
        </aside>

        {/* results */}
        <div>
          {dishes.map((r) => <RecipeHint key={r.name} recipe={r} />)}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-ink/70"><b className="text-ink">{list.length}</b> {list.length === 1 ? "product" : "products"}{q ? ` for “${q}”` : ""}</p>
            <label className="flex items-center gap-2">Sort by
              <select value={sort} onChange={(e) => set({ sort: e.target.value === "relevance" ? "" : e.target.value })} aria-label="Sort products" className={FIELD}>
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          </div>
          {visible.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{visible.map((p) => <ProductCard key={p.id} product={p} compact />)}</div>
          ) : (
            <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-black/5">
              <p className="font-display text-lg font-semibold text-primary-dark">No products found</p>
              <p className="mt-1 text-sm text-ink/60">Try removing a filter or searching for something else.</p>
              {filtered && <button onClick={() => router.replace(path, { scroll: false })} className="btn mt-4">Clear filters</button>}
            </div>
          )}
          <Pagination page={cur} pages={pages} onChange={(n) => { set({ page: n === 1 ? "" : n }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </div>
      </div>
    </>
  );
}