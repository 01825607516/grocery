"use client";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/adminSession";
import { Badge, Btn, Card, Empty, Field, Input, Loading, Toggle, takaFmt, useAction } from "../ui";

const blank = () => ({ name: "", city: "", area: "", area_id: "", charge: "", estimated_days: "", slot: "", status: true });

export default function Delivery() {
  const [rows, setRows] = useState(null);
  const [loadErr, setLoadErr] = useState("");
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState(blank);
  const act = useAction();

  const load = useCallback(async () => {
    setLoadErr("");
    try { setRows((await adminApi("/delivery-options"))?.options || []); }
    catch (e) { setLoadErr(e.message); setRows([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = (e) => {
    e.preventDefault();
    const charge = Number(f.charge);
    if (!f.name.trim()) return act.setErr("Give this delivery option a name.");
    if (f.charge === "" || !Number.isFinite(charge) || charge < 0) return act.setErr("Enter the delivery charge (0 or more).");
    const body = { name: f.name.trim(), city: f.city.trim() || null, area: f.area.trim() || null, area_id: f.area_id ? Number(f.area_id) : null, charge, estimated_days: f.estimated_days === "" ? 0 : Number(f.estimated_days), slot: f.slot.trim() || null, status: !!f.status };
    act.run(async () => {
      await adminApi(editing ? `/delivery-options/${editing}` : "/delivery-options", { method: editing ? "PUT" : "POST", json: body });
      setEditing(null); setF(blank()); await load();
    }, editing ? "Delivery option updated." : "Delivery option added.");
  };
  const edit = (r) => { setEditing(r.id); setF({ name: r.name || "", city: r.city || "", area: r.area || "", area_id: r.area_id || "", charge: r.charge ?? "", estimated_days: r.estimated_days ?? "", slot: r.slot || "", status: Number(r.status) !== 0 }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const remove = (r) => { if (window.confirm(`Delete “${r.name}”?`)) act.run(async () => { await adminApi(`/delivery-options/${r.id}`, { method: "DELETE" }); await load(); }, "Deleted."); };
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <form onSubmit={submit} className="self-start">
        <Card title={editing ? "Edit delivery option" : "Add delivery option"}>
          {act.box}
          <div className="grid gap-3">
            <Field label="Name *" hint="Shown to customers, e.g. “Inside Dhaka City”."><Input value={f.name} onChange={set("name")} maxLength={100} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City"><Input value={f.city} onChange={set("city")} /></Field>
              <Field label="Area"><Input value={f.area} onChange={set("area")} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Delivery charge (৳) *"><Input type="number" min="0" step="0.01" value={f.charge} onChange={set("charge")} /></Field>
              <Field label="Delivery days" hint="2 or more = courier delivery (no time slots)."><Input type="number" min="0" max="365" value={f.estimated_days} onChange={set("estimated_days")} /></Field>
            </div>
            <Field label="Time slots" hint="Separate several with ; for example  9 – 11 AM; 4 – 6 PM"><Input value={f.slot} onChange={set("slot")} maxLength={100} /></Field>
            <Field label="Area ID (optional)"><Input type="number" min="1" value={f.area_id} onChange={set("area_id")} /></Field>
            <Toggle checked={f.status} onChange={(v) => setF((o) => ({ ...o, status: v }))} label="Active" hint="Inactive options are hidden from customers." />
            <div className="flex gap-2">
              <Btn type="submit" disabled={act.busy}>{act.busy ? "Saving…" : editing ? "Save option" : "Add option"}</Btn>
              {editing && <Btn variant="secondary" onClick={() => { setEditing(null); setF(blank()); }}>Cancel</Btn>}
            </div>
          </div>
        </Card>
      </form>
      <Card title="Delivery areas & slots">
        {loadErr && <p role="alert" className="mb-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{loadErr}</p>}
        {!rows ? <Loading /> : !rows.length ? <Empty>No delivery options yet. Customers cannot choose a delivery area (and cannot place an order) until you add at least one.</Empty> : (
          <ul className="divide-y divide-accent/25">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{r.name} {Number(r.status) === 0 && <Badge>Hidden</Badge>}</p>
                  <p className="mt-0.5 text-xs text-ink/60">{[r.city, r.area].filter(Boolean).join(" · ") || "—"} · {takaFmt(r.charge)} · {Number(r.estimated_days) >= 2 ? `${r.estimated_days} days courier` : r.slot || "no slot set"}</p>
                </div>
                <div className="flex shrink-0 gap-2"><Btn variant="secondary" className="!px-3 !py-1.5 !text-xs" onClick={() => edit(r)}>Edit</Btn><Btn variant="danger" onClick={() => remove(r)}>Delete</Btn></div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
