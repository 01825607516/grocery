"use client";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { money, lineTotal, stepOf } from "@/lib/format";
import { qtyForPeople } from "@/lib/shopping";

// Search "biryani" -> the dish's ingredients for N people with one "Add all" button. compact = small version for the search dropdown.
export default function RecipeHint({ recipe: r, compact = false }) {
  const { addLines } = useCart();
  const [people, setPeople] = useState(4);
  const ok = r.products.filter((p) => p.status !== "out");
  const lines = ok.map((p) => ({ p, qty: r.amounts ? qtyForPeople(p, r.amounts[p.name], people) : stepOf(p) }));
  const cost = lines.reduce((s, x) => s + lineTotal(x.p, x.qty), 0);
  return (
    <div className={`rounded-xl bg-primary-light/60 ring-1 ring-accent/30 ${compact ? "mx-1 my-1 p-2.5" : "mb-4 p-3.5"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-primary-dark">🍳 {r.name} ingredients</p>
          <p className={`text-xs text-ink/60 ${compact ? "truncate" : ""}`}>{r.products.map((p) => p.name).join(", ")}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-primary">{ok.length}/{r.products.length} available · about {money(cost)}{r.amounts ? ` for ${people}` : ""}</p>
        </div>
        <button onClick={(e) => addLines(lines, e.currentTarget)} disabled={!ok.length} className="btn whitespace-nowrap !px-3 !py-1.5 !text-xs">Add all</button>
      </div>
      {r.amounts && (
        <div className="mt-2 flex items-center gap-2 text-xs text-ink/70">
          <span>👥 People</span>
          <button aria-label="Fewer people" onClick={() => setPeople((n) => Math.max(1, n - 1))} className="h-6 w-6 rounded bg-white ring-1 ring-accent/40">−</button>
          <input type="number" inputMode="numeric" min="1" max="50" value={people} onChange={(e) => setPeople(Math.min(50, Math.max(1, parseInt(e.target.value, 10) || 1)))} onFocus={(e) => e.target.select()} aria-label="Number of people" className="w-12 rounded border border-accent/50 bg-white py-0.5 text-center text-sm text-ink font-bold outline-none focus:border-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
          <button aria-label="More people" onClick={() => setPeople((n) => Math.min(50, n + 1))} className="h-6 w-6 rounded bg-primary text-white">+</button>
        </div>
      )}
    </div>
  );
}
