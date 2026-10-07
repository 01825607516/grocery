"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/context/I18nContext";

// Registers /sw.js (production only) and shows a small "Install app" button when the browser allows it.
export default function PwaRegister() {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState(null);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => {});
    const before = (e) => { e.preventDefault(); setPrompt(e); };
    const on = () => setOffline(false), off = () => setOffline(true);
    setOffline(!navigator.onLine);
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    window.addEventListener("appinstalled", () => setPrompt(null));
    return () => { window.removeEventListener("beforeinstallprompt", before); window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return (
    <>
      {offline && <div role="status" className="fixed inset-x-0 top-0 z-[90] bg-amber-500 px-3 py-1 text-center text-xs font-semibold text-white">{t("offline")}</div>}
      {prompt && <button onClick={async () => { prompt.prompt(); await prompt.userChoice; setPrompt(null); }} className="fixed bottom-4 left-4 z-[55] rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg">⬇ {t("install")}</button>}
    </>
  );
}
