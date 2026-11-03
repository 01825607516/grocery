"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/adminSession";
import { Loading } from "./ui";

// Shop settings (GET/PUT /admin/api/settings) are shared by most panel sections: load once, save, reload.
export const Ctx = createContext(null);
export const useStoreSettings = () => useContext(Ctx);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [storageReady, setStorageReady] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await adminApi("/settings");
      setStorageReady(data?.storage_ready !== false);
      setSettings(data?.settings && typeof data.settings === "object" ? data.settings : {});
    } catch (e) { setError(e.message || "Could not load the store settings."); setSettings((old) => old || {}); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Send only the keys that changed. Resolves after the fresh settings were read back.
  const save = useCallback(async (payload) => {
    await adminApi("/settings", { method: "PUT", json: payload });
    await load();
  }, [load]);

  const value = useMemo(() => ({ settings, storageReady, error, reload: load, save }), [settings, storageReady, error, load, save]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Shown at the top of every settings-based section.
export function SettingsGate({ children }) {
  const { settings, storageReady, error } = useStoreSettings();
  if (!settings) return <Loading>Loading store settings…</Loading>;
  return (
    <>
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">Could not load the saved settings ({error}). What you see below may be incomplete.</p>}
      {!storageReady && <p role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">Storefront settings storage is not installed for this shop yet. Run the Laravel migrations, then reload this page.</p>}
      {children}
    </>
  );
}
