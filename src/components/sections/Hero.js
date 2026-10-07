"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HERO } from "@/lib/data";
import { useCatalog } from "@/context/CatalogContext";
import { money } from "@/lib/format";
import QuantityControl from "@/components/product/QuantityControl";
import CollectionModal from "@/components/product/CollectionModal";
import { CountText, endOfWeekend } from "@/components/ui/Ticker";
import Art from "@/components/ui/Art";
import { hay } from "@/lib/searchText";

const BELL = "M6 9a6 6 0 1112 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 004 0";

// Offer banners: this weekend's live offers first, then the coming-soon ones. ONE wide sale-strip at a time, auto-sliding (no arrows).
// best real discount among the products of the offer's categories (used when the offer has no `off` number of its own)
const bestOff = (o, all) => Math.floor(Math.max(0, ...all.filter((p) => o.cats?.includes(p.category)).map((p) => p.discount || 0)));
// When an upcoming offer starts: the API's `startsAt` (ISO date) if it sends one, else the first time this browser saw the
// offer + startsInHours, remembered in localStorage so a page reload does NOT restart the countdown.
const offerStart = (o) => {
  if (o.startsAt) return Date.parse(o.startsAt);
  const key = `gs_offer_start_${o.id}`;
  try {
    const saved = Number(localStorage.getItem(key));
    if (saved) return saved;
    const t = Date.now() + o.startsInHours * 3600_000;
    localStorage.setItem(key, String(t));
    return t;
  } catch { return Date.now() + o.startsInHours * 3600_000; }
};

const OUTLINE = { textShadow: "2px 2px 0 #5a0409, -2px -2px 0 #5a0409, 2px -2px 0 #5a0409, -2px 2px 0 #5a0409, 0 3px 0 #5a0409" };
// spiky "Dhamaka" starburst: n spikes, every other point pulled in a little differently so it looks hand-made, not a perfect star
const burst = (n) => `polygon(${Array.from({ length: n * 2 }, (_, k) => {
  const a = (Math.PI * k) / n - Math.PI / 2;
  const r = k % 2 === 0 ? 50 : 50 * (k % 4 === 1 ? 0.74 : 0.85);
  return `${(50 + r * Math.cos(a)).toFixed(1)}% ${(50 + r * Math.sin(a)).toFixed(1)}%`;
}).join(",")})`;
const BURST = burst(22);
const RIBBON = "polygon(0 0,100% 0,96% 50%,100% 100%,0 100%,4% 50%)"; // ribbon with notched ends

