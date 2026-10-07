"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PAGE_GROUPS } from "@/lib/routes";

// The 3x3 grid icon in the header. Click it and every page of the site is listed (grouped).
export default function PagesMenu() {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const path = usePathname();

  useEffect(() => { setOpen(false); }, [path]); // close after navigating
  useEffect(() => {
    if (!open) return;
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    window.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); window.removeEventListener("keydown", esc); };
  }, [open]);

  const link = (href, label) => (
    <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={`rounded-lg px-2.5 py-1.5 text-sm transition hover:bg-primary-light ${path === href ? "bg-primary-light font-semibold text-primary" : "text-ink/80"}`}>{label}</Link>
  );

  return (
    <div ref={box} className="relative shrink-0">
      <button onClick={() => setOpen((o) => !o)} aria-label="All pages" aria-expanded={open} aria-haspopup="true" className="relative flex shrink-0 flex-col items-center text-primary">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {[4, 10, 16].flatMap((y) => [4, 10, 16].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" rx="1.2" />))}
        </svg>
        <span className="hidden font-display text-xs italic md:block">Pages</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-3 max-h-[75vh] w-[min(92vw,24rem)] animate-up overflow-y-auto rounded-2xl border border-accent/40 bg-cream p-4 shadow-2xl">
          {PAGE_GROUPS.map((g) => (
            <div key={g.title} className="mb-3">
              <p className="mb-1 font-display text-sm font-semibold uppercase tracking-widest text-accent-dark">{g.title}</p>
              <div className="grid grid-cols-2 gap-x-1">{g.links.map((l) => link(l.href, l.label))}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}