"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useCart } from "@/context/CartContext";
import { useI18n } from "@/context/I18nContext";
import { api } from "@/services";

// Small popup for "Cancel order" and "Return / refund" on the order detail page.
// mode: "cancel" | "return". onDone(updatedOrder?) is called after success.
export default function OrderActionModal({ mode, order, onClose, onDone }) {
  const { t } = useI18n();
  const { refreshOrders, notify } = useCart();
  const reasons = t("reasons");
  const [reason, setReason] = useState(reasons[0]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const isCancel = mode === "cancel";

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      if (isCancel) { const o = await api.cancelOrder(order.id); refreshOrders(); notify("Order cancelled"); onDone?.(o); }
      else { const o = await api.requestReturn(order.id, { reason, note: note.trim() }); refreshOrders(); notify(t("return_done")); onDone?.(o); }
      onClose();
    } catch (e) { setErr(e.message || "Something went wrong. Please try again."); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={isCancel ? t("cancel_order") : t("return_order")} size="md">
      <p className="text-sm text-ink/70">{isCancel ? <>Cancel order <b>{order.id}</b>? This cannot be undone.</> : <>Order <b>{order.id}</b> · {t("return_reason")}</>}</p>
      {!isCancel && (
        <>
          <div className="mt-3 space-y-1.5" role="radiogroup" aria-label={t("return_reason")}>
            {reasons.map((r) => (
              <label key={r} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm ${reason === r ? "border-primary bg-primary-light" : "border-accent/40"}`}>
                <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} /> {r}
              </label>
            ))}
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={3} placeholder={t("notes")} aria-label={t("notes")} className="mt-3 w-full resize-none rounded-lg border border-accent/40 p-2 text-sm outline-none focus:border-primary" />
        </>
      )}
      {err && <p role="alert" className="mt-2 text-xs text-red-600">{err}</p>}
      <div className="mt-4 flex gap-2">
        <button onClick={submit} disabled={busy} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${isCancel ? "bg-red-600" : "bg-primary"}`}>{busy ? "…" : isCancel ? t("yes_cancel") : t("return_submit")}</button>
        <button onClick={onClose} className="rounded-lg border border-accent/50 bg-white px-4 py-2 text-sm">{isCancel ? t("keep_order") : t("close")}</button>
      </div>
    </Modal>
  );
}
