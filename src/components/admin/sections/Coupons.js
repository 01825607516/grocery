"use client";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/adminSession";
import { Badge, Btn, Card, Empty, Field, Input, Loading, Pager, Select, Toggle, takaFmt, useAction } from "../ui";

const blank = () => ({ code: "", description: "", discount_type: "percent", discount_value: "", minimum_amount: "", maximum_discount: "", usage_limit: "", per_user_limit: "", starts_at: "", ends_at: "", status: true, is_public: true });
const TONE = { active: "green", off: "gray", scheduled: "blue", expired: "amber", used_up: "red" };
const LABEL = { active: "Active", off: "Off", scheduled: "Scheduled", expired: "Expired", used_up: "Used up" };
const day = (v) => (v ? String(v).slice(0, 10) : "");
const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

export default function Coupons() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState(blank);
  const [loadErr, setLoadErr] = useState("");
  const act = useAction();

  const load = useCallback(async () => {
    setLoadErr("");
    try { setData(await adminApi("/coupons", { query: { page, q, status } })); }
    catch (e) { setLoadErr(e.message); setData({ rows: [], pagination: {} }); }
  }, [page, q, status]);
  useEffect(() => { const t = setTimeout(load, q ? 300 : 0); return () => clearTimeout(t); }, [load, q]);

  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const reset = () => { setEditing(null); setF(blank()); };
  const edit = (r) => { setEditing(r.id); setF({ ...blank(), code: r.code, description: r.description || "", discount_type: r.discount_type, discount_value: r.discount_value, minimum_amount: r.minimum_amount ?? "", maximum_discount: r.maximum_discount ?? "", usage_limit: r.usage_limit ?? "", per_user_limit: r.per_user_limit ?? "", starts_at: day(r.starts_at), ends_at: day(r.ends_at), status: Number(r.status) !== 0, is_public: r.is_public === undefined ? true : Number(r.is_public) !== 0 }); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const submit = (e) => {
    e.preventDefault();
    const code = f.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return act.setErr("The code can use letters, numbers, - and _ (3 to 32 characters).");
    const value = Number(f.discount_value);
    if (!(value > 0)) return act.setErr("Enter the discount value.");
    if (f.discount_type === "percent" && value > 100) return act.setErr("A percent coupon cannot be more than 100.");
    if (f.starts_at && f.ends_at && f.ends_at < f.starts_at) return act.setErr("The end date must be on or after the start date.");
    const body = { code, description: f.description.trim() || null, discount_type: f.discount_type, discount_value: value, minimum_amount: num(f.minimum_amount), maximum_discount: f.discount_type === "percent" ? num(f.maximum_discount) : null, usage_limit: num(f.usage_limit), per_user_limit: num(f.per_user_limit), starts_at: f.starts_at || null, ends_at: f.ends_at || null, status: !!f.status, is_public: !!f.is_public };
    act.run(async () => { await adminApi(editing ? `/coupons/${editing}` : "/coupons", { method: editing ? "PUT" : "POST", json: body }); reset(); await load(); }, editing ? "Coupon saved." : "Coupon created.", { storefront: false });
  };
  const remove = (r) => { if (window.confirm(`Delete coupon ${r.code}?`)) act.run(async () => { await adminApi(`/coupons/${r.id}`, { method: "DELETE" }); await load(); }, "Coupon deleted.", { storefront: false }); };

  const rows = data?.rows || [];
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,.9fr)_minmax(0,1fr)]">
      <form onSubmit={submit} className="self-start">
        <Card title={editing ? `Edit coupon ${f.code}` : "New coupon"}>
          {act.box}
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code *" hint="Customers type this at checkout."><Input value={f.code} onChange={(e) => setF((o) => ({ ...o, code: e.target.value.toUpperCase() }))} maxLength={32} /></Field>
              <Field label="Description"><Input value={f.description} onChange={set("description")} maxLength={160} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Discount type"><Select value={f.discount_type} onChange={set("discount_type")}><option value="percent">Percent (%)</option><option value="fixed">Fixed amount (৳)</option></Select></Field>
              <Field label="Discount value *"><Input type="number" min="0.01" step="0.01" value={f.discount_value} onChange={set("discount_value")} /></Field>
              <Field label="Minimum order (৳)"><Input type="number" min="0" value={f.minimum_amount} onChange={set("minimum_amount")} /></Field>
              {f.discount_type === "percent" && <Field label="Largest discount (৳)" hint="Caps a percent coupon."><Input type="number" min="0" value={f.maximum_discount} onChange={set("maximum_discount")} /></Field>}
              <Field label="Total uses allowed" hint="Empty = unlimited."><Input type="number" min="1" value={f.usage_limit} onChange={set("usage_limit")} /></Field>
              <Field label="Uses per customer"><Input type="number" min="1" max="1000" value={f.per_user_limit} onChange={set("per_user_limit")} /></Field>
              <Field label="Starts"><Input type="date" value={f.starts_at} onChange={set("starts_at")} /></Field>
              <Field label="Ends"><Input type="date" value={f.ends_at} onChange={set("ends_at")} /></Field>
            </div>
            <Toggle checked={f.status} onChange={(v) => setF((o) => ({ ...o, status: v }))} label="Active" />
            <Toggle checked={f.is_public} onChange={(v) => setF((o) => ({ ...o, is_public: v }))} label="Show to customers" hint="Off = a private code that only people who know it can use." />
            <div className="flex gap-2"><Btn type="submit" disabled={act.busy}>{act.busy ? "Saving…" : editing ? "Save coupon" : "Create coupon"}</Btn>{editing && <Btn variant="secondary" onClick={reset}>Cancel</Btn>}</div>
          </div>
        </Card>
      </form>

      <Card title="Coupons" actions={<div className="flex flex-wrap gap-2"><Input placeholder="Search code…" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} className="!w-40" aria-label="Search coupons" /><Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="!w-36" aria-label="Filter by state"><option value="">All</option>{Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></div>}>
        {loadErr && <p role="alert" className="mb-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{loadErr}</p>}
        {data?.storage_ready === false && <p className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">Coupon storage is not installed for this shop yet (run the Laravel migrations).</p>}
        {!data ? <Loading /> : !rows.length ? <Empty>No coupons found.</Empty> : (
          <ul className="divide-y divide-accent/25">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold tracking-wide text-ink">{r.code} <Badge tone={TONE[r.state] || "gray"}>{LABEL[r.state] || r.state}</Badge></p>
                  <p className="mt-0.5 text-xs text-ink/60">{r.discount_type === "percent" ? `${Number(r.discount_value)}% off` : `${takaFmt(r.discount_value)} off`}{Number(r.minimum_amount) > 0 ? ` · min ${takaFmt(r.minimum_amount)}` : ""} · used {r.usage_count || 0}{r.usage_limit ? `/${r.usage_limit}` : ""}</p>
                </div>
                <div className="flex shrink-0 gap-2"><Btn variant="secondary" className="!px-3 !py-1.5 !text-xs" onClick={() => edit(r)}>Edit</Btn><Btn variant="danger" onClick={() => remove(r)}>Delete</Btn></div>
              </li>
            ))}
          </ul>
        )}
        <Pager page={data?.pagination?.current_page || 1} last={data?.pagination?.last_page} onPage={setPage} />
      </Card>
    </div>
  );
}
