"use client";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/adminSession";
import { Badge, Btn, Card, Empty, Field, Input, Loading, Pager, Select, dateFmt, takaFmt, useAction } from "../ui";

export const ORDER_TONE = { pending: "amber", confirmed: "blue", processing: "blue", packed: "blue", shipped: "blue", delivered: "green", cancelled: "red" };
export const PAY_TONE = { unpaid: "amber", pending: "amber", pending_verification: "amber", paid: "green", failed: "red", refund_pending: "amber", refunded: "gray" };
const MOVES = { pending: ["confirmed", "processing", "cancelled"], confirmed: ["processing", "cancelled"], processing: ["packed", "shipped", "cancelled"], packed: ["shipped", "cancelled"], shipped: ["delivered"] };
const PAY_MOVES = { unpaid: ["paid", "failed"], pending: ["paid", "failed"], pending_verification: ["paid", "failed", "refund_pending"], paid: ["refund_pending"], refund_pending: ["refunded", "paid"], failed: ["pending_verification"] };
const STATUSES = ["pending", "confirmed", "processing", "packed", "shipped", "delivered", "cancelled"];
const nice = (s) => String(s || "").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
export const orderStatus = (o) => String(o.order_status || "pending").toLowerCase();
export const payStatus = (o) => String(o.payment_status || (o.payment_method === "cod" ? "unpaid" : "pending_verification")).toLowerCase();

