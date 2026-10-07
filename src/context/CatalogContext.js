"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, USE_MOCK, STATIC_CATALOG } from "@/services";

const CatalogContext = createContext(null);
export const useCatalog = () => useContext(CatalogContext);

// Loads categories / products / offers / recipes / delivery areas / slots from the API once.
// Mock mode has the data instantly; a real API shows a short loading screen (and a retry button on failure).
export function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState(USE_MOCK ? STATIC_CATALOG : null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setError("");
    api.getCatalog().then(setCatalog).catch((e) => setError(e.message || "Could not load the store."));
  }, []);
  useEffect(() => { if (!USE_MOCK) load(); }, [load]);

  const value = useMemo(() => {
    if (!catalog) return null;
    const map = new Map(catalog.products.map((p) => [String(p.id), p]));
    const names = new Map(catalog.products.map((p) => [p.name, p]));
    return { ...catalog, getProduct: (id) => map.get(String(id)), byName: (list) => list.map((n) => names.get(n)).filter(Boolean) };
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
