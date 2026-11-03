"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCatalog } from "@/context/CatalogContext";
import { adminApi } from "@/lib/adminSession";
import { Badge, Btn, Card, Empty, Field, ImageField, Input, Loading, Select, Toggle, dateFmt, isHttpUrl, toLocalInput, uploadAsset, useAction } from "../ui";

const blank = () => ({ title_en: "", title_bn: "", image_url: "", target_url: "", cats: [], off: "", tag: "", bg: "#d6c5a2", starts_at: "", ends_at: "", status: true, sort_order: 0, product_ids: [], discount_type: "percentage", discount_value: "" });

const parseContent = (c) => { try { const x = JSON.parse(c || ""); return x && typeof x === "object" ? x : {}; } catch { return {}; } };
const parseIds = (v) => { try { const a = typeof v === "string" ? JSON.parse(v) : v; return Array.isArray(a) ? a.map(Number).filter(Boolean) : []; } catch { return []; } };

function stateOf(r) {
  if (Number(r.status) === 0) return ["Hidden", "gray"];
  const now = Date.now(), s = r.starts_at ? Date.parse(String(r.starts_at).replace(" ", "T")) : 0, e = r.ends_at ? Date.parse(String(r.ends_at).replace(" ", "T")) : 0;
  if (s && s > now) return ["Upcoming", "blue"];
  if (e && e < now) return ["Ended", "amber"];
  return ["Live", "green"];
}

