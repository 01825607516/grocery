"use client";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/format";

// Delivery method + time slot. Reads / writes the shared cart state, so the cart drawer and checkout always agree.
// The delivery area (header) decides: charge, whether Express exists, and whether slots exist (courier areas have none).
export default function DeliveryPicker() {
  const { area, method, setMethod, slotsInfo, slot, setSlotId } = useCart();
  const opt = (on) => `rounded-lg border px-2 py-2 ${on ? "border-primary bg-primary-light" : "border-accent/40"}`;
  return (
    <div className="rounded-xl bg-white p-3 text-sm">
      <p className="mb-2 font-semibold">Delivery <span className="font-normal text-ink/50">· {area.name.split(" (")[0]}</span></p>
      <div className="flex gap-2">
        <button onClick={() => setMethod("standard")} className={`flex-1 ${opt(method === "standard")}`}>Standard</button>
        <button disabled={!area.express} onClick={() => setMethod("express")} className={`flex-1 disabled:opacity-40 ${opt(method === "express")}`}>Express +{money(area.expressCharge || 60)}</button>
      </div>
      {!area.express && <p className="mt-1 text-[11px] text-ink/50">Express is not available in this delivery area.</p>}
      {area.courier ? (
        <p className="mt-2 rounded-lg bg-cream p-2 text-xs">Courier delivery in <b>{area.eta}</b>. No time slot needed.</p>
      ) : method === "express" ? (
        <p className="mt-2 rounded-lg bg-cream p-2 text-xs">Express orders arrive <b>within ~90 minutes</b>. No time slot needed.</p>
      ) : slotsInfo && (
        <>
          <p className="mb-1 mt-3 text-xs text-ink/60">Delivery time · <b>{slotsInfo.dayLabel}</b></p>
          <div className="grid grid-cols-2 gap-2">
            {slotsInfo.list.map((s) => <button key={s.id} disabled={s.disabled} onClick={() => setSlotId(s.id)} title={s.disabled ? (s.full ? "Fully booked" : "Time has passed") : ""} className={`rounded-lg border px-2 py-1.5 text-xs disabled:line-through disabled:opacity-40 ${slot?.id === s.id ? "border-primary bg-primary-light" : "border-accent/40"}`}>{s.label}</button>)}
          </div>
        </>
      )}
    </div>
  );
}
