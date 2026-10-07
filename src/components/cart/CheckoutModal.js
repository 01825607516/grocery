"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import OrderTracker from "@/components/ui/OrderTracker";
import DeliveryPicker from "./DeliveryPicker";
import CouponBox from "./CouponBox";
import InvoiceButton from "@/components/pages/InvoiceButton";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useCatalog } from "@/context/CatalogContext";
import { api } from "@/services";
import { isPhone, money, qtyLabel, stepOf, maxQty } from "@/lib/format";
import { etaText, isActive } from "@/lib/orders";
import { celebrateOrder } from "@/lib/confetti";

const INPUT = "w-full rounded-lg border border-accent/40 p-2";
const Row = ({ k, v, neg, free }) => <div className="flex justify-between"><span>{k}</span><span className={neg || free ? "text-primary" : ""}>{free ? "Free" : <>{neg ? "−" : ""}{money(v)}</>}</span></div>;

// Delivery address -> delivery (shared picker) -> payment -> order review -> place order -> success + live tracking.
export default function CheckoutModal({ open, onClose, page = false }) {
  const { payments } = useCatalog();
  const { setAccountOpen } = useAuth();
  const { checkoutLines: lines, checkoutTotals: totals, buyNow, setBuyNowQty, area, method, slot, slotsInfo, placeOrder, setDrawerOpen, notify } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [addrId, setAddrId] = useState("new");       // saved address id or "new"
  const [type, setType] = useState("Home");
  const [line, setLine] = useState("");
  const [pay, setPay] = useState(payments[0]);
  const [wallet, setWallet] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [order, setOrder] = useState(null);
  const [editId, setEditId] = useState(null);       // id of the saved address being edited

  useEffect(() => {
    if (!open || order) return;
    setErr("");
    api.getAddresses().then((list) => { setAddresses(list); setAddrId(list[0]?.id || "new"); }).catch(() => {});
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // after placing: poll the order so the tracker moves Confirmed -> Preparing -> Packed -> Out for Delivery -> Delivered
  useEffect(() => {
    if (!order || !isActive(order)) return;
    const t = setInterval(() => api.getOrder(order.id).then(setOrder).catch(() => {}), 4000);
    return () => clearInterval(t);
  }, [order]);

  const saved = addresses.find((a) => a.id === addrId);
  const address = saved ? { type: saved.type, line: saved.line } : { type, line: line.trim() };
  const needSlot = !area.courier && method === "standard";
  const wantsWallet = pay === "bKash" || pay === "Nagad";
  const problem = !lines.length ? "Your cart is empty." : editId ? "Save or cancel your address changes first." : !address.line ? "Enter your delivery address to continue." : needSlot && !slot ? "No delivery slot is available right now." : wantsWallet && !isPhone(wallet) ? `Enter your ${pay} number to continue.` : "";

  const removeAddr = async (id) => {
    try { await api.deleteAddress(id); const next = addresses.filter((a) => a.id !== id); setAddresses(next); if (addrId === id) setAddrId(next[0]?.id || "new"); } catch (e) { notify(e.message); }
  };

  const startEdit = (a) => { setAddrId(a.id); setEditId(a.id); setType(a.type); setLine(a.line); setErr(""); };
  const cancelEdit = () => { setEditId(null); setLine(""); };
  const saveEdit = async () => {
    if (!line.trim()) return setErr("Please enter the full address.");
    setBusy(true); setErr("");
    try {
      const rec = await api.saveAddress({ id: editId, type, line: line.trim(), areaId: area.id });
      setAddresses((list) => list.map((a) => (a.id === editId ? rec : a)));
      setEditId(null); setLine("");
    } catch (e) { setErr(e.message || "Could not save the address."); } finally { setBusy(false); }
  };

  const place = async () => {
    setBusy(true); setErr("");
    try {
      if (!saved) api.saveAddress({ type, line: line.trim(), areaId: area.id }).catch(() => {}); // remember it for next time
      const o = await placeOrder({ address, payment: { method: pay, phone: wantsWallet ? wallet : undefined } });
      if (o.paymentUrl) { window.location.href = o.paymentUrl; return; } // online payment: the backend can return a gateway URL
      setOrder(o); celebrateOrder();
    } catch (e) { setErr(e.message || "We could not place your order. Please try again."); } finally { setBusy(false); }
  };
  const close = () => { if (order) { setOrder(null); setLine(""); setDrawerOpen(false); } setEditId(null); onClose(); };

  if (order)
    return (
      <Modal open={open} onClose={close} title="Order placed" page={page}>
        <p className="text-sm">Thank you! Order ID <b>{order.id}</b></p>
        <p className="text-sm">Estimated delivery: <b>{etaText(order)}</b> · Total <b>{money(order.totals.total)}</b></p>
        <p className="mt-0.5 text-xs text-ink/60">{order.payment.method === "Cash on Delivery" ? "Pay cash when your order arrives." : `${order.payment.method} payment is ${order.payment.status === "paid" ? "received" : "pending confirmation"}.`}</p>
        <div className="mt-5"><OrderTracker status={order.status} /></div>
        <div className="mt-6 flex flex-wrap gap-2">
          <InvoiceButton id={order.id} className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary" />
          <button onClick={() => { close(); setAccountOpen(true); }} className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary">My orders</button>
          <button onClick={close} className="btn">Continue shopping</button>
        </div>
      </Modal>
    );

  return (
    <Modal open={open} onClose={onClose} title="Checkout" page={page}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4 text-sm">
          <div>
            <p className="mb-2 font-semibold">Delivery address</p>
            {addresses.map((a) => (
              <label key={a.id} className={`mb-2 flex cursor-pointer items-start gap-2 rounded-lg border p-2 ${addrId === a.id ? "border-primary bg-primary-light" : "border-accent/40"}`}>
                <input type="radio" name="addr" checked={addrId === a.id} onChange={() => { setAddrId(a.id); if (editId !== a.id) cancelEdit(); }} className="mt-1" />
                <span className="min-w-0 flex-1"><b>{a.type}</b><span className="block break-words text-ink/70">{a.line}</span></span>
                <span className="flex gap-3"><button type="button" onClick={(e) => { e.preventDefault(); startEdit(a); }} className="text-xs underline">Edit</button><button type="button" onClick={(e) => { e.preventDefault(); removeAddr(a.id); }} className="text-xs underline">Delete</button></span>
              </label>
            ))}
            {addresses.length > 0 && <label className={`mb-2 flex cursor-pointer items-center gap-2 rounded-lg border p-2 ${addrId === "new" ? "border-primary bg-primary-light" : "border-accent/40"}`}><input type="radio" name="addr" checked={addrId === "new"} onChange={() => { setAddrId("new"); cancelEdit(); }} /> Add a new address</label>}
            {(addrId === "new" || editId) && (
              <>
                {editId && <p className="mb-2 text-xs font-semibold text-primary">Editing saved address</p>}
                <div className="mb-2 flex gap-2">{["Home", "Office"].map((t) => <button key={t} onClick={() => setType(t)} className={`rounded-lg border px-4 py-1.5 ${type === t ? "border-primary bg-primary-light" : "border-accent/40"}`}>{t}</button>)}</div>
                <textarea value={line} onChange={(e) => setLine(e.target.value)} placeholder={`${type} address in ${area.name}`} aria-label="Delivery address" className={INPUT} rows={3} />
                {editId && <div className="mt-2 flex gap-2"><button type="button" onClick={saveEdit} disabled={busy} className="btn !px-4 !py-1.5">Save address</button><button type="button" onClick={cancelEdit} className="rounded-lg border border-accent/50 px-4 py-1.5">Cancel</button></div>}
              </>
            )}
          </div>
          <DeliveryPicker />
          {!buyNow && <CouponBox />}
          <div>
            <p className="mb-2 font-semibold">Payment</p>
            <div className="grid grid-cols-2 gap-2">{payments.map((p) => <button key={p} onClick={() => setPay(p)} className={`rounded-lg border px-2 py-2 ${pay === p ? "border-primary bg-primary-light" : "border-accent/40"}`}>{p}</button>)}</div>
            {wantsWallet && <input value={wallet} onChange={(e) => setWallet(e.target.value)} inputMode="tel" placeholder={`Your ${pay} number (01XXXXXXXXX)`} aria-label={`${pay} number`} className={`${INPUT} mt-2`} />}
            {pay === "Card" && <p className="mt-2 text-xs text-ink/60">You will be taken to our secure card payment page after you place the order.</p>}
          </div>
        </div>
        <div className="h-fit rounded-xl bg-white p-4 text-sm">
          <p className="mb-2 font-semibold">{buyNow ? "Buy now · this item only" : "Order review"}</p>
          {lines.map(({ product: p, qty, total: t }) => (
            <div key={p.id} className="flex items-center justify-between gap-2">
              <span>{p.name}{buyNow ? "" : <> × {qtyLabel(p, qty)}</>}</span>
              <span className="flex shrink-0 items-center gap-2">
                {buyNow && (
                  <span className="flex items-center overflow-hidden rounded-lg border border-primary text-xs font-semibold">
                    <button type="button" aria-label="Decrease" disabled={qty <= stepOf(p)} onClick={() => setBuyNowQty(qty - stepOf(p))} className="h-7 w-7 bg-primary-light disabled:opacity-40">−</button>
                    <span className="min-w-[2.8rem] text-center">{qtyLabel(p, qty)}</span>
                    <button type="button" aria-label="Increase" disabled={qty >= maxQty(p)} onClick={() => setBuyNowQty(qty + stepOf(p))} className="h-7 w-7 bg-primary text-white disabled:opacity-40">+</button>
                  </span>
                )}
                {money(t)}
              </span>
            </div>
          ))}
          {buyNow && <p className="mt-1 text-[11px] text-ink/50">Your cart is not part of this order.</p>}
          <div className="mt-3 space-y-1 border-t pt-2">
            <Row k="Subtotal" v={totals.subtotal} />
            <Row k="Delivery fee" v={totals.delivery} free={totals.free} />
            {totals.subDiscount > 0 && <Row k="Subscribe & save" v={totals.subDiscount} neg />}
            {totals.couponDiscount > 0 && <Row k="Coupon" v={totals.couponDiscount} neg />}
          </div>
          <p className="mt-3 text-xs text-ink/60">{address.line ? <>Deliver to: {address.type}, {address.line}<br /></> : null}{method === "express" ? "Express delivery · within ~90 min" : area.courier ? `Courier · ${area.eta}` : `Standard delivery · ${slotsInfo?.dayLabel} ${slot?.label || ""}`} · {pay}</p>
          <p className="mt-2 flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{money(totals.total)}</span></p>
          {totals.savings > 0 && <p className="text-right text-xs text-primary">You save {money(totals.savings)}</p>}
          {err && <p role="alert" className="mt-2 text-xs text-red-600">{err}</p>}
          <button disabled={!!problem || busy} onClick={place} className="btn mt-4 w-full">{busy ? "Placing order…" : "Place order"}</button>
          {problem && <p className="mt-1 text-xs text-ink/60">{problem}</p>}
        </div>
      </div>
    </Modal>
  );
}