 "use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import HeaderToggles from "./HeaderToggles";
import HeaderSearch from "./HeaderSearch";
import useView from "@/hooks/useView";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCatalog } from "@/context/CatalogContext";
import { endOfWeekend } from "@/components/ui/Ticker";
import { money } from "@/lib/format";
import CollectionModal from "@/components/product/CollectionModal";
import { buildSlots } from "@/lib/delivery";

const pad = (n) => String(n).padStart(2, "0");

// Live weekend sale + countdown to Saturday 11:59 PM. Sits inside the top bar, next to the delivery area.
function SaleTicker({ onShop, title }) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    const target = endOfWeekend();
    const tick = () => setLeft(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  const d = left === null ? 0 : Math.floor(left / 86400);
  const clock = left === null ? "--:--:--" : `${d > 0 ? `${d}d ` : ""}${pad(Math.floor((left % 86400) / 3600))}:${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`;
  return (
    <div className="ml-auto flex min-w-0 items-center gap-x-2 whitespace-nowrap md:gap-x-2.5">
      <span className="relative hidden h-2 w-2 shrink-0 sm:flex"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-accent" /></span>
      <span className="hidden min-w-0 truncate font-display tracking-wide md:inline"><b className="font-semibold text-white">{title}</b> <span className="text-accent">live</span><span className="px-2 text-accent/60" aria-hidden="true">·</span></span>
      <span className="shrink-0" role="timer">ends in <b className="font-mono font-semibold tabular-nums text-white">{clock}</b></span>
      <button onClick={onShop} className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 font-bold text-primary-dark transition hover:bg-white">Shop now →</button>
    </div>
  );
}

const HEART = "M12 21s-7-4.6-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6c-2.5 4.4-9.5 9-9.5 9z";
const BAG = "M6 7h12l1 13H5L6 7zM9 7a3 3 0 016 0";
const USER = "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0";

function IconButton({ path, label, count, onClick }) {
  return (
    <button onClick={onClick} aria-label={`${label}${count ? ` (${count})` : ""}`} className="relative flex shrink-0 flex-col items-center text-primary">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
      <span className="hidden font-display text-xs italic md:block lg:hidden xl:block">{label}</span>
      {count > 0 && <b className="absolute -right-2 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] text-white">{count}</b>}
    </button>
  );
}

const NAV = [
  { id: "home", label: "Home" },
  { id: "categories", label: "Categories" },
  { id: "shop", label: "Shop" },
  { id: "top-saver", label: "Top Saver" },
  { id: "recommended", label: "For You" },
  { id: "reorder", label: "Reorder & Recipes" },
];

function NavLinks({ active: spy, className = "" }) {
  const ref = useRef(null);
  const onHome = usePathname() === "/";            // on other pages the section links go back to the home page
  const active = onHome ? spy : null;
  useEffect(() => {
    // on phones the nav row scrolls sideways: keep the current section's link centred in view
    const ul = ref.current;
    const li = ul?.querySelector('[aria-current="true"]')?.parentElement;
    if (ul && li && ul.scrollWidth > ul.clientWidth) ul.scrollTo({ left: li.offsetLeft - (ul.clientWidth - li.clientWidth) / 2, behavior: "smooth" });
  }, [active]);
  return (
    <ul ref={ref} className={`no-scrollbar flex items-center gap-5 font-display text-[15px] tracking-wide lg:gap-4 lg:text-sm xl:gap-7 xl:text-[15px] ${className}`}>
      {NAV.map((n) => (
        <li key={n.id} className="shrink-0">
          <a href={`${onHome ? "" : "/"}#${n.id}`} aria-current={active === n.id ? "true" : undefined}
            className={`relative block py-1.5 transition after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-center after:bg-accent after:transition-transform after:duration-300 ${active === n.id ? "font-semibold text-primary after:scale-x-100" : "text-ink/70 after:scale-x-0 hover:text-primary hover:after:scale-x-100"}`}>{n.label}</a>
        </li>
      ))}
    </ul>
  );
}

