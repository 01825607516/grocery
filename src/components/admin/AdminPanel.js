"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { SettingsProvider, useStoreSettings } from "./settings";
import { Btn, Card, Loading } from "./ui";
import Campaigns from "./sections/Campaigns";
import Homepage from "./sections/Homepage";
import Brand from "./sections/Brand";
import Content from "./sections/Content";
import Appearance from "./sections/Appearance";
import Layout from "./sections/Layout";
import { applyTheme } from "@/lib/theme";

const I = {
  overview: "M3 12l9-8 9 8M5 10v10h14V10",
  orders: "M6 7h12l1 13H5L6 7zM9 7a3 3 0 016 0",
  campaigns: "M19 5L5 19M7 7h.01M17 17h.01",
  coupons: "M3 9a2 2 0 002-2h14a2 2 0 002 2v6a2 2 0 00-2 2H5a2 2 0 00-2-2zM9 7v10",
  delivery: "M2 7h11v9H2zM13 10h4l3 3v3h-7M6 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
  homepage: "M4 5h16v6H4zM4 14h7v5H4zM14 14h6v5h-6z",
  brand: "M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.6 6.7 19.5l1.1-6L3.4 9.3l6-.8z",
  checkout: "M4 6h16M4 12h16M4 18h10",
  content: "M5 4h14v16H5zM8 9h8M8 13h8M8 17h5",
  appearance: "M12 3a9 9 0 100 18c1.7 0 2-1 1.5-2-.6-1.3.3-2.5 1.8-2.5H18a3 3 0 003-3c0-5-4-10.5-9-10.5zM7.5 11h.01M10 7.5h.01M14 7.5h.01",
  layout: "M3 4h18v5H3zM3 12h8v8H3zM14 12h7v8h-7z",
};
// Only the website-control sections (no orders / coupons / delivery / checkout): store look, homepage and content.
const SECTIONS = [
  ["brand", "Brand & SEO", Brand], ["appearance", "Look & feel", Appearance], ["content", "Contact, pages & footer", Content],
  ["homepage", "Homepage content & menu", Homepage], ["layout", "Sections & order", Layout], ["campaigns", "Banners & offers", Campaigns],
];
const GROUPS = [["Store", ["brand", "appearance", "content"]], ["Homepage", ["homepage", "layout", "campaigns"]]];
const Icon = ({ id }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={I[id]} /></svg>;

function Gate({ children }) {
  return (
    <main data-no-translate className="grid min-h-screen place-items-center bg-cream p-5">
      <div className="w-full max-w-md text-center">{children}</div>
    </main>
  );
}

function Shell({ admin }) {
  const { adminLogout } = useAuth();
  const { theme, toggle } = useTheme();
  const { settings } = useStoreSettings();
  const [section, setSection] = useState("brand");

  useEffect(() => {
    const read = () => { const h = window.location.hash.replace("#", ""); if (SECTIONS.some(([id]) => id === h)) setSection(h); };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const go = useCallback((id) => { setSection(id); try { window.history.replaceState(null, "", `#${id}`); } catch {} window.scrollTo({ top: 0 }); }, []);

  // the panel itself wears the saved website theme
  const savedTheme = JSON.stringify(settings?.site_content?.theme || null);
  useEffect(() => { if (settings) applyTheme(settings.site_content?.theme); }, [savedTheme]); // eslint-disable-line react-hooks/exhaustive-deps

  const c = settings?.site_content || {};
  const name = settings?.brand_name_en || c.brand_name_en || c.brand_name || "Freshly";
  const logo = settings?.site_logo_url || c.logo_url;
  const current = SECTIONS.find(([id]) => id === section) || SECTIONS[0];
  const View = current[2];

  return (
    <div data-no-translate className="min-h-screen bg-cream text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-primary-dark text-cream/90 md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          {logo ? <img src={logo} alt={name} className="h-9 max-w-40 object-contain" /> : <p className="font-display text-2xl font-bold tracking-wide text-white">{name}<span className="text-accent">.</span></p>}
          <p className="mt-1 text-xs tracking-wide text-accent">Website management</p>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-3" aria-label="Admin sections">
          {GROUPS.map(([group, ids]) => (
            <div key={group} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[.16em] text-cream/45">{group}</p>
              {ids.map((id) => { const [, label] = SECTIONS.find((x) => x[0] === id); return (
                <button key={id} type="button" onClick={() => go(id)} aria-current={section === id ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${section === id ? "bg-white/10 font-semibold text-white ring-1 ring-accent/70" : "text-cream/75 hover:bg-white/5 hover:text-white"}`}>
                  <Icon id={id} />{label}
                </button>
              ); })}
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4 text-sm">
          <p className="truncate font-semibold text-white">{admin.name}</p>
          <p className="truncate text-xs text-cream/60">{admin.email}</p>
          <button type="button" onClick={adminLogout} className="mt-2 text-xs font-semibold text-accent hover:text-white">Log out</button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 border-b border-accent/40 bg-cream/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 md:px-8">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-accent-dark">Website management</p>
              <h1 className="truncate font-display text-xl font-semibold text-primary-dark">{current[1]}</h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={toggle} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} className="grid h-9 w-9 place-items-center rounded-full border border-primary/50 text-primary hover:bg-primary-light">
                {theme === "dark" ? "☀" : "☾"}
              </button>
              <Link href="/" className="rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary-light">View website ↗</Link>
              <button type="button" onClick={adminLogout} className="hidden rounded-lg px-2 py-2 text-sm text-ink/60 hover:text-ink sm:block md:hidden">Log out</button>
            </div>
          </div>
          <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-accent/20 px-2 py-1 md:hidden" aria-label="Admin sections">
            {SECTIONS.map(([id, label]) => (
              <button key={id} type="button" onClick={() => go(id)} aria-current={section === id ? "page" : undefined} className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${section === id ? "bg-primary text-white" : "text-ink/70"}`}>{label}</button>
            ))}
          </nav>
        </header>
        <div className="mx-auto max-w-6xl p-4 md:p-8"><View key={section} go={go} /></div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { admin, refreshAdmin, requireLogin } = useAuth();
  const [checking, setChecking] = useState(true);
  useEffect(() => { let live = true; refreshAdmin().finally(() => live && setChecking(false)); return () => { live = false; }; }, [refreshAdmin]);

  if (checking && !admin) return <Gate><Loading>Checking your access…</Loading></Gate>;
  if (!admin) return (
    <Gate>
      <Card>
        <p className="font-display text-2xl font-bold text-primary">Website management</p>
        <p className="mt-3 text-sm text-ink/70">Please log in with your administrator account. It is the same login form customers use.</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Btn onClick={() => requireLogin(null, "Log in with your administrator account to manage the website.")}>Log in</Btn>
          <Link href="/" className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-light">Back to the website</Link>
        </div>
        <p className="mt-4 text-xs text-ink/50">Only staff accounts with “Website Control” access can open this area.</p>
      </Card>
    </Gate>
  );
  return <SettingsProvider><Shell admin={admin} /></SettingsProvider>;
}