// ONE wide "Dhamaka" banner. The OUTLINE ITSELF is not a rectangle:
//   a rounded pill (photo curves with its left end) + a spiky starburst in the middle that bursts out above and below the pill.
//   [offer photo]  [starburst: offer name, BIG words, UPTO x% OFF + date ribbon hanging on the bottom edge]  [ONE button]
function OfferBanner({ offer, off, reminded, onShop, onRemind }) {
  const live = offer.kind === "weekend";
  // live offers say "BIG SALE", coming-soon ones say "MEGA OFFER" (or set `tag: "FLASH DEAL"` on the offer)
  const words = (offer.tag || (live ? "BIG SALE" : "MEGA OFFER")).toUpperCase().split(" ");
  const tag = words.join(" ");
  const rest = words.slice(1).join(" ");
  const big = tag.length > 9 ? "text-[1.7rem] md:text-[2.3rem]" : "text-[2.1rem] md:text-[2.9rem]"; // longer words = smaller, so they stay inside the burst
  const target = live ? endOfWeekend : () => offerStart(offer);
  return (
    <article className="relative isolate flex flex-col rounded-[2rem] text-white shadow-[0_12px_30px_rgba(0,0,0,.4)] md:h-[8.75rem] md:flex-row md:rounded-full">
      {/* PILL: glow + golden rays + the photo, all clipped to the rounded pill (so the photo follows the curved left end) */}
      <span aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden rounded-[2rem] border-[3px] border-[#ffd93d] md:rounded-full" style={{ background: "radial-gradient(circle at 50% 55%, #ff8a1f 0%, #e0212c 38%, #8f0b13 100%)" }}>
        <span className="absolute inset-0" style={{ backgroundImage: "repeating-conic-gradient(from 0deg at 50% 55%, rgba(255,226,92,.22) 0 6deg, transparent 6deg 12deg)" }} />
        <span className="absolute inset-y-0 left-0 hidden w-[27%] md:block" style={{ background: offer.bg, clipPath: "polygon(0 0,100% 0,88% 100%,0 100%)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={offer.image} alt={offer.title} loading="lazy" className="absolute inset-0 h-full w-full animate-kenburns object-cover motion-reduce:animate-none" />
          <span className="absolute inset-y-0 left-0 w-1/4 animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent motion-reduce:hidden" />
        </span>
      </span>
      {/* status chip on the photo */}
      <span className={`absolute left-7 top-3 z-10 hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow md:flex ${live ? "bg-[#d41f2a] text-white" : "bg-white text-[#b3121b]"}`}>
        {live && <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-80" /><span className="relative inline-flex h-2 w-2 rounded-full bg-accent" /></span>}
        {live ? "Live now" : "Coming soon"}
      </span>

      {/* CENTRE: starburst that sticks out of the pill (top and bottom) + text + ribbon */}
      <div className="relative flex min-h-[8.5rem] min-w-0 flex-1 items-center justify-center md:ml-[20%] md:min-h-0">
        <div aria-hidden="true" className="absolute inset-x-0 -inset-y-2 md:-inset-y-4" style={{ filter: "drop-shadow(0 4px 0 rgba(0,0,0,.3))" }}>
          <span className="absolute inset-0 bg-gradient-to-b from-[#ffe45c] to-[#ff9d0a]" style={{ clipPath: BURST }} />
          <span className="absolute inset-[5px] md:inset-[6px]" style={{ clipPath: BURST, background: "radial-gradient(circle at 50% 38%, #f0272f, #b00d14)" }} />
          <span className="absolute inset-[5px] animate-shine overflow-hidden motion-reduce:hidden md:inset-[6px]" style={{ clipPath: BURST }}><span className="absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-transparent via-white/25 to-transparent" /></span>
        </div>
        <div className="relative z-10 px-6 pb-3 text-center md:px-4 md:pb-5" aria-label={off > 0 ? `${offer.title}: ${tag}, up to ${off} percent off` : `${offer.title}: ${tag}`}>
          <p className="mx-auto max-w-[16rem] truncate text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#ffe45c] md:max-w-[22rem] md:text-[11px]">{offer.title}</p>
          <p className={`whitespace-nowrap font-body font-black italic leading-[1.02] ${big}`}>
            <span className="text-white" style={OUTLINE}>{words[0]}</span>{rest && <>{" "}<span className="text-[#ffd93d]" style={OUTLINE}>{rest}</span></>}
          </p>
          {off > 0 && <p className="-rotate-2 font-body text-xs font-black italic leading-none text-white md:text-base"><span style={OUTLINE}>upto</span> <span className="text-[1.6rem] text-[#ffd93d] md:text-[2.3rem]" style={OUTLINE}>{off}%</span> <span style={OUTLINE}>OFF</span></p>}
        </div>
        {/* date ribbon hanging over the bottom edge (desktop; on phones the countdown sits in the bottom bar) */}
        <p className="absolute -bottom-2 left-1/2 z-10 hidden -translate-x-1/2 -rotate-1 whitespace-nowrap bg-gradient-to-b from-[#ffe45c] to-[#ffb01a] px-8 py-0.5 text-xs font-extrabold uppercase tracking-wider text-[#8f0b13] md:block" style={{ clipPath: RIBBON }}>
          {live ? "Ends in" : "Starts in"} <CountText className="font-black" getTarget={target} />
        </p>
      </div>

      {/* RIGHT: ONE clear button (on phones: a bottom bar with the countdown) */}
      <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 rounded-b-[2rem] bg-black/25 px-4 py-2 md:w-[11.5rem] md:flex-col md:justify-center md:gap-2 md:rounded-none md:bg-transparent md:py-0 md:pl-2 md:pr-6">
        <p className="text-[10px] font-bold uppercase tracking-wider md:hidden">{live ? "Ends in" : "Starts in"} <CountText className="font-extrabold text-[#ffd93d]" getTarget={target} /></p>
        <p className="hidden text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#ffe45c] md:block">{live ? "Hurry up!" : "Don't miss it"}</p>
        {live ? (
          <button onClick={onShop} aria-label={`${offer.title} - shop now`} className="group whitespace-nowrap rounded-full bg-[#ffd93d] px-4 py-2 text-sm font-extrabold text-[#2a0a0a] shadow-[0_3px_0_rgba(0,0,0,.3)] transition hover:bg-white md:w-full md:py-2.5">Shop now <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span></button>
        ) : (
          <button onClick={onRemind} aria-pressed={reminded} aria-label={`${offer.title} - remind me`} className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border-2 px-4 py-1.5 text-sm font-extrabold transition md:w-full md:py-2 ${reminded ? "border-white bg-white text-[#b3121b]" : "border-white bg-[#8f0b13]/60 text-white hover:bg-[#8f0b13]"}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={reminded ? "" : "origin-top animate-wiggle motion-reduce:animate-none"}><path d={BELL} /></svg>
            {reminded ? "Reminder set ✓" : "Remind me"}
          </button>
        )}
      </div>
    </article>
  );
}

// Endless auto-sliding banner (one at a time, NO arrows, no dots): after the last banner it glides on to the first one (no rewind).
// Pauses on hover / touch / while a popup is open. Phones can still swipe.
function OfferSlider({ offers, paused, render }) {
  const total = offers.length;
  const sliding = total > 1;
  const [i, setI] = useState(0);
  const [anim, setAnim] = useState(true);
  const [hold, setHold] = useState(false);
  const [startX, setStartX] = useState(0);
  const items = sliding ? [...offers, offers[0]] : offers;

  const jump = (idx, then) => {
    setAnim(false); setI(idx);
    requestAnimationFrame(() => requestAnimationFrame(() => { setAnim(true); then?.(); }));
  };
  const next = () => { if (sliding && anim && i < total) setI(i + 1); };
  const prev = () => { if (!sliding || !anim) return; i === 0 ? jump(total, () => setI(total - 1)) : setI(i - 1); };

  useEffect(() => {
    if (!sliding || paused || hold) return;
    const t = setTimeout(next, 5500); // long enough to read a banner
    return () => clearTimeout(t);
  }, [i, anim, sliding, paused, hold]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}
      onTouchStart={(e) => { setStartX(e.touches[0].clientX); setHold(true); }}
      onTouchEnd={(e) => { const d = e.changedTouches[0].clientX - startX; if (Math.abs(d) > 40) (d < 0 ? next : prev)(); setHold(false); }}>
      <div className="overflow-x-clip">
        <div
          className={`flex ${anim ? "transition-transform duration-700 ease-out" : ""}`}
          style={{ transform: `translateX(-${i * 100}%)` }}
          onTransitionEnd={(e) => { if (e.target === e.currentTarget && sliding && i >= total) jump(0); }}
        >
          {items.map((o, k) => (
            // padding gives room for the banner's shadow
            <div key={`${o.id}-${k}`} className="w-full shrink-0 px-1 pb-5 pt-5 [@media(max-height:760px)]:!pb-3 [@media(max-height:760px)]:!pt-3" aria-hidden={k >= total || undefined}>{render(o)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const { products: all, brands, categories, offers, config } = useCatalog();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const [results, setResults] = useState(null); // full search results popup (Enter key)
  const router = useRouter();
  const [pick, setPick] = useState(null);       // category / brand chosen from the suggestions
  const [reminded, setReminded] = useState([]);
  const PERKS = [`Free delivery over ৳${config.freeDeliveryLimit}`, "Fresh every day", "Cash on delivery"];
  const OFFERS = useMemo(() => [...offers.weekend.map((o) => ({ ...o, kind: "weekend" })), ...offers.upcoming.map((o) => ({ ...o, kind: "upcoming" }))], [offers]);
  const term = q.trim().toLowerCase();
  const match = (p) => [p.name, p.brand, p.sub].some((s) => hay(s).includes(term));
  const products = term ? all.filter(match).slice(0, 5) : [];
  const others = term ? [...brands.filter((b) => hay(b).includes(term)).map((b) => ({ type: "brand", name: b })), ...categories.filter((c) => hay(c.name).includes(term)).map((c) => ({ type: "category", name: c.name, id: c.id }))].slice(0, 3) : [];
  const showAll = () => { if (!term) return; setResults({ title: `Results for “${q.trim()}”`, list: all.filter(match) }); setQ(""); };
  const toggle = (id) => setReminded((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));
  const [lead, accent, tail] = HERO.title.split(/(Fast, Easy & Affordable)/);

  // The whole hero (picture + search + offer banners) is exactly one screen tall: screen height minus the sticky header.
  return (
    <section id="home" className="relative isolate h-[calc(100svh-var(--header-h,9rem))] min-h-[24rem] overflow-x-clip text-white">
      <div className="absolute inset-0 -z-10 overflow-hidden bg-[#0c1a13]">
        <div className="absolute inset-0 scale-105 bg-cover bg-center" style={{ backgroundImage: "url(/images/hero.jpg)", filter: "brightness(.66) saturate(.95)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(10,26,19,.1) 0%, rgba(10,26,19,.7) 88%), linear-gradient(180deg, rgba(10,26,19,.55) 0%, rgba(10,26,19,.15) 42%, rgba(10,26,19,.8) 100%)" }} />
      </div>

      <div className="container-x flex h-full flex-col justify-center pb-[3vh]">
        {/* text + search take whatever height is left above the banners */}
        <div className="relative z-20 flex shrink-0 flex-col items-center py-1 text-center">
          <p className="font-display text-[11px] uppercase tracking-[0.42em] text-white md:text-sm">Freshly Grocery</p>
          <h1 className="mt-[1.2vh] max-w-4xl font-hero text-[clamp(1.9rem,min(9vw,6.4vh),4.5rem)] font-semibold leading-[1.08] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,.55)]">
            {lead}<em className="font-medium italic">{accent}</em>{tail}
          </h1>
          <div className="my-[1.6vh] flex items-center gap-3 text-accent" aria-hidden="true">
            <span className="h-px w-14 bg-gradient-to-r from-transparent to-accent md:w-24" /><span className="h-1.5 w-1.5 rotate-45 bg-accent" /><span className="h-px w-14 bg-gradient-to-l from-transparent to-accent md:w-24" />
          </div>
          <p className="hidden max-w-xl font-hero text-lg italic text-white sm:block md:text-[clamp(1.1rem,3vh,1.5rem)] [@media(max-height:760px)]:!hidden">{HERO.text}</p>

          <div className="mt-[2vh] w-full max-w-2xl">
            <div className="flex items-center gap-2 rounded-2xl border border-accent/50 bg-white/10 p-1.5 shadow-2xl backdrop-blur-xl">
              <div className="relative min-w-0 flex-1" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setTimeout(() => setQ(""), 150); }}>
                <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && showAll()} placeholder="Search products, brands, categories" aria-label="Search" className="w-full rounded-xl bg-transparent py-2.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/60" />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/70" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
                {term && (
                  <div onMouseDown={(e) => e.preventDefault()} className="absolute inset-x-0 top-full z-30 mt-3 rounded-xl bg-white p-2 text-left text-ink shadow-2xl">
                    {others.map((o) => <button key={o.type + o.name} onMouseDown={(e) => e.preventDefault()} onClick={() => { if (o.type === "category") router.push(`/category/${o.id}`); else setPick(o); setQ(""); }} className="block w-full rounded px-2 py-1.5 text-left text-sm text-ink/80 hover:bg-primary-light">{o.name} <span className="text-xs text-ink/50">· {o.type === "brand" ? "Brand" : "Category"}</span></button>)}
                    {products.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm">
                        <span className="flex min-w-0 items-center gap-2"><Art src={p.image} fallback={p.fallback} kind={p.kind} color={p.color} label={p.name} className="h-9 w-9 shrink-0 rounded" /><span className="truncate">{p.name}</span> <b className="text-primary">{money(p.price)}</b></span>
                        <QuantityControl product={p} />
                      </div>
                    ))}
                    {(products.length > 0 || others.length > 0) && <button onMouseDown={(e) => e.preventDefault()} onClick={showAll} className="mt-1 block w-full border-t px-2 py-2 text-left text-xs font-semibold text-primary">See all results for “{q.trim()}” →</button>}
                    {!products.length && !others.length && <p className="p-3 text-sm text-ink/60">No match. Try a different word.</p>}
                  </div>
                )}
              </div>
              <a href="#categories" className="whitespace-nowrap rounded-xl bg-cream px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-white md:px-7">Shop now</a>
            </div>
          </div>
        </div>

        {/* offer banners: one wide banner at a time, auto-sliding, at the bottom of the same screen */}
        <div id="offers" className="relative z-10 mx-auto mt-[max(1.25rem,3.5vh)] w-full max-w-[60rem] shrink-0 pb-1.5 pt-1">
          <OfferSlider offers={OFFERS} paused={!!open} render={(o) => (
            <OfferBanner offer={o} off={o.off ?? bestOff(o, all)} reminded={reminded.includes(o.id)} onShop={() => setOpen(o)} onRemind={() => toggle(o.id)} />
          )} />
          <ul className="hidden flex-wrap items-center justify-center gap-x-8 gap-y-1 pt-2 [@media(max-height:760px)]:!hidden text-[10px] font-medium uppercase tracking-[0.18em] text-white/90 sm:flex md:text-[11px]">
            {PERKS.map((t) => <li key={t} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{t}</li>)}
          </ul>
        </div>
      </div>
      {open && <CollectionModal key={open.id} open onClose={() => setOpen(null)} title={open.title} products={all.filter((p) => open.cats.includes(p.category))} />}
      {results && <CollectionModal key={results.title} open onClose={() => setResults(null)} title={results.title} products={results.list} />}
      {pick && <CollectionModal key={pick.name} open onClose={() => setPick(null)} title={pick.name} subs={pick.type === "brand" ? [...new Set(all.filter((p) => p.brand === pick.name).map((p) => p.sub))] : categories.find((c) => c.id === pick.id).subs} products={pick.type === "brand" ? all.filter((p) => p.brand === pick.name) : all.filter((p) => p.category === pick.id)} />}
    </section>
  );
}