function Detail({ id, onClose, onChanged }) {
  const [o, setO] = useState(null);
  const [err, setErr] = useState("");
  const [os, setOs] = useState("");
  const [ps, setPs] = useState("");
  const [ref, setRef] = useState("");
  const [rf, setRf] = useState({ amount: "", method: "bkash", ref: "", note: "" });
  const act = useAction();

  const load = useCallback(async () => {
    try { const d = (await adminApi(`/orders/${id}`))?.order; setO(d); setOs(""); setPs(""); setRef(d?.payment_ref || ""); setRf({ amount: d?.final_amount || "", method: "bkash", ref: "", note: "" }); }
    catch (e) { setErr(e.message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const submit = (e) => {
    e.preventDefault();
    const body = {};
    if (os) body.order_status = os;
    if (ps) body.payment_status = ps;
    if (o && ref !== (o.payment_ref || "")) body.payment_ref = ref.trim();
    if (ps === "refunded") {
      if (!(Number(rf.amount) > 0)) return act.setErr("Enter the refunded amount.");
      if (!rf.ref.trim()) return act.setErr("Enter the refund reference (transaction ID).");
      Object.assign(body, { refund_amount: Number(rf.amount), refund_method: rf.method, refund_ref: rf.ref.trim(), refund_note: rf.note.trim() || null });
    }
    if (!Object.keys(body).length) return act.setErr("Choose a new order or payment status first.");
    act.run(async () => { await adminApi(`/orders/${o.id}`, { method: "PATCH", json: body }); await load(); onChanged(); }, "Order updated.", { storefront: false });
  };

  const body = !o ? (err ? <p role="alert" className="text-sm text-red-700">{err}</p> : <Loading />) : (() => {
    const cur = orderStatus(o), pay = payStatus(o);
    const nextO = MOVES[cur] || [], nextP = PAY_MOVES[pay] || [];
    return (
      <div className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-cream p-4 text-sm"><p className="font-semibold">{o.customer?.name || "Customer"}</p><p className="text-ink/70">{o.customer?.phone}</p><p className="mt-2 text-ink/80">{o.delivery_address || "No address"}</p><p className="mt-1 text-xs text-ink/60">{[nice(o.delivery_type), o.delivery_slot].filter(Boolean).join(" · ")}</p></div>
          <div className="rounded-xl bg-cream p-4 text-sm"><p>Placed: <b>{o.sale_datetime || "—"}</b></p><p className="mt-1">Payment: <b>{nice(o.payment_method) || "—"}</b> {o.payment_ref && <span className="text-ink/60">({o.payment_ref})</span>}</p><p className="mt-1">Delivery charge: <b>{takaFmt(o.delivery_charge)}</b></p>{o.coupon_code && <p className="mt-1">Coupon: <b>{o.coupon_code}</b></p>}{o.note && <p className="mt-1 text-ink/70">Note: {o.note}</p>}</div>
        </div>
        <div className="overflow-x-auto rounded-xl ring-1 ring-accent/30">
          <table className="w-full text-sm"><thead className="bg-primary-light text-left text-xs uppercase tracking-wide text-primary-dark"><tr><th className="px-3 py-2">Item</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Price</th><th className="px-3 py-2 text-right">Total</th></tr></thead>
            <tbody className="divide-y divide-accent/20">{(o.items || []).map((i, k) => <tr key={k}><td className="px-3 py-2">{i.name}</td><td className="px-3 py-2 text-right">{i.quantity}</td><td className="px-3 py-2 text-right">{takaFmt(i.unit_price)}</td><td className="px-3 py-2 text-right">{takaFmt(i.quantity * i.unit_price)}</td></tr>)}</tbody>
            <tfoot><tr className="border-t border-accent/30 font-semibold"><td className="px-3 py-2" colSpan={3}>Order total</td><td className="px-3 py-2 text-right">{takaFmt(o.final_amount)}</td></tr></tfoot></table>
        </div>
        <form onSubmit={submit} className="grid gap-4 rounded-xl border border-accent/30 p-4">
          {act.box}
          <div className="flex flex-wrap items-center gap-2 text-sm">Now: <Badge tone={ORDER_TONE[cur]}>{nice(cur)}</Badge> <Badge tone={PAY_TONE[pay]}>Payment: {nice(pay)}</Badge></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Move order to" hint={nextO.length ? undefined : "No further order status is possible."}><Select value={os} onChange={(e) => setOs(e.target.value)} disabled={!nextO.length}><option value="">— keep {nice(cur)} —</option>{nextO.map((s) => <option key={s} value={s}>{nice(s)}</option>)}</Select></Field>
            <Field label="Change payment to" hint={nextP.length ? undefined : "No further payment status is possible."}><Select value={ps} onChange={(e) => setPs(e.target.value)} disabled={!nextP.length}><option value="">— keep {nice(pay)} —</option>{nextP.map((s) => <option key={s} value={s}>{nice(s)}</option>)}</Select></Field>
          </div>
          <Field label="Payment reference (bKash / Nagad transaction ID)" hint={ps === "paid" && o.payment_method !== "cod" ? "Required to mark a mobile / card payment as paid." : undefined}><Input value={ref} onChange={(e) => setRef(e.target.value)} maxLength={128} /></Field>
          {ps === "refunded" && (
            <div className="grid gap-4 rounded-xl bg-cream p-4 sm:grid-cols-2">
              <Field label="Refunded amount (৳)"><Input type="number" min="0.01" step="0.01" value={rf.amount} onChange={(e) => setRf({ ...rf, amount: e.target.value })} /></Field>
              <Field label="Refund method"><Select value={rf.method} onChange={(e) => setRf({ ...rf, method: e.target.value })}>{["bkash", "nagad", "rocket", "bank", "cash", "other"].map((m) => <option key={m} value={m}>{nice(m)}</option>)}</Select></Field>
              <Field label="Refund reference *"><Input value={rf.ref} onChange={(e) => setRf({ ...rf, ref: e.target.value })} maxLength={128} /></Field>
              <Field label="Note"><Input value={rf.note} onChange={(e) => setRf({ ...rf, note: e.target.value })} maxLength={1000} /></Field>
            </div>
          )}
          <div><Btn type="submit" disabled={act.busy || (!nextO.length && !nextP.length && ref === (o.payment_ref || ""))}>{act.busy ? "Saving…" : "Update order"}</Btn></div>
        </form>
      </div>
    );
  })();

  return (
    <Card title={o ? `Order ${o.order_no || `#${o.id}`}` : "Order"} actions={<Btn variant="secondary" onClick={onClose}>← Back to orders</Btn>}>{body}</Card>
  );
}

export default function Orders({ initialStatus = "" }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(initialStatus);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    try { setData(await adminApi("/orders", { query: { page, status, q: q.trim(), per_page: 12 } })); }
    catch (e) { setErr(e.message); setData({ orders: { data: [] }, summary: {} }); }
  }, [page, status, q]);
  useEffect(() => { const t = setTimeout(load, q ? 300 : 0); return () => clearTimeout(t); }, [load, q]);

  if (open) return <Detail id={open} onClose={() => setOpen(null)} onChanged={load} />;
  const list = data?.orders?.data || [];
  const meta = data?.orders?.meta || data?.orders || {};
  const by = data?.summary?.by_status || {};
  return (
    <Card title="Orders" description="Orders placed on the website." actions={<Input placeholder="Search order no, name, phone…" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} className="!w-64 max-w-full" aria-label="Search orders" />}>
      <div className="mb-4 flex flex-wrap gap-2">
        {[["", `All${data?.summary?.total != null ? ` (${data.summary.total})` : ""}`], ...STATUSES.map((s) => [s, `${nice(s)}${by[s] ? ` (${by[s]})` : ""}`])].map(([v, label]) => (
          <button key={v} type="button" onClick={() => { setPage(1); setStatus(v); }} aria-pressed={status === v} className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${status === v ? "border-primary bg-primary text-white" : "border-accent/50 text-ink/70 hover:bg-primary-light"}`}>{label}</button>
        ))}
      </div>
      {data?.summary?.awaiting_payment_check > 0 && <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">{data.summary.awaiting_payment_check} payment(s) are waiting to be checked.</p>}
      {err && <p role="alert" className="mb-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</p>}
      {!data ? <Loading /> : !list.length ? <Empty>{data?.hints?.unfinished_orders ? `No placed orders yet (${data.hints.unfinished_orders} checkout(s) were started but not finished).` : "No orders found."}</Empty> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-ink/50"><tr><th className="py-2 pr-3">Order</th><th className="py-2 pr-3">Customer</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Payment</th><th className="py-2 pr-3 text-right">Total</th><th /></tr></thead>
            <tbody className="divide-y divide-accent/20">
              {list.map((o) => (
                <tr key={o.id} className="align-top">
                  <td className="py-3 pr-3"><b>{o.order_no || `#${o.id}`}</b><p className="text-xs text-ink/60">{o.sale_datetime}</p></td>
                  <td className="py-3 pr-3">{o.customer?.name || "—"}<p className="text-xs text-ink/60">{o.customer?.phone}</p></td>
                  <td className="py-3 pr-3"><Badge tone={ORDER_TONE[orderStatus(o)]}>{nice(orderStatus(o))}</Badge></td>
                  <td className="py-3 pr-3"><Badge tone={PAY_TONE[payStatus(o)]}>{nice(payStatus(o))}</Badge></td>
                  <td className="py-3 pr-3 text-right font-semibold">{takaFmt(o.final_amount)}</td>
                  <td className="py-3 text-right"><Btn variant="secondary" className="!px-3 !py-1.5 !text-xs" onClick={() => setOpen(o.id)}>Open</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={meta.current_page || page} last={meta.last_page} onPage={setPage} />
    </Card>
  );
}
