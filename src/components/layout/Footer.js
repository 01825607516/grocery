 "use client";
import Link from "next/link";
import { useCatalog } from "@/context/CatalogContext";
import { useI18n } from "@/context/I18nContext";

const TRUST = [["truck", "Fastest Delivery", "Delivery to your door step"], ["phone", "24x7 Service", "Reach us when needed"], ["check", "Verified Brands", "Guaranteed products"], ["shield", "100% Assurance", "We stand by every order"]];
const ICONS = {"truck": "M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z", "phone": "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z", "check": "M12 3l2.4 2 3.1-.3.9 3 2.6 1.7-1 3 1 3-2.6 1.7-.9 3-3.1-.3L12 21l-2.4-2-3.1.3-.9-3L3 14.6l1-3-1-3L5.6 7l.9-3 3.1.3zM8.5 12l2.5 2.5 4.5-5", "shield": "M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6zM8.5 12l2.5 2.5 4.5-5"};
// Every footer link opens its own page (same pages the old grid "Pages" menu listed).
const COLS = [
  { title: "Customer support", links: [["/help-center", "Help Center"], ["/faq", "FAQ"], ["/contact", "Contact"], ["/delivery-information", "Delivery Information"], ["/return-policy", "Return & Refund"]] },
  { title: "Company", links: [["/about", "About"], ["/careers", "Careers"], ["/privacy", "Privacy Policy"], ["/terms", "Terms & Conditions"]] },
];

// Social links show the platform's logo (not its name). Unknown platforms get a plain link icon.
function socialIcon(platform) {
  const p = String(platform || "").toLowerCase();
  if (p.includes("face")) return <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />;
  if (p.includes("insta")) return <><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4z" /><path d="M17.5 6.5h.01" /></>;
  if (p.includes("youtu")) return <><path d="M22.5 6.4a2.8 2.8 0 0 0-2-2C18.9 4 12 4 12 4s-6.9 0-8.6.4a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1 11.8a29 29 0 0 0 .4 5.3 2.8 2.8 0 0 0 2 2c1.7.4 8.6.4 8.6.4s6.9 0 8.6-.4a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .4-5.3 29 29 0 0 0-.5-5.4z" /><path d="M9.75 15 15.5 11.75 9.75 8.5z" /></>;
  if (p.includes("linked")) return <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></>;
  if (p.includes("twitter") || p === "x" || p.startsWith("x ")) return <path d="M4 4l16 16M20 4 4 20" />;
  if (p.includes("tiktok")) return <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>;
  if (p.includes("whats")) return <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />;
  return <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></>;
}

export default function Footer() {
  const { siteContent = {}, support = {}, footerContent = {}, socialLinks = [], payments = [] } = useCatalog() || {};
  const { lang } = useI18n();
  const brandName = (lang === "bn" ? siteContent.brand_name_bn : siteContent.brand_name_en) || siteContent.brand_name || "Freshly";
  const phone = support.phone || siteContent.phone || "0949324782";
  const phoneLabel = support.phone_label || (support.phone || siteContent.phone ? phone : "09 4932 4782");
  const description = footerContent.brand_description || "Fresh groceries delivered to your door step, anywhere in Bangladesh.";
  const copyright = footerContent.copyright || `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`;
  return (
    <footer className="border-t-2 border-accent bg-primary-dark text-white/80">
      {/* main: brand, links, payments (compact) */}
      <div className="container-x grid grid-cols-2 gap-x-6 gap-y-6 py-7 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div className="col-span-2 md:col-span-1">
          {siteContent.footer_logo_url ? <img src={siteContent.footer_logo_url} alt={brandName} className="h-10 max-w-48 object-contain" data-no-translate /> : <p className="font-display text-2xl font-bold leading-none text-accent" data-no-translate>{brandName}<span className="text-cream">.</span></p>}
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed">{description}</p>
          <a href={`tel:${String(phone).replace(/[^\d+]/g, "")}`} className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] font-semibold text-cream ring-1 ring-accent/40 transition hover:bg-accent hover:text-primary-dark">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS.phone} /></svg>
            {phoneLabel}
          </a>
          {support.email && <a href={`mailto:${support.email}`} className="mt-2 block text-[13px] hover:text-accent">{support.email}</a>}
          {!!socialLinks.length && <nav aria-label="Social links" className="mt-3 flex flex-wrap gap-2">{socialLinks.filter((item) => item?.url).map((item) => (
            <a key={`${item.platform}-${item.url}`} href={item.url} target="_blank" rel="noreferrer" aria-label={item.name || item.platform} title={item.name || item.platform} data-no-translate
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-cream ring-1 ring-accent/40 transition hover:bg-accent hover:text-primary-dark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{socialIcon(item.platform)}</svg>
            </a>
          ))}</nav>}
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
          <div className="flex flex-wrap gap-1.5 text-[11px]">{payments.map((p) => <span key={p} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-cream/90">{p}</span>)}</div>
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

      <p className="bg-black/20 py-2.5 text-center text-[11px] text-white/55">{copyright}</p>
    </footer>
  );
}
