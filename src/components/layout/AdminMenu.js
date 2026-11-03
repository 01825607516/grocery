"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const GRID = "M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z";
const OUT = "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9";

// Extra header button that only exists while an administrator is signed in (same login form as customers).
// Click -> dropdown -> "Website Management" opens the admin panel (/admin).
export default function AdminMenu({ label = "Admin" }) {
  const { admin, adminMenuOpen: open, setAdminMenuOpen: setOpen, adminLogout } = useAuth();
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const down = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const key = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open, setOpen]);

  if (!admin) return null;
  return (
    <div ref={box} className="relative shrink-0" data-no-translate>
      <button type="button" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-label="Administrator menu"
        className="relative flex flex-col items-center text-primary">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={GRID} /></svg>
        <span className="hidden font-display text-xs italic md:block lg:hidden xl:block">{label}</span>
        <i className="absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-cream" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="fixed inset-x-3 top-[var(--header-h,7rem)] z-50 mt-1 animate-up overflow-hidden rounded-2xl bg-white text-left shadow-2xl ring-1 ring-accent/50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-72">
          <div className="border-b border-accent/30 bg-primary-light px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[.14em] text-primary">Administrator</p>
            <p className="mt-0.5 truncate font-display text-base font-semibold text-ink">{admin.name}</p>
            {admin.email && <p className="truncate text-xs text-ink/60">{admin.email}</p>}
          </div>
          <Link href="/admin" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-primary-light">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={GRID} /></svg></span>
            <span>Website Management<small className="block text-xs font-normal text-ink/60">Orders, offers, delivery, content &amp; settings</small></span>
          </Link>
          <button type="button" role="menuitem" onClick={adminLogout} className="flex w-full items-center gap-3 border-t border-accent/30 px-4 py-3 text-left text-sm text-ink/80 transition hover:bg-primary-light">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="ml-2.5 shrink-0" aria-hidden="true"><path d={OUT} /></svg>
            Log out of admin
          </button>
        </div>
      )}
    </div>
  );
}
