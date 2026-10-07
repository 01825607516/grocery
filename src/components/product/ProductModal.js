"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { productHref } from "@/lib/routes";
import Modal from "@/components/ui/Modal";
import Art from "@/components/ui/Art";
import QuantityControl from "./QuantityControl";
import StatusBadge from "./StatusBadge";
import ZoomImage from "./ZoomImage";
import VariantChips from "./VariantChips";
import NotifyButton from "./NotifyButton";
import { useCart } from "@/context/CartContext";
import { useCatalog } from "@/context/CatalogContext";
import { STATUS_LABEL } from "@/lib/data";
import { lineTotal, money, qtyLabel, unitLabel } from "@/lib/format";
import { recommend } from "@/lib/recommend";
import { useAuth } from "@/context/AuthContext";
import { useReviews } from "@/context/ReviewContext";
import { SORTS, arrange, hasBought } from "@/lib/reviews";

export const Stars = ({ value, size = "text-sm" }) => (
  <span className={`inline-flex ${size} leading-none`} aria-label={`${value} out of 5 stars`}>
    {[0, 1, 2, 3, 4].map((i) => <span key={i} className={i < Math.round(value) ? "text-amber-500" : "text-ink/20"}>★</span>)}
  </span>
);

// Write a review: login needed, tap 1-5 stars + optional comment. Posting again updates your earlier review.
function ReviewForm({ p }) {
  const { user, requireLogin } = useAuth();
  const { submit } = useReviews();
  const { orders } = useCart();
  const bought = hasBought(orders, p.id);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => { setStars(0); setText(""); setErr(""); setDone(false); }, [p.id]);

  if (!user) return (
    <div className="mt-3 rounded-xl bg-white p-3 text-center text-sm">
      <p className="text-ink/70">Bought this product? Log in to share your review.</p>
      <button type="button" onClick={() => requireLogin(null, "Please log in to write a review.")} className="btn mt-2 !py-1.5">Log in to review</button>
    </div>
  );
  if (done) return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-primary-light p-3 text-sm">
      <span className="font-semibold text-primary">Thank you! Your review is added.</span>
      <button type="button" onClick={() => setDone(false)} className="text-xs font-semibold text-primary underline">Edit</button>
    </div>
  );
  const send = async () => {
    if (!stars) return setErr("Please tap a star rating first.");
    setBusy(true); setErr("");
    try { await submit(p, { rating: stars, text: text.trim() }); setDone(true); }
    catch (e) { setErr(e?.message || "Could not save your review. Please try again."); }
    setBusy(false);
  };
  const shown = hover || stars;
  return (
    <div className="mt-3 rounded-xl bg-white p-3 text-sm">
      <p className="font-semibold">Write a review</p>
      <p className={`text-xs ${bought ? "font-semibold text-primary" : "text-ink/55"}`}>{bought ? "✓ You bought this product, so your review will show a “Verified purchase” badge." : "Tip: customers who bought this product get a “Verified purchase” badge."}</p>
      <div className="mt-1 flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-pressed={stars === n} onMouseEnter={() => setHover(n)} onClick={() => setStars(n)} className={`text-2xl leading-none transition ${n <= shown ? "text-amber-500" : "text-ink/20"}`}>★</button>
        ))}
        {shown > 0 && <span className="ml-2 text-xs text-ink/55">{["", "Poor", "Fair", "Good", "Very good", "Excellent"][shown]}</span>}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={3} placeholder="How was the quality, freshness, packing? (optional)" aria-label="Your review" className="mt-2 w-full resize-none rounded-lg border border-accent/40 bg-cream/40 px-3 py-2 text-sm outline-none focus:border-primary" />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-red-600">{err}</span>
        <button type="button" disabled={busy} onClick={send} className="btn !py-1.5">{busy ? "Saving…" : "Submit review"}</button>
      </div>
    </div>
  );
}