export default function Header() {
  const headRef = useRef(null);
  useEffect(() => { // real header height -> --header-h (hero height, section anchors use it)
    const el = headRef.current; if (!el) return;
    const set = () => document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const active = useView();
  const pathname = usePathname();
  const { area, setArea, wishlist, isWished, count, setDrawerOpen } = useCart();
  const { areas, products, offers, slots, config } = useCatalog();
  const { user, requireLogin, setAccountOpen } = useAuth();
  const [wishOpen, setWishOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const sale = offers.weekend[0];
  // "Next slot: Today 4 – 6 PM": the first slot still open (courier areas have no slots). Computed after mount, so it never mismatches the server render.
  const [nextSlot, setNextSlot] = useState("");
  useEffect(() => {
    if (area.courier) return setNextSlot("");
    const tick = () => { const s = buildSlots(slots, new Date(), config.leadHours); const f = s.list.find((x) => !x.disabled); setNextSlot(f ? `${s.dayLabel} ${f.label}` : ""); };
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, [area, slots, config.leadHours]);

  return (
    <header ref={headRef} className="sticky top-0 z-40 border-b border-accent/40 bg-cream">
      {/* line 1: delivery area (left) + live sale countdown (right) + phone (wide screens) */}
      <div className="bg-primary-dark text-cream/90">
        <div className="container-x flex items-center gap-x-3 py-1.5 text-xs md:text-[13px]">
          <div className="flex min-w-0 items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-accent" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
            <label className="sr-only" htmlFor="area">Delivery area</label>
            <select id="area" value={area.id} onChange={(e) => setArea(areas.find((a) => a.id === e.target.value))} className="max-w-[34vw] truncate rounded bg-transparent font-semibold text-cream outline-none sm:max-w-none [&>option]:text-ink">
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <span className="hidden whitespace-nowrap text-cream/60 lg:inline">Delivery charge {money(area.charge)}{area.courier ? ` · ${area.eta}` : area.express ? " · Express available" : ""}{nextSlot ? ` · Next slot: ${nextSlot}` : ""}</span>
          </div>
          {sale && <SaleTicker title={sale.title} onShop={() => setSaleOpen(true)} />}
          <a href="tel:0949324782" className={`hidden whitespace-nowrap font-medium tracking-wide text-accent xl:block ${sale ? "" : "ml-auto"}`}>Call 09 4932 4782</a>
        </div>
      </div>
      <div className="container-x flex items-center gap-3 py-3.5 md:gap-5 lg:gap-4">
        <a href={`${pathname === "/" ? "" : "/"}#home`} className="font-display text-[1.7rem] font-bold leading-none tracking-wide text-primary">Freshly<span className="text-accent">.</span></a>
        <nav aria-label="Page sections" className="mx-auto hidden lg:block"><NavLinks active={active} /></nav>
        <span className="ml-auto flex items-center gap-3 md:gap-5 lg:ml-0 lg:gap-4 xl:gap-5"><HeaderSearch /><IconButton path={HEART} label="Wishlist" count={wishlist.length} onClick={() => (user ? setWishOpen(true) : requireLogin(() => setWishOpen(true), "Please log in to see your wishlist."))} />
        <IconButton path={BAG} label="Cart" count={count} onClick={() => setDrawerOpen(true)} />
        <HeaderToggles />
        <IconButton path={USER} label={user ? user.name.split(" ")[0].slice(0, 10) : "Login"} onClick={() => (user ? setAccountOpen(true) : requireLogin(null, ""))} /></span>
      </div>
      {/* phones / small tablets: second row, swipeable */}
      <nav aria-label="Page sections" className="border-t border-accent/20 lg:hidden">
        <NavLinks active={active} className="container-x justify-start overflow-x-auto py-1" />
      </nav>
      {saleOpen && sale && <CollectionModal open onClose={() => setSaleOpen(false)} title={sale.title} products={products.filter((p) => sale.cats.includes(p.category))} />}
      {wishOpen && <CollectionModal key={wishlist.length} open onClose={() => setWishOpen(false)} title="Your wishlist" products={products.filter((p) => isWished(p.id))} />}
    </header>
  );
}