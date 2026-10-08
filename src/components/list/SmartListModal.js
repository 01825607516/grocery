"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import Art from "@/components/ui/Art";
import { useCart } from "@/context/CartContext";
import { useCatalog } from "@/context/CatalogContext";
import { money, qtyLabel } from "@/lib/format";
import { parseList, fitBudget, listTotal, qtyFor, rowTotal } from "@/lib/shopping";

const EXAMPLE = "chal, murgi, peyaj, biryani masala, ghee, doi";

// "Smart Grocery List": type or paste a list in English, Bangla or Banglish -> products -> one tap into the cart.
// Open it from anywhere with:  window.dispatchEvent(new CustomEvent("open-smart-list"))
export default function SmartListModal() {
  const { products } = useCatalog();
  const { addLines, cfg } = useCart();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [rows, setRows] = useState(null);
  const [budget, setBudget] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    // text sent from the Hero list box -> open with the products already matched
    const fn = (e) => {
      setOpen(true);
      const t = e.detail?.text;
      if (t) { setText(t); setRows(parseList(t, products)); setNote(""); }
    };
    window.addEventListener("open-smart-list", fn);
    return () => window.removeEventListener("open-smart-list", fn);
  }, [products]);

  const close = () => { setOpen(false); };
  const match = (t = text) => { setRows(parseList(t, products)); setNote(""); };
  const total = useMemo(() => (rows ? listTotal(rows) : 0), [rows]);
  const missing = rows ? rows.filter((r) => !r.pick) : [];
  const chosen = rows ? rows.filter((r) => r.on && r.pick) : [];
  const b = parseInt(budget.replace(/\D/g, ""), 10) || 0;

  const patch = (key, fn) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...fn(r) } : r)));
  const swap = (r, id) => { const c = r.cands.find((x) => String(x.id) === id); patch(r.key, () => ({ pick: c, qty: qtyFor(c, r.num, r.unit), swapped: false, dropped: false })); };
  const fit = () => {
    if (!b) return;
    const before = listTotal(rows);
    const next = fitBudget(rows.map((r) => ({ ...r, on: r.pick ? (r.dropped ? true : r.on) : false })), b);
    setRows(next);
    const dropped = next.filter((r) => r.dropped).length, swapped = next.filter((r) => r.swapped).length;
    const t = listTotal(next);
    setNote(before <= b ? `Already within your budget. ${money(b - before)} left.` : `${money(t)} of ${money(b)}${swapped ? ` · ${swapped} item${swapped > 1 ? "s" : ""} swapped to cheaper` : ""}${dropped ? ` · ${dropped} item${dropped > 1 ? "s" : ""} unticked to fit` : ""}`);
  };
  const addAll = (e) => { addLines(chosen.map((r) => ({ p: r.pick, qty: r.qty })), e.currentTarget); close(); };

  return (
    <Modal open={open} onClose={close} title="Smart grocery list">
      <p className="text-sm text-ink/70">Type or paste what you need, in English, Bangla or Banglish. We find the products. Add a quantity if you like: <i>chal, murgi 1kg, peyaj 500gm</i>.</p>
      <textarea value={text} onChange={(e) => { setText(e.target.value); setRows(null); }} rows={3} placeholder={EXAMPLE} aria-label="Your grocery list" className="mt-3 w-full rounded-xl border border-accent/50 bg-white px-3 py-2 text-sm outline-none focus:border-primary" />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button onClick={() => match()} disabled={!text.trim()} className="btn !py-1.5">Find my products</button>
        <button onClick={() => { setText(EXAMPLE); match(EXAMPLE); }} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-primary ring-1 ring-accent/40 hover:bg-primary-light">Try an example</button>
      </div>

      {rows && (
        <div className="mt-4">
          {rows.length === 0 ? <p className="py-6 text-center text-sm text-ink/60">Nothing to match yet. Add a few items separated by commas.</p> : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-white p-2.5 text-sm ring-1 ring-accent/30">
                <span className="font-semibold">💰 Budget</span>
                <input value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="e.g. 1000" aria-label="Budget in taka" className="w-24 rounded-lg border border-accent/50 px-2 py-1 outline-none focus:border-primary" />
                <button onClick={fit} disabled={!b} className="btn !px-3 !py-1">Fit my budget</button>
                {note && <span className="w-full text-xs font-semibold text-primary">{note}</span>}
              </div>
              <p className="mb-2 text-xs text-ink/60">Here is what we found. Untick anything you don't want, change a product from its dropdown, then tap <b>Add all to cart</b>.</p>
              <ul className="space-y-1.5">
                {rows.map((r) => (
                  <li key={r.key} className={`flex items-center gap-2.5 rounded-xl bg-white p-2 ring-1 ring-accent/20 ${r.pick && !r.on ? "opacity-50" : ""}`}>
                    {r.pick ? (
                      <>
                        <input type="checkbox" checked={r.on} onChange={(e) => patch(r.key, () => ({ on: e.target.checked, dropped: false }))} aria-label={`Include ${r.pick.name}`} />
                        <Art src={r.pick.image} fallback={r.pick.fallback} kind={r.pick.kind} color={r.pick.color} label="" className="h-10 w-10 shrink-0 rounded-lg" />
                        <div className="min-w-0 flex-1">
                          {r.cands.length > 1 ? (
                            <select value={r.pick.id} onChange={(e) => swap(r, e.target.value)} aria-label={`Choose product for ${r.raw}`} className="w-full truncate rounded bg-transparent text-sm font-semibold outline-none">
                              {r.cands.map((c) => <option key={c.id} value={c.id}>{c.name} · {money(c.price)}{c.unit === "kg" ? "/kg" : ""}</option>)}
                            </select>
                          ) : <p className="truncate text-sm font-semibold">{r.pick.name}</p>}
                          <p className="text-[11px] text-ink/50">“{r.raw}” · {qtyLabel(r.pick, r.qty)}{r.swapped ? " · cheaper pick" : ""}{r.dropped ? " · removed to fit budget" : ""}</p>
                        </div>
                        <b className="whitespace-nowrap text-sm text-primary">{money(rowTotal({ ...r, on: true }))}</b>
                      </>
                    ) : (
                      <p className="px-1 py-1 text-sm text-ink/60">“{r.raw}”: not found. <Link href={`/shop?q=${encodeURIComponent(r.raw)}`} onClick={close} className="font-semibold text-primary underline">Search the shop</Link></p>
                    )}
                  </li>
                ))}
              </ul>
              {missing.length > 0 && <p className="mt-2 text-xs text-ink/50">{missing.length} item{missing.length > 1 ? "s" : ""} not found. The rest are ready below.</p>}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-accent/25 pt-3">
                <div className="text-sm">
                  <b>{chosen.length}</b> item{chosen.length === 1 ? "" : "s"} · <b className="text-primary">{money(total)}</b>
                  <p className="text-[11px] text-ink/50">{total >= cfg.freeDeliveryLimit ? "Free delivery (Standard)" : `${money(cfg.freeDeliveryLimit - total)} more for free delivery`}</p>
                </div>
                <button onClick={addAll} disabled={!chosen.length} className="btn">Add all to cart</button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