// "Details" and "Reviews" tabs under the buy buttons
export function DetailsReviews({ p, tab, setTab, rv, related }) {
  const [all, setAll] = useState(false);
  const [sort, setSort] = useState("new");
  const [star, setStar] = useState(0);
  const [voteErr, setVoteErr] = useState("");
  const { user, requireLogin } = useAuth();
  const { vote } = useReviews();
  useEffect(() => { setAll(false); setSort("new"); setStar(0); setVoteErr(""); }, [p.id]);
  const shownList = useMemo(() => arrange(rv.list, sort, star), [rv.list, sort, star]);
  const onVote = async (r) => {
    if (!user) return requireLogin(null, "Please log in to vote on reviews.");
    setVoteErr("");
    try { await vote(p, r); } catch (e) { setVoteErr(e?.message || "Could not save your vote."); }
  };
  const { products, categories } = useCatalog();
  const { openProduct } = useCart();
  const category = categories?.find((c) => c.id === p.category)?.name;
  const sameBrand = useMemo(() => products.filter((x) => x.brand === p.brand && x.id !== p.id).slice(0, 4), [products, p]);
  // extra rows can come from the API as `specs: [["Origin", "Bangladesh"], ...]`
  const rows = [
    ["Brand", p.brand],
    category && ["Category", category],
    p.sub && ["Type", p.sub],
    ["Sold as", p.unit === "kg" ? "By weight (500 g steps)" : "Per piece"],
    ["Availability", p.status ? STATUS_LABEL[p.status] : "In stock"],
    ...(Array.isArray(p.specs) ? p.specs : []),
  ].filter(Boolean);
  const tabBtn = (id, label) => <button type="button" onClick={() => setTab(id)} className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === id ? "border-primary text-primary" : "border-transparent text-ink/60 hover:text-ink"}`}>{label}</button>;
  return (
    <div className="mt-5">
      <div className="flex border-b border-accent/30">{tabBtn("details", "Product details")}{tabBtn("reviews", `Reviews (${rv.count})`)}</div>

      {tab === "details" ? (
        <div className="pt-3 text-sm">
          {p.description && <p className="mb-3 text-ink/80">{p.description}</p>}
          <dl className="overflow-hidden rounded-xl bg-white">
            {rows.map(([k, v], i) => <div key={k} className={`grid grid-cols-[7.5rem_1fr] gap-2 px-3 py-2 ${i % 2 ? "bg-cream/60" : ""}`}><dt className="text-ink/55">{k}</dt><dd className="font-medium">{v}</dd></div>)}
          </dl>
          {sameBrand.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 font-display text-base font-semibold">More from {p.brand}</h4>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {sameBrand.map((b) => (
                  <li key={b.id}>
                    <button type="button" onClick={() => openProduct(b)} className="block w-full rounded-xl bg-white p-2 text-left transition hover:shadow-md">
                      <Art src={b.image} fallback={b.fallback} kind={b.kind} color={b.color} label={b.name} className="aspect-square w-full rounded-lg" />
                      <span className="mt-1 block truncate text-xs font-semibold">{b.name}</span>
                      <span className="text-xs font-bold text-[#e11d2e]">{money(b.price)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {related.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 font-display text-base font-semibold">Frequently bought together</h4>
              <ul className="grid gap-2">
                {related.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-xl bg-white p-2 text-sm">
                    <button type="button" onClick={() => openProduct(r)} aria-label={`View ${r.name}`}><Art src={r.image} fallback={r.fallback} kind={r.kind} color={r.color} label={r.name} className="h-12 w-12 rounded-lg" /></button>
                    <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{r.name}</span><b className="text-primary">{money(r.price)}</b>{unitLabel(r)}</span>
                    <QuantityControl product={r} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="pt-3 text-sm">
          {rv.count > 0 ? (
            <>
              <div className="flex items-center gap-5 rounded-xl bg-white p-3">
                <div className="text-center"><p className="text-4xl font-extrabold leading-none">{rv.rating.toFixed(1)}</p><Stars value={rv.rating} size="text-base" /><p className="mt-1 text-xs text-ink/55">{rv.count} {rv.count > 1 ? "reviews" : "review"}</p></div>
                <div className="min-w-0 flex-1 space-y-1">
                  {rv.dist.map((pct, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs"><span className="w-3 text-right">{5 - i}</span><span className="text-amber-500">★</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-cream"><span className="block h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} /></span><span className="w-8 text-right text-ink/55">{pct}%</span></div>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter reviews by stars">
                  {[0, 5, 4, 3, 2, 1].filter((n) => n === 0 || rv.counts[5 - n] > 0).map((n) => (
                    <button key={n} type="button" aria-pressed={star === n} onClick={() => { setStar(n); setAll(false); }} className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${star === n ? "border-primary bg-primary text-white" : "border-accent/40 bg-white text-ink/70 hover:border-primary"}`}>{n === 0 ? `All (${rv.list.length})` : `${n} ★ (${rv.counts[5 - n]})`}</button>
                  ))}
                </div>
                <select value={sort} onChange={(e) => { setSort(e.target.value); setAll(false); }} aria-label="Sort reviews" className="rounded-lg border border-accent/40 bg-white px-2 py-1 text-xs outline-none focus:border-primary">
                  {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
              <ul className="mt-2 space-y-2">
                {(all ? shownList : shownList.slice(0, 3)).map((r, i) => {
                  const mineR = !!user && r.userId === user.id;
                  return (
                    <li key={r.id ?? i} className="rounded-xl bg-white p-3">
                      <div className="flex items-center justify-between gap-2"><span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"><span className="grid h-7 w-7 place-items-center rounded-full bg-primary-light text-xs font-bold text-primary">{r.name?.[0]}</span><b>{r.name}</b>{mineR && <span className="text-xs text-ink/50">(You)</span>}{r.verified && <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold text-primary">✓ Verified purchase</span>}</span><span className="shrink-0 text-xs text-ink/50">{r.date}</span></div>
                      <div className="mt-1"><Stars value={r.rating} /></div>
                      {r.text && <p className="mt-1 text-ink/80">{r.text}</p>}
                      {r.id && !mineR && <button type="button" aria-pressed={!!r.voted} onClick={() => onVote(r)} className={`mt-2 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${r.voted ? "border-primary bg-primary-light text-primary" : "border-accent/40 text-ink/60 hover:border-primary"}`}>👍 Helpful{r.helpful ? ` (${r.helpful})` : ""}</button>}
                      {r.id && mineR && r.helpful > 0 && <p className="mt-2 text-xs text-ink/50">👍 {r.helpful} found this helpful</p>}
                    </li>
                  );
                })}
              </ul>
              {voteErr && <p className="mt-1 text-xs text-red-600">{voteErr}</p>}
              {shownList.length === 0 && <p className="mt-2 rounded-xl bg-white p-3 text-center text-ink/60">No reviews match this filter.</p>}
              {shownList.length > 3 && !all && <button type="button" onClick={() => setAll(true)} className="mt-2 text-xs font-semibold text-primary underline">Show all {shownList.length} reviews</button>}
            </>
          ) : (
            <p className="rounded-xl bg-white p-4 text-center text-ink/60">No reviews yet. Be the first to review this product.</p>
          )}
          <ReviewForm p={p} />
        </div>
      )}
    </div>
  );
}

