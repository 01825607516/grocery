 "use client";
import { useEffect, useRef, useState } from "react";

// Open modals are kept in a stack, so Escape closes ONLY the top-most one (e.g. quick view above a category popup).
const stack = [];

// Desktop: centered modal | Mobile: bottom sheet (Module 14). `z` lets a popup sit above another one.
// size: "lg" (default, wide) | "md" = narrow (login etc.) | "product" = medium (product quick view)
export default function Modal({ open, onClose, onBack, title, children, z = "z-[60]", size = "lg", page = false }) {
  const id = useRef({});
  const closeRef = useRef(onClose);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open || page || minimized) return;
    const me = id.current;
    stack.push(me);
    const esc = (e) => { if (e.key === "Escape" && stack[stack.length - 1] === me) closeRef.current?.(); };
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("keydown", esc); const i = stack.indexOf(me); if (i >= 0) stack.splice(i, 1); };
  }, [open, page, minimized]);
  useEffect(() => {
    if (!open) { setMinimized(false); setMaximized(false); }
  }, [open]);
  if (!open) return null;
  if (page) return <div>{children}</div>; // page mode: no overlay, the content sits in the page
  if (minimized) return (
    <div className={`fixed bottom-4 right-4 ${z} flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full bg-primary-dark py-2 pl-4 pr-2 text-white shadow-2xl`}>
      <span className="max-w-48 truncate text-sm font-semibold">{title}</span>
      <button type="button" onClick={() => setMinimized(false)} aria-label={`Restore ${title}`} title="Restore" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 8h12v12H8z"/><path d="M4 16V4h12"/></svg>
      </button>
      <button type="button" onClick={onClose} aria-label={`Close ${title}`} title="Close" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
      </button>
    </div>
  );
  return (
    <div className={`fixed inset-0 ${z} flex bg-black/50 ${maximized ? "" : "items-end md:items-center md:justify-center"}`} onClick={maximized ? undefined : onClose}>
      <div onClick={(e) => e.stopPropagation()} className={maximized ? "flex h-full w-full flex-col bg-cream shadow-2xl" : `flex max-h-[85svh] w-full animate-up flex-col rounded-t-3xl bg-cream shadow-2xl md:max-h-[82vh] md:rounded-3xl ${size === "md" ? "md:max-w-md" : size === "product" ? "md:max-w-2xl" : "md:max-w-4xl"}`}>
        <div className="flex items-center justify-between border-b border-accent/30 px-5 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={onBack || onClose} aria-label="Back" title="Back" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white hover:bg-primary-light"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/><path d="M9 12h12"/></svg></button>
            <h3 className="truncate font-display text-xl font-semibold">{title}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setMinimized(true)} aria-label="Minimize" title="Minimize" className="grid h-8 w-8 place-items-center rounded-full bg-white hover:bg-primary-light"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14"/></svg></button>
            <button type="button" onClick={() => setMaximized((v) => !v)} aria-label={maximized ? "Restore size" : "Maximize"} title={maximized ? "Restore size" : "Maximize"} className="grid h-8 w-8 place-items-center rounded-full bg-white hover:bg-primary-light">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{maximized ? <><path d="M8 4v4H4"/><path d="M4 8a8 8 0 0 1 13.7-5.7L20 4"/><path d="M16 20v-4h4"/><path d="M20 16a8 8 0 0 1-13.7 5.7L4 20"/></> : <path d="M4 4h16v16H4z"/>}</svg>
            </button>
            <button type="button" onClick={onClose} aria-label="Close" title="Close" className="grid h-8 w-8 place-items-center rounded-full bg-white hover:bg-primary-light"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M14 6L6 14" /></svg></button>
          </div>
        </div>
        <div className="overflow-y-auto p-4 md:p-5">{children}</div>
      </div>
    </div>
  );
}
