"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, USE_MOCK, STATIC_CATALOG, registerProducts } from "@/services";

// NEXT_PUBLIC_USE_DOKANI=1 -> categories/products come from Dokani Cloud through our own /api/dokani/catalog route
// (the server logs in to Dokani; the browser never sees the shop password). Everything else (cart, orders, offers...) stays as before.
const USE_DOKANI = process.env.NEXT_PUBLIC_USE_DOKANI === "1";

const CatalogContext = createContext(null);
export const useCatalog = () => useContext(CatalogContext);

// Loads categories / products / offers / recipes / delivery areas / slots from the API once.
// Mock mode has the data instantly; a real API shows a short loading screen (and a retry button on failure).
export function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState(USE_MOCK && !USE_DOKANI ? STATIC_CATALOG : null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setError("");
    if (USE_DOKANI) {
      fetch("/api/dokani/catalog", { cache: "no-store" })
        .then(async (r) => { const j = await r.json().catch(() => null); if (!r.ok) throw new Error(j?.message || `Request failed (${r.status})`); return j; })
        .then((j) => {
          if (!j.products?.length) throw new Error("No products found in Dokani yet.");
          registerProducts(j.products);
          setCatalog({
            ...STATIC_CATALOG, categories: j.categories, products: j.products, brands: j.brands, brandLogos: j.brandLogos || {},
            // delivery areas / slots / payments / config / offers come from Dokani when the shop has set them up (recipes too, when the shop has added some)
            ...(j.areas?.length ? { areas: j.areas } : {}), ...(j.slots?.length ? { slots: j.slots } : {}), ...(j.payments?.length ? { payments: j.payments } : {}),
            ...(j.config ? { config: j.config } : {}), ...(j.recipes?.length ? { recipes: j.recipes } : {}), ...(j.offers ? { offers: { weekend: j.offers.weekend || [], upcoming: j.offers.upcoming || [] } } : {}),
            ...(j.siteContent ? { siteContent: j.siteContent } : {}), ...(j.support ? { support: j.support } : {}),
          });
        })
        .catch((e) => setError(e.message || "Could not load the store."));
      return;
    }
    api.getCatalog().then(setCatalog).catch((e) => setError(e.message || "Could not load the store."));
  }, []);
  useEffect(() => { if (!USE_MOCK || USE_DOKANI) load(); }, [load]);

  const value = useMemo(() => {
    if (!catalog) return null;
    // Keep sellable products first everywhere that consumes the shared catalog.
    // Stable sorting preserves the backend/catalog order within each availability group.
    const products = [...catalog.products].sort((a, b) => Number(a.status === "out") - Number(b.status === "out"));
    const map = new Map(products.map((p) => [String(p.id), p]));
    const names = new Map(products.map((p) => [p.name, p]));
    return { ...catalog, products, getProduct: (id) => map.get(String(id)), byName: (list) => list.map((n) => names.get(n)).filter(Boolean) };
  }, [catalog]);

  if (!value)
    return (
      <div className="grid min-h-screen place-items-center bg-cream p-6 text-center">
        {error ? (
          <div><p className="font-display text-xl text-primary-dark">We couldn&apos;t load the store</p><p className="mt-1 text-sm text-ink/60">{error}</p><button onClick={load} className="btn mt-4">Try again</button></div>
        ) : <p className="font-display text-xl italic text-primary">Freshly<span className="text-accent">.</span> loading…</p>}
      </div>
    );
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}
