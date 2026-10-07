 "use client";
import { useEffect, useRef } from "react";

// Open modals are kept in a stack, so Escape closes ONLY the top-most one (e.g. quick view above a category popup).
const stack = [];

// Desktop: centered modal | Mobile: bottom sheet (Module 14). `z` lets a popup sit above another one.
// size: "lg" (default, wide) | "md" = narrow (login etc.) | "product" = medium (product quick view)
export default function Modal({ open, onClose, title, children, z = "z-[60]", size = "lg", page = false }) {
  const id = useRef({});
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open || page) return;
    const me = id.current;
    stack.push(me);
    const esc = (e) => { if (e.key === "Escape" && stack[stack.length - 1] === me) closeRef.current?.(); };
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("keydown", esc); const i = stack.indexOf(me); if (i >= 0) stack.splice(i, 1); };
  }, [open]);
  if (!open) return null;
  if (page) return <div>{children}</div>; // page mode: no overlay, the content sits in the page
  return (
    <div className={`fixed inset-0 ${z} flex items-end bg-black/50 md:items-center md:justify-center`} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`flex max-h-[85svh] md:max-h-[82vh] w-full animate-up flex-col rounded-t-3xl bg-cream shadow-2xl md:rounded-3xl ${size === "md" ? "md:max-w-md" : size === "product" ? "md:max-w-2xl" : "md:max-w-4xl"}`}>
        <div className="flex items-center justify-between border-b border-accent/30 px-5 py-3">
          <h3 className="font-display text-xl font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full bg-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M14 6L6 14" /></svg></button>
        </div>
        <div className="overflow-y-auto p-4 md:p-5">{children}</div>
      </div>
    </div>
  );
}