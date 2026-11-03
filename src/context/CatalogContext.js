"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { CONFIG } from "@/lib/data";

// The whole catalogue (categories, products, brands, offers, recipes, delivery areas, time slots, payments, site content...) comes from the
// DATABASE through our own /api/dokani/catalog route: the server logs in to Dokani, the browser never sees the shop password.
// There is no demo / mock data. Whatever the shop has not filled in yet is simply EMPTY (and the matching section hides itself).
const CatalogContext = createContext(null);
export const useCatalog = () => useContext(CatalogContext);

// Delivery area used ONLY while the shop has not created a single delivery option. The rest of the site needs "a current area" to exist,
// so this placeholder keeps it from crashing; it carries no price, and the server refuses an order for it ("Please choose a delivery area").
const NO_AREA = { id: "unset", name: "Delivery not set up yet", charge: 0, express: false, expressCharge: 0, courier: true, eta: "—", unavailable: true };

const EMPTY = {
  categories: [], products: [], brands: [], brandLogos: {}, recipes: [], slots: [], payments: [],
  offers: { weekend: [], upcoming: [] }, areas: [NO_AREA], config: CONFIG,
};

// server answer -> catalogue. A key the server did not send (or sent empty) keeps its EMPTY value.
const build = (j) => ({
  ...EMPTY,
  categories: j.categories || [], products: j.products || [], brands: j.brands || [], brandLogos: j.brandLogos || {},
  ...(j.areas?.length ? { areas: j.areas } : {}), ...(j.slots?.length ? { slots: j.slots } : {}), ...(j.payments?.length ? { payments: j.payments } : {}),
  ...(j.config ? { config: j.config } : {}), ...(j.recipes?.length ? { recipes: j.recipes } : {}),
  ...(j.offers ? { offers: { weekend: j.offers.weekend || [], upcoming: j.offers.upcoming || [] } } : {}),
  ...(j.siteContent ? { siteContent: j.siteContent } : {}), ...(j.language ? { language: j.language } : {}), ...(j.languageMode ? { languageMode: j.languageMode } : {}),
  ...(j.featureToggles ? { featureToggles: j.featureToggles } : {}), ...(j.support ? { support: j.support } : {}), ...(j.footerContent ? { footerContent: j.footerContent } : {}),
  ...(j.socialLinks ? { socialLinks: j.socialLinks } : {}), ...(j.infoPages ? { infoPages: j.infoPages } : {}), ...(j.storeFrom ? { storeFrom: j.storeFrom } : {}),
});

// Loads the catalogue from the database once. The shop shows a short loading screen (and a retry button on failure).
export function CatalogProvider({ children }) {
  // The admin panel (/admin) must open even when the product catalogue is slow or broken (that is when you need it most), so on /admin
  // the page is NOT held back: it renders at once with an empty catalogue and the real one (e.g. the category list) fills in when it arrives.
  const pathname = usePathname() || "";
  const onAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setError("");
    fetch("/api/dokani/catalog", { cache: "no-store" })
      .then(async (r) => { const j = await r.json().catch(() => null); if (!r.ok) throw new Error(j?.message || `Request failed (${r.status})`); return j; })
      .then((j) => {
        if (!j.products?.length) throw new Error("No products found in Dokani yet.");
        setCatalog(build(j));
      })
      .catch((e) => setError(e.message || "Could not load the store."));
  }, []);
  useEffect(() => { load(); }, [load]);

  const active = catalog || (onAdmin ? EMPTY : null);
  const value = useMemo(() => {
    if (!active) return null;
    // Keep sellable products first everywhere that consumes the shared catalog.
    // Stable sorting preserves the backend/catalog order within each availability group.
    const products = [...active.products].sort((a, b) => Number(a.status === "out") - Number(b.status === "out"));
    const map = new Map(products.map((p) => [String(p.id), p]));
    const names = new Map(products.map((p) => [p.name, p]));
    const categories = active.categories || [];
    return { ...active, categories, products, getProduct: (id) => map.get(String(id)), byName: (list) => list.map((n) => names.get(n)).filter(Boolean) };
  }, [active]);

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
