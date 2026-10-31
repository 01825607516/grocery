"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { isWatching, setWatching } from "@/lib/notify";
import { api } from "@/services";

// Shown only when a product is out of stock.
export default function NotifyButton({ p }) {
  const { notify } = useCart();
  const { user, requireLogin } = useAuth();
  const { t } = useI18n();
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(isWatching(p.id)); }, [p.id]);
  if (p.status !== "out") return null;
  const save = async (next) => {
    try {
      if (api.setNotify) await api.setNotify(p.id, next);
      setWatching(p.id, next); setOn(next);
      notify?.(next ? `${t("notify_on")}: ${p.name}` : t("notify_off"));
    } catch (e) {
      notify?.(e.message || "Could not save your email alert.");
    }
  };
  const toggle = () => {
    const next = !on;
    if (!user && api.setNotify) return requireLogin(() => save(next), "Log in to receive an email when this product is back in stock.");
    save(next);
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={on}
      className={`w-fit rounded-lg border px-3 py-2 text-sm font-semibold transition ${on ? "border-primary bg-primary-light text-primary" : "border-[#e11d2e] text-[#e11d2e] hover:bg-red-50"}`}>
      🔔 {on ? t("notify_on") : t("notify_me")}
    </button>
  );
}