export default function Campaigns() {
  const { categories: CATEGORIES = [] } = useCatalog() || {}; // the shop's real categories (database), not a built-in list
  const [rows, setRows] = useState(null);
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [extra, setExtra] = useState({});   // unknown keys of the saved "content" JSON, kept as they are
  const [f, setF] = useState(blank);
  const [loadErr, setLoadErr] = useState("");
  const act = useAction();

  const load = useCallback(async () => {
    setLoadErr("");
    try { setRows(((await adminApi("/campaigns"))?.campaigns || []).filter((r) => r.type !== "theme")); }
    catch (e) { setLoadErr(e.message); setRows([]); }
  }, []);
  useEffect(() => { load(); adminApi("/storefront/products").then((d) => setProducts(d?.products || [])).catch(() => {}); }, [load]);

  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const toggleCat = (id) => setF((o) => ({ ...o, cats: o.cats.includes(id) ? o.cats.filter((c) => c !== id) : [...o.cats, id] }));
  const toggleProduct = (id) => setF((o) => ({ ...o, product_ids: o.product_ids.includes(id) ? o.product_ids.filter((c) => c !== id) : [...o.product_ids, id] }));
  const shown = useMemo(() => products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 60), [products, q]);

  const reset = () => { setEditing(null); setExtra({}); setF(blank()); };
  const edit = (r) => {
    const c = parseContent(r.content);
    const { cats, off, tag, bg, ...rest } = c;
    setExtra(rest); setEditing(r.id);
    setF({ ...blank(), title_en: r.title_en || r.title || "", title_bn: r.title_bn || "", image_url: r.image_url || "", target_url: r.target_url || "", cats: Array.isArray(cats) ? cats : [], off: off ?? "", tag: tag || "", bg: bg || "#d6c5a2", starts_at: toLocalInput(r.starts_at), ends_at: toLocalInput(r.ends_at), status: Number(r.status) !== 0, sort_order: r.sort_order || 0, product_ids: parseIds(r.product_ids), discount_type: r.discount_type || "percentage", discount_value: r.discount_value ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!f.title_en.trim()) return act.setErr("Give the offer a title (English).");
    if (f.image_url && !isHttpUrl(f.image_url)) return act.setErr("The banner image must be a full web address starting with https:// (or use Upload).");
    if (f.starts_at && f.ends_at && f.ends_at < f.starts_at) return act.setErr("The end time must be after the start time.");
    if (f.product_ids.length) {
      const v = Number(f.discount_value);
      if (!(v > 0)) return act.setErr("Enter the discount for the selected products.");
      if (f.discount_type === "percentage" && v > 100) return act.setErr("A percentage discount cannot be more than 100.");
    }
    const content = { ...extra, cats: f.cats, tag: f.tag.trim() || undefined, bg: f.bg || undefined, off: f.off === "" ? undefined : Number(f.off) };
    const body = {
      type: "offer", placement: "hero", title: f.title_en.trim(), title_en: f.title_en.trim(), title_bn: f.title_bn.trim() || null,
      content: JSON.stringify(content), image_url: f.image_url.trim() || null, target_url: f.target_url.trim() || null,
      starts_at: f.starts_at || null, ends_at: f.ends_at || null, status: !!f.status, sort_order: Number(f.sort_order) || 0,
      product_ids: f.product_ids,
      ...(f.product_ids.length ? { discount_type: f.discount_type, discount_value: Number(f.discount_value) } : { discount_type: null, discount_value: null }),
    };
    act.run(async () => {
      await adminApi(editing ? `/campaigns/${editing}` : "/campaigns", { method: editing ? "PUT" : "POST", json: body });
      reset(); await load();
    }, editing ? "Offer updated." : "Offer created.");
  };
  const remove = (r) => { if (window.confirm(`Delete “${r.title_en || r.title}”?`)) act.run(async () => { await adminApi(`/campaigns/${r.id}`, { method: "DELETE" }); if (editing === r.id) reset(); await load(); }, "Offer deleted."); };
  const quick = (r, status) => act.run(async () => { await adminApi(`/campaigns/${r.id}`, { method: "PUT", json: { status } }); await load(); }, status ? "Offer is visible again." : "Offer hidden.");

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,.9fr)]">
      <form onSubmit={submit}>
        <Card title={editing ? "Edit offer" : "New offer"} description="Offers appear in the website's offer banners. Leave the dates empty to show it right away.">
          {act.box}
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title (English) *"><Input maxLength={191} value={f.title_en} onChange={set("title_en")} /></Field>
              <Field label="Title (Bangla)"><Input maxLength={191} value={f.title_bn} onChange={set("title_bn")} /></Field>
            </div>
            <ImageField label="Banner image" value={f.image_url} onChange={(v) => setF((o) => ({ ...o, image_url: v }))} upload={(file) => uploadAsset("hero_image", file)} hint="Wide photo. Without an image the background colour below is used." previewClass="h-24" />
            <div>
              <p className="text-sm font-medium text-ink/80">Categories on offer</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {!CATEGORIES.length && <span className="text-xs text-ink/50">Loading the shop's categories…</span>}{CATEGORIES.map((c) => <button key={c.id} type="button" onClick={() => toggleCat(c.id)} aria-pressed={f.cats.includes(c.id)} className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${f.cats.includes(c.id) ? "border-primary bg-primary text-white" : "border-accent/50 text-ink/70 hover:bg-primary-light"}`}>{c.name}</button>)}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="“Up to” % off (label)"><Input type="number" min="0" max="100" value={f.off} onChange={set("off")} /></Field>
              <Field label="Tag"><Input maxLength={30} placeholder="BIG SALE" value={f.tag} onChange={set("tag")} /></Field>
              <Field label="Background colour"><input type="color" value={/^#[0-9a-f]{6}$/i.test(f.bg) ? f.bg : "#d6c5a2"} onChange={set("bg")} className="h-[42px] w-full cursor-pointer rounded-lg border border-accent/40 bg-white p-1" /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts"><Input type="datetime-local" value={f.starts_at} onChange={set("starts_at")} /></Field>
              <Field label="Ends"><Input type="datetime-local" value={f.ends_at} onChange={set("ends_at")} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Link when clicked (optional)"><Input placeholder="https://…" value={f.target_url} onChange={set("target_url")} /></Field>
              <Field label="Order (small number shows first)"><Input type="number" min="0" max="65535" value={f.sort_order} onChange={set("sort_order")} /></Field>
            </div>

            <fieldset className="rounded-xl border border-accent/30 p-4">
              <legend className="px-1 font-display text-sm font-semibold text-primary-dark">Discount on chosen products (optional)</legend>
              <p className="mb-3 text-xs text-ink/60">Pick products to give them a real discount while this offer runs. {f.product_ids.length ? `${f.product_ids.length} selected.` : "None selected: the offer is only a banner."}</p>
              {f.product_ids.length > 0 && (
                <div className="mb-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Discount type"><Select value={f.discount_type} onChange={set("discount_type")}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed amount (৳)</option></Select></Field>
                  <Field label="Discount value"><Input type="number" min="0.01" step="0.01" value={f.discount_value} onChange={set("discount_value")} /></Field>
                </div>
              )}
              <Input placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
              <ul className="mt-2 max-h-52 divide-y divide-accent/20 overflow-auto rounded-lg border border-accent/30">
                {!products.length && <li className="px-3 py-3 text-xs text-ink/60">No website products found.</li>}
                {shown.map((p) => (
                  <li key={p.id}><label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-primary-light"><input type="checkbox" checked={f.product_ids.includes(p.id)} onChange={() => toggleProduct(p.id)} /><span className="min-w-0 flex-1 truncate">{p.name}</span><span className="text-xs text-ink/60">৳{p.shop_price}</span></label></li>
                ))}
              </ul>
            </fieldset>

            <Toggle checked={f.status} onChange={(v) => setF((o) => ({ ...o, status: v }))} label="Active" hint="Turn off to hide the offer without deleting it." />
            <div className="flex gap-2">
              <Btn type="submit" disabled={act.busy}>{act.busy ? "Saving…" : editing ? "Save offer" : "Create offer"}</Btn>
              {editing && <Btn variant="secondary" onClick={reset}>Cancel</Btn>}
            </div>
          </div>
        </Card>
      </form>

      <Card title="Saved offers" className="self-start">
        {loadErr && <p role="alert" className="mb-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{loadErr}</p>}
        {!rows ? <Loading /> : !rows.length ? <Empty>No offers yet. Create the first one on the left.</Empty> : (
          <ul className="divide-y divide-accent/25">
            {rows.map((r) => { const [label, tone] = stateOf(r); return (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{r.title_en || r.title} <Badge tone={tone}>{label}</Badge></p>
                  <p className="mt-0.5 text-xs text-ink/60">{r.starts_at ? dateFmt(r.starts_at) : "Starts now"}{r.ends_at ? ` → ${dateFmt(r.ends_at)}` : ""}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Btn variant="secondary" className="!px-3 !py-1.5 !text-xs" onClick={() => edit(r)}>Edit</Btn>
                  <Btn variant="secondary" className="!px-3 !py-1.5 !text-xs" disabled={act.busy} onClick={() => quick(r, Number(r.status) === 0)}>{Number(r.status) === 0 ? "Show" : "Hide"}</Btn>
                  <Btn variant="danger" onClick={() => remove(r)}>Delete</Btn>
                </div>
              </li>
            ); })}
          </ul>
        )}
      </Card>
    </div>
  );
}
