"use client";
import { useCart } from "@/context/CartContext";
import { money, unitLabel } from "@/lib/format";
import Art from "@/components/ui/Art";
import { useReviews } from "@/context/ReviewContext";
import StatusBadge from "./StatusBadge";

const RED = "#e11d2e"; // offer / price colour

// Round-photo card: the photo sits in a white circle that pops out above the card, then name, big red price and the offer.
// There are no buttons on the card: tapping it opens the product popup, where "Add to cart" and "Buy now" are.
export default function ProductCard({ product: p, classic = false, rank, compact = false }) {
  const { isWished, toggleWish, openProduct } = useCart();
  const rv = useReviews().summary(p);
  const save = Math.round(p.mrp - p.price); // taka saved (per kg for weight items)
  const offer = save > 0;
  return (
    <article onClick={() => openProduct(p)} className={`group relative flex cursor-pointer flex-col items-center rounded-3xl border-b-4 border-accent bg-white px-3 pb-4 text-center ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${compact ? "mt-10 pt-[3.3rem] md:mt-11 md:pt-[3.6rem]" : "mt-12 pt-[3.9rem] md:mt-14 md:pt-[4.6rem]"} ${classic ? "shadow-lg" : "shadow-md"} ${p.status === "out" ? "opacity-70" : ""}`}>
      {/* RED corner ribbon: how many taka you save */}
      {offer && (
        <span aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-0 h-[5.5rem] w-[5.5rem] overflow-hidden rounded-tl-3xl">
          <span className={`absolute left-[-2.1rem] top-[1.05rem] w-[7.5rem] -rotate-45 bg-gradient-to-r from-[#b3121b] via-[#e11d2e] to-[#b3121b] py-[3px] text-center font-extrabold leading-tight text-white shadow-md ${money(save).length > 5 ? "text-[10px]" : "text-[11.5px]"}`}>{money(save)} OFF</span>
        </span>
      )}

      <button type="button" aria-label={`${isWished(p.id) ? "Remove from" : "Add to"} wishlist`} onClick={(e) => { e.stopPropagation(); toggleWish(p.id); }} className="absolute right-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-full bg-white shadow ring-1 ring-black/5"><svg width="17" height="17" viewBox="0 0 24 24" strokeWidth="2" strokeLinejoin="round" className={isWished(p.id) ? "fill-red-500 stroke-red-500" : "fill-none stroke-ink/60"} aria-hidden="true"><path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6c-2.5 4.4-9.5 9-9.5 9z" /></svg></button>

      {/* the round photo, half above the card, in a thick white ring so it blends into the card */}
      <button type="button" aria-label={`View ${p.name}`} className={`absolute left-1/2 top-0 z-10 overflow-hidden rounded-full border-[6px] border-white bg-white shadow-lg -translate-x-1/2 -translate-y-1/2 ${compact ? "h-[5.25rem] w-[5.25rem] md:h-[5.75rem] md:w-[5.75rem]" : "h-[6.5rem] w-[6.5rem] md:h-[7.75rem] md:w-[7.75rem]"}`}>
        <Art round src={p.image} fallback={p.fallback} kind={p.kind} color={p.color} label={p.name} className="h-full w-full transition duration-500 group-hover:scale-110" />
      </button>

      <h4 className={`line-clamp-2 min-h-[2.4rem] leading-tight ${classic ? "font-display text-[16px] font-semibold" : "text-[14px] font-semibold"}`}>{p.name}</h4>
      <p className={`text-[11px] text-ink/55 ${classic ? "uppercase tracking-widest" : ""}`}>{p.brand}</p>
      <p className="mt-0.5 text-[11px] leading-none text-ink/55" aria-label={rv.count ? `${rv.rating.toFixed(1)} out of 5 stars, ${rv.count} reviews` : "No reviews yet"}>{rv.count ? <><span className="text-amber-500">★</span> <b className="text-ink">{rv.rating.toFixed(1)}</b> ({rv.count})</> : "No reviews yet"}</p>

      <p className="mt-1.5 flex flex-wrap items-baseline justify-center gap-x-2">
        {offer && <s className="text-[13px] text-ink/45">{money(p.mrp)}</s>}
        <b className={`${compact ? "text-[20px]" : "text-[24px]"} font-extrabold leading-none`} style={{ color: RED }}>{money(p.price)}</b>
        {unitLabel(p) && <span className="text-xs font-semibold text-ink/60">{unitLabel(p)}</span>}
      </p>
      {offer && <p className="mt-2 rounded-md bg-primary-light px-2.5 py-0.5 text-[12px] font-bold text-primary">You save {money(save)} <span className="font-semibold text-primary/70">({p.discount}% off)</span></p>}
      {p.status && <div className="mt-2"><StatusBadge status={p.status} /></div>}

      {classic && rank && <span className="absolute -bottom-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-coffee px-3 py-0.5 font-display text-[11px] italic tracking-wide text-cream ring-1 ring-accent">No. {rank}</span>}
    </article>
  );
}