// Quick view: opens when a product card is tapped (this is also what counts as "viewed" for Recommendations).
export default function ProductModal() {
  const { quick: p, closeProduct, items, orders, isWished, toggleWish, openProduct, startBuyNow } = useCart();
  const { products } = useCatalog();
  const [tab, setTab] = useState("details");
  useEffect(() => { setTab("details"); }, [p?.id]);
  const related = useMemo(() => (p ? recommend({ products, cartIds: [], viewedIds: [p.id], orders, limit: 3 }).filter((x) => x.id !== p.id).slice(0, 3) : []), [p, products, orders]);
  const { summary, load } = useReviews();
  useEffect(() => { if (p) load(p.id); }, [p?.id, load]); // eslint-disable-line react-hooks/exhaustive-deps
  const rv = p ? summary(p) : null;
  if (!p) return null;
  const qty = items[p.id] || 0;
  const save = Math.round(p.mrp - p.price);
  return (
    <Modal open onClose={closeProduct} title={p.name} z="z-[65]" size="product">
      <div className="grid items-start gap-4 md:grid-cols-[11rem_1fr]">
        <ZoomImage product={p} className="mx-auto w-full max-w-[16rem] md:max-w-none" />
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-ink/60">{p.brand} · {p.sub}</p>
          <button type="button" onClick={() => setTab("reviews")} className="flex w-fit items-center gap-1.5 text-xs text-ink/60 hover:text-ink">{rv.count > 0 ? <><Stars value={rv.rating} /> <b className="text-ink">{rv.rating.toFixed(1)}</b> ({rv.count} {rv.count > 1 ? "reviews" : "review"})</> : <span className="underline">No reviews yet · Write the first</span>}</button>
          <StatusBadge status={p.status} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {save > 0 && <s className="text-base text-ink/45">{money(p.mrp)}</s>}
            <span className="text-3xl font-extrabold leading-tight text-[#e11d2e]">{money(p.price)}<span className="text-sm font-semibold text-ink/60">{unitLabel(p)}</span></span>
          </div>
          {save > 0 && <p className="w-fit rounded-md bg-primary-light px-2.5 py-1 text-xs font-bold text-primary">You save {money(save)} <span className="font-semibold text-primary/70">({p.discount}% off)</span></p>}
          {p.unit === "kg" && <p className="rounded-lg bg-white p-2 text-xs text-ink/70">Sold by weight. Price updates with the weight you pick (500 g steps){qty ? <>: <b>{qtyLabel(p, qty)} = {money(lineTotal(p, qty))}</b></> : "."}</p>}
          <VariantChips p={p} />
          {/* the two ways to buy */}
          <div className="mt-3 grid grid-cols-2 gap-2 [&>div>button]:w-full [&>div>button]:!py-2.5 [&>div>div]:w-full [&>div>div]:justify-between">
            <div><QuantityControl product={p} label="Add to cart" /></div>
            {p.status !== "out" ? <button onClick={() => startBuyNow(p)} className="rounded-lg bg-[#e11d2e] py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#c4121e]">Buy now</button> : <NotifyButton p={p} />}
          </div>
          <button onClick={() => toggleWish(p.id)} className="w-fit rounded-lg border border-accent/50 bg-white px-3 py-1.5 text-sm">{isWished(p.id) ? "♥ Saved" : "♡ Wishlist"}</button>
          <Link href={productHref(p)} onClick={closeProduct} className="w-fit text-xs font-semibold text-primary underline">View full page →</Link>
        </div>
      </div>

      <DetailsReviews p={p} tab={tab} setTab={setTab} rv={rv} related={related} />

    </Modal>
  );
}