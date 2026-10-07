"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useI18n } from "@/context/I18nContext";
import { isWatching, setWatching } from "@/lib/notify";

// Shown only when a product is out of stock.
export default function NotifyButton({ p }) {
  const { notify } = useCart();
  const { t } = useI18n();
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(isWatching(p.id)); }, [p.id]);
  if (p.status !== "out") return null;
  const toggle = () => {
    const next = !on;
    setWatching(p.id, next); setOn(next);
    notify?.(next ? `${t("notify_on")}: ${p.name}` : t("notify_off"));
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={on}
      className={`w-fit rounded-lg border px-3 py-2 text-sm font-semibold transition ${on ? "border-primary bg-primary-light text-primary" : "border-[#e11d2e] text-[#e11d2e] hover:bg-red-50"}`}>
      🔔 {on ? t("notify_on") : t("notify_me")}
    </button>
  );
}
