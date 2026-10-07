"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCatalog } from "@/context/CatalogContext";
import { api } from "@/services";

const INPUT = "w-full rounded-lg border border-accent/40 bg-white p-2 text-sm outline-none focus:border-primary";
const Card = ({ title, children }) => <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"><h3 className="mb-3 font-display text-lg font-semibold">{title}</h3>{children}</section>;
const Note = ({ ok, children }) => children ? <p role={ok ? "status" : "alert"} className={`mt-2 text-xs ${ok ? "text-primary" : "text-red-600"}`}>{children}</p> : null;

function Profile() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ ok: true, t: "" });
  const save = async () => {
    setBusy(true); setMsg({ ok: true, t: "" });
    try { await api.updateProfile({ name }); await refreshUser(); setMsg({ ok: true, t: "Profile saved." }); } catch (e) { setMsg({ ok: false, t: e.message || "Could not save." }); } finally { setBusy(false); }
  };
  return (
    <Card title="Profile">
      <label className="mb-1 block text-xs text-ink/60">Full name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT} />
      <label className="mb-1 mt-3 block text-xs text-ink/60">Email</label>
      <input value={user.email} disabled className={`${INPUT} bg-cream text-ink/60`} />
      <button onClick={save} disabled={busy || !name.trim() || name.trim() === user.name} className="btn mt-4 !py-1.5">{busy ? "Saving…" : "Save changes"}</button>
      <Note ok={msg.ok}>{msg.t}</Note>
    </Card>
  );
}

function Password() {
  const [f, setF] = useState({ current: "", next: "", again: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ ok: true, t: "" });
  const on = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setMsg({ ok: true, t: "" }); };
  const save = async () => {
    if (f.next.length < 6) return setMsg({ ok: false, t: "New password must be at least 6 characters." });
    if (f.next !== f.again) return setMsg({ ok: false, t: "The two new passwords do not match." });
    setBusy(true);
    try { await api.changePassword({ current: f.current, next: f.next }); setF({ current: "", next: "", again: "" }); setMsg({ ok: true, t: "Password changed." }); } catch (e) { setMsg({ ok: false, t: e.message || "Could not change the password." }); } finally { setBusy(false); }
  };
  return (
    <Card title="Change password">
      <div className="space-y-2">
        <input type="password" autoComplete="current-password" value={f.current} onChange={on("current")} placeholder="Current password" aria-label="Current password" className={INPUT} />
        <input type="password" autoComplete="new-password" value={f.next} onChange={on("next")} placeholder="New password (min 6 characters)" aria-label="New password" className={INPUT} />
        <input type="password" autoComplete="new-password" value={f.again} onChange={on("again")} placeholder="Repeat new password" aria-label="Repeat new password" className={INPUT} />
      </div>
      <button onClick={save} disabled={busy || !f.current || !f.next} className="btn mt-4 !py-1.5">{busy ? "Saving…" : "Change password"}</button>
      <Note ok={msg.ok}>{msg.t}</Note>
    </Card>
  );
}

const BLANK = { id: null, type: "Home", line: "", areaId: "" };
function Addresses() {
  const { areas } = useCatalog();
  const [list, setList] = useState(null);
  const [form, setForm] = useState(null); // null = closed, otherwise the address being added / edited
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { api.getAddresses().then(setList).catch(() => setList([])); }, []);
  const save = async () => {
    if (!form.line.trim()) return setErr("Please enter the full address.");
    setBusy(true); setErr("");
    try {
      const rec = await api.saveAddress({ ...form, areaId: form.areaId || areas[0].id });
      setList((l) => (form.id ? l.map((a) => (a.id === form.id ? rec : a)) : [...l, rec]));
      setForm(null);
    } catch (e) { setErr(e.message || "Could not save the address."); } finally { setBusy(false); }
  };
  const remove = async (id) => { try { await api.deleteAddress(id); setList((l) => l.filter((a) => a.id !== id)); } catch (e) { setErr(e.message || "Could not delete."); } };
  return (
    <Card title="Saved addresses">
      {list === null ? <p className="text-sm text-ink/60">Loading…</p> : !list.length && !form ? <p className="text-sm text-ink/60">No saved address yet. Add one to check out faster.</p> : (
        <ul className="space-y-2">
          {list.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-accent/40 p-2 text-sm">
              <span className="min-w-0"><b>{a.type}</b><span className="block break-words text-ink/70">{a.line}</span>{a.areaId && <span className="text-xs text-ink/50">{areas.find((x) => x.id === a.areaId)?.name}</span>}</span>
              <span className="flex shrink-0 gap-3 text-xs"><button onClick={() => { setForm({ ...a }); setErr(""); }} className="underline">Edit</button><button onClick={() => remove(a.id)} className="underline">Delete</button></span>
            </li>
          ))}
        </ul>
      )}
      {form ? (
        <div className="mt-3 space-y-2 rounded-lg bg-cream p-3">
          <div className="flex gap-2">{["Home", "Office"].map((t) => <button key={t} onClick={() => setForm({ ...form, type: t })} className={`rounded-lg border px-4 py-1.5 text-sm ${form.type === t ? "border-primary bg-primary-light" : "border-accent/40 bg-white"}`}>{t}</button>)}</div>
          <select value={form.areaId || areas[0].id} onChange={(e) => setForm({ ...form, areaId: e.target.value })} aria-label="Delivery area" className={INPUT}>{areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
          <textarea rows={3} value={form.line} onChange={(e) => setForm({ ...form, line: e.target.value })} placeholder="House, road, area" aria-label="Full address" className={INPUT} />
          <div className="flex gap-2"><button onClick={save} disabled={busy} className="btn !py-1.5">{busy ? "Saving…" : "Save address"}</button><button onClick={() => { setForm(null); setErr(""); }} className="rounded-lg border border-accent/50 bg-white px-4 py-1.5 text-sm">Cancel</button></div>
        </div>
      ) : <button onClick={() => { setForm({ ...BLANK }); setErr(""); }} className="mt-3 rounded-lg border border-primary px-4 py-1.5 text-sm font-semibold text-primary hover:bg-primary-light">+ Add address</button>}
      <Note>{err}</Note>
    </Card>
  );
}

export default function AccountView() {
  const router = useRouter();
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div><p className="font-display text-lg font-semibold">{user.name}</p><p className="text-sm text-ink/60">{user.email}</p></div>
          <button onClick={async () => { await logout(); router.push("/"); }} className="rounded-lg border border-primary px-4 py-1.5 text-sm font-semibold text-primary hover:bg-primary-light">Log out</button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center text-sm font-semibold">
          <Link href="/account/orders" className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 hover:bg-primary-light">My orders</Link>
          <Link href="/wishlist" className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 hover:bg-primary-light">Wishlist</Link>
        </div>
        <Profile />
        <Password />
      </div>
      <Addresses />
    </div>
  );
}
