"use client";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useI18n } from "@/context/I18nContext";
import { money } from "@/lib/format";

// One coupon input used on BOTH Cart and Checkout (same cart state, so applying in one shows in the other).
// Supports percent / flat / free-delivery coupons (try FREESHIP).
export default function CouponBox() {
  const { coupon, setCoupon, applyCoupon, totals } = useCart();
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const apply = async () => {
    if (!code.trim()) return;
    setBusy(true); setMsg("");
    try { await applyCoupon(code); setCode(""); } catch (e) { setMsg(e.message || "Could not apply this coupon."); } finally { setBusy(false); }
  };
  return (
    <div className="rounded-xl bg-white p-3 text-sm">
      {coupon ? (
        <div className="flex items-center justify-between gap-2">
          <span>{t("coupon")} <b className="text-primary">{coupon.code}</b> {t("applied")}
            {coupon.type === "freedelivery" && <span className="block text-xs text-primary">🚚 {t("free_delivery")}</span>}
            {totals.couponDiscount === 0 && <span className="block text-xs text-ink/60">Not applicable now. Minimum order {money(coupon.min || 0)}.</span>}
          </span>
          <button onClick={() => setCoupon(null)} className="text-xs underline">{t("remove")}</button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setMsg(""); }} onKeyDown={(e) => e.key === "Enter" && apply()} placeholder={`${t("coupon")} (FRESH10, FREESHIP)`} aria-label={t("coupon")} className="min-w-0 flex-1 rounded border border-accent/40 px-2 py-1.5" />
            <button onClick={apply} disabled={busy || !code.trim()} className="btn !px-3 !py-1.5">{busy ? "…" : t("apply")}</button>
          </div>
          {msg && <p role="alert" className="mt-1 text-xs text-red-600">{msg}</p>}
        </>
      )}
    </div>
  );
}
