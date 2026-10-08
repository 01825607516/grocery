"use client";
import { useRef, useState } from "react";

const IDEAS = [
  { label: "Daily basics", text: "chal, dal, peyaj, alu, tel" },
  { label: "Biryani night", text: "chal, murgi, peyaj, ghee, doi" },
  { label: "Breakfast", text: "dim, pauruti, dudh, makhon" },
];

// Hero "Smart grocery list" box. The visitor sees at once what it does:
//   type your list -> we find the products -> one tap fills the cart.
// Button / Enter opens the Smart list popup with the products already matched.
export default function HeroListBox() {
  const [text, setText] = useState("");
  const ref = useRef(null);
  const go = (e) => { e?.preventDefault(); window.dispatchEvent(new CustomEvent("open-smart-list", { detail: { text: text.trim() } })); };

  return (
    <form onSubmit={go} className="rounded-2xl border border-accent/50 bg-white/10 p-3 text-left shadow-2xl backdrop-blur-xl md:p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-lg text-primary-dark" aria-hidden="true">📝</span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold leading-tight text-white md:text-lg">Got a shopping list? Just type it.</h2>
          <p className="mt-0.5 text-xs text-white/80 md:text-[13px] [@media(max-height:760px)]:hidden">We find the products and fill your cart in one tap. Write in English, Bangla or Banglish.</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-white p-1.5">
        <input ref={ref} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. chal 2kg, murgi, peyaj, dim, tel" aria-label="Your grocery list, items separated by commas" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/40" />
        <button type="submit" className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-dark md:px-5">Fill my cart →</button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-white/80 [@media(max-height:760px)]:hidden">
        <span>Try:</span>
        {IDEAS.map((i) => <button key={i.label} type="button" onClick={() => { setText(i.text); ref.current?.focus(); }} className="rounded-full bg-white/15 px-2.5 py-1 font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/30">{i.label}</button>)}
        <span className="ml-auto hidden text-white/70 md:inline">① Type  ② We match  ③ Add all to cart</span>
      </div>
    </form>
  );
}
