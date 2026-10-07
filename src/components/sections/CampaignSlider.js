"use client";
import { useEffect, useRef, useState } from "react";
import { WEEKEND_OFFERS, UPCOMING_OFFERS, PRODUCTS } from "@/lib/data";
import Slider from "@/components/ui/Slider";
import SectionHeading from "@/components/ui/SectionHeading";
import CollectionModal from "@/components/product/CollectionModal";

// Bangladesh weekend = Friday + Saturday, so the weekend offer ends Saturday 11:59 PM.
const endOfWeekend = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};
const pad = (n) => String(n).padStart(2, "0");

// Fades + slides up the first time it scrolls into view.
function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return setSeen(true);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`transition-all duration-700 ease-out motion-reduce:transition-none ${seen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"}`}>
      {children}
    </div>
  );
}

// Live d / h / m / s countdown. `getTarget` runs once in the browser (avoids server/client time mismatch).
function Ticker({ getTarget }) {
  const [left, setLeft] = useState(null);
  const fn = useRef(getTarget); // read once on mount, so re-renders never restart the countdown
  useEffect(() => {
    const target = fn.current();
    const tick = () => setLeft(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  const s = left ?? 0;
  const parts = [[Math.floor(s / 86400), "day"], [Math.floor((s % 86400) / 3600), "hr"], [Math.floor((s % 3600) / 60), "min"], [s % 60, "sec"]];
  return (
    <div className="flex items-center gap-1.5" role="timer">
      {parts.map(([v, u]) => (
        <span key={u} className="min-w-[2.6rem] overflow-hidden rounded-md bg-white/15 px-1.5 py-1 text-center font-mono text-sm font-bold leading-none text-white">
          <span key={left === null ? "x" : v} className="inline-block animate-tick motion-reduce:animate-none">{pad(v)}</span>
          <small className="mt-0.5 block text-[9px] font-semibold uppercase tracking-wide text-white/60">{u}</small>
        </span>
      ))}
    </div>
  );
}

// Banner picture: slow zoom + a light sweep that glides across every few seconds.
function Banner({ offer, onClick }) {
  const body = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={offer.image} alt={offer.title} loading="lazy" className="h-full w-full animate-kenburns object-contain motion-reduce:animate-none" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1/4 animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent motion-reduce:hidden" />
    </>
  );
  const cls = "group relative block aspect-[16/9] w-full overflow-hidden";
  return onClick
    ? <button onClick={onClick} aria-label={`${offer.title} - shop now`} style={{ background: offer.bg }} className={`${cls} cursor-pointer`}>{body}</button>
    : <div style={{ background: offer.bg }} className={cls}>{body}</div>;
}

function Label({ text, sub }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coffee opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-coffee" /></span>
      <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-coffee">{text}</h3>
      <span className="text-xs text-ink/55">{sub}</span>
    </div>
  );
}

const BELL = "M6 9a6 6 0 1112 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 004 0";

export default function CampaignSlider() {
  const [open, setOpen] = useState(null);
  const [reminded, setReminded] = useState([]);
  const toggle = (id) => setReminded((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  const weekend = WEEKEND_OFFERS.map((o) => (
    <div key={o.id}>
      <Banner offer={o} onClick={() => setOpen(o)} />
      <div className="flex flex-wrap items-center justify-between gap-3 bg-coffee px-4 py-3 text-cream">
        <div className="flex flex-wrap items-center gap-3"><span className="text-xs font-semibold uppercase tracking-widest text-cream/80">Ends in</span><Ticker getTarget={endOfWeekend} /></div>
        <button onClick={() => setOpen(o)} className="group rounded-full bg-cream px-5 py-2 text-sm font-bold text-coffee transition hover:scale-105 hover:bg-white">Shop now <span className="inline-block transition-transform group-hover:translate-x-1">→</span></button>
      </div>
    </div>
  ));

  const upcoming = UPCOMING_OFFERS.map((o) => {
    const on = reminded.includes(o.id);
    return (
      <div key={o.id}>
        <Banner offer={o} />
        <div className="flex flex-wrap items-center justify-between gap-3 bg-coffee px-4 py-3 text-cream">
          <div className="flex flex-wrap items-center gap-3"><span className="text-xs font-semibold uppercase tracking-widest text-cream/80">Starts in</span><Ticker getTarget={() => Date.now() + o.startsInHours * 3600_000} /></div>
          <button onClick={() => toggle(o.id)} aria-pressed={on} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition hover:scale-105 ${on ? "border-cream bg-cream text-coffee" : "border-cream/70 text-cream hover:bg-cream/15"}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={on ? "" : "origin-top animate-wiggle motion-reduce:animate-none"}><path d={BELL} /></svg>
            {on ? "Reminder set ✓" : "Remind me"}
          </button>
        </div>
      </div>
    );
  });

  return (
    <section id="offers" className="container-x py-8">
      <SectionHeading title="Special offers" />
      <div className="grid gap-8 lg:grid-cols-2">
        <Reveal>
          <Label text="This weekend" sub="Live now" />
          <Slider slides={weekend} delay={5500} paused={!!open} className="rounded-3xl shadow-lg ring-1 ring-accent/30" />
        </Reveal>
        <Reveal delay={180}>
          <Label text="Coming soon" sub="Festive offers on the way" />
          <Slider slides={upcoming} delay={6500} className="rounded-3xl shadow-lg ring-1 ring-accent/30" />
        </Reveal>
      </div>
      {open && <CollectionModal key={open.id} open onClose={() => setOpen(null)} title={open.title} products={PRODUCTS.filter((p) => open.cats.includes(p.category))} />}
    </section>
  );
}
