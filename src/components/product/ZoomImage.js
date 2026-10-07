"use client";
import { useState } from "react";
import Art from "@/components/ui/Art";

// Product photo with hover zoom: move the cursor over it and the photo magnifies under the cursor (like Daraz / Amazon).
export default function ZoomImage({ product: p, scale = 2.3, className = "" }) {
  const [pos, setPos] = useState(null); // cursor position in % while it is over the photo
  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)) });
  };
  return (
    <div onMouseMove={move} onMouseLeave={() => setPos(null)} className={`relative overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 md:cursor-zoom-in ${className}`}>
      <div className="transition-transform duration-150 ease-out will-change-transform" style={{ transform: pos ? `scale(${scale})` : "none", transformOrigin: pos ? `${pos.x}% ${pos.y}%` : "50% 50%" }}>
        <Art src={p.image} fallback={p.fallback} kind={p.kind} color={p.color} label={p.name} className="aspect-square w-full" />
      </div>
      {!pos && <span aria-hidden="true" className="pointer-events-none absolute bottom-2 right-2 hidden items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium text-white md:flex"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5M11 8v6M8 11h6" /></svg>Hover to zoom</span>}
    </div>
  );
}