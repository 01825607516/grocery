 "use client";
import Link from "next/link";
import { PAYMENTS } from "@/lib/data";

const TRUST = [["truck", "Fastest Delivery", "Delivery to your door step"], ["phone", "24x7 Service", "Reach us when needed"], ["check", "Verified Brands", "Guaranteed products"], ["shield", "100% Assurance", "We stand by every order"]];
const ICONS = {"truck": "M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z", "phone": "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z", "check": "M12 3l2.4 2 3.1-.3.9 3 2.6 1.7-1 3 1 3-2.6 1.7-.9 3-3.1-.3L12 21l-2.4-2-3.1.3-.9-3L3 14.6l1-3-1-3L5.6 7l.9-3 3.1.3zM8.5 12l2.5 2.5 4.5-5", "shield": "M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6zM8.5 12l2.5 2.5 4.5-5"};
// Every footer link opens its own page (same pages the old grid "Pages" menu listed).
const COLS = [
  { title: "Customer support", links: [["/help-center", "Help Center"], ["/faq", "FAQ"], ["/contact", "Contact"], ["/delivery-information", "Delivery Information"], ["/return-policy", "Return & Refund"]] },
  { title: "Company", links: [["/about", "About"], ["/careers", "Careers"], ["/privacy", "Privacy Policy"], ["/terms", "Terms & Conditions"]] },
];

export default function Footer() {
  return (
    <footer className="border-t-2 border-accent bg-primary-dark text-white/80">
      {/* main: brand, links, payments (compact) */}
      <div className="container-x grid grid-cols-2 gap-x-6 gap-y-6 py-7 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div className="col-span-2 md:col-span-1">
          <p className="font-display text-2xl font-bold leading-none text-accent">Freshly<span className="text-cream">.</span></p>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed">Fresh groceries delivered to your door step, anywhere in Bangladesh.</p>
          <a href="tel:0949324782" className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] font-semibold text-cream ring-1 ring-accent/40 transition hover:bg-accent hover:text-primary-dark">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS.phone} /></svg>
            09 4932 4782
          </a>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h5 className="font-display text-sm font-semibold uppercase tracking-widest text-accent">{c.title}</h5>
            <span className="mb-2.5 mt-1.5 block h-0.5 w-6 rounded bg-accent/60" />
            <ul className="space-y-1 text-[13px]">{c.links.map(([href, label]) => <li key={href}><Link href={href} className="inline-block transition hover:translate-x-0.5 hover:text-accent">{label}</Link></li>)}</ul>
          </div>
        ))}
        <div className="col-span-2 md:col-span-1">
          <h5 className="font-display text-sm font-semibold uppercase tracking-widest text-accent">We accept</h5>
          <span className="mb-2.5 mt-1.5 block h-0.5 w-6 rounded bg-accent/60" />
          <div className="flex flex-wrap gap-1.5 text-[11px]">{PAYMENTS.map((p) => <span key={p} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-cream/90">{p}</span>)}</div>
        </div>
      </div>

      {/* trust icons */}
      <div className="border-t border-white/10">
        <div className="container-x grid grid-cols-2 gap-x-4 gap-y-3 py-3.5 md:grid-cols-4">
          {TRUST.map(([icon, t, d]) => (
            <div key={t} className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-accent ring-1 ring-accent/40">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[icon]} /></svg>
              </span>
              <div className="min-w-0">
                <h4 className="font-display text-sm font-semibold leading-tight text-cream">{t}</h4>
                <p className="text-[11px] leading-tight text-white/55">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="bg-black/20 py-2.5 text-center text-[11px] text-white/55">© 2026 Freshly. All rights reserved.</p>
    </footer>
  );
}