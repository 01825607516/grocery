"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/context/I18nContext";

// Search bar for the Hero section. Enter (or the button) -> /shop?q=...
export default function HeroSearch({ className = "" }) {
  const router = useRouter();
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const go = (e) => { e.preventDefault(); const v = q.trim(); router.push(v ? `/shop?q=${encodeURIComponent(v)}` : "/shop"); };
  return (
    <form onSubmit={go} role="search" className={`flex w-full max-w-xl overflow-hidden rounded-full bg-white shadow-lg ring-1 ring-black/5 ${className}`}>
      <input value={q} onChange={(e) => setQ(e.target.value)} type="search" enterKeyHint="search" placeholder={t("search_ph")} aria-label={t("search")} className="min-w-0 flex-1 bg-transparent px-5 py-3 text-sm outline-none" />
      <button type="submit" className="bg-primary px-5 text-sm font-bold text-white hover:bg-primary-dark">{t("search")}</button>
    </form>
  );
}
