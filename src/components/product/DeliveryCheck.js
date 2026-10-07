"use client";
import { useCart } from "@/context/CartContext";
import { useCatalog } from "@/context/CatalogContext";
import { useI18n } from "@/context/I18nContext";
import { money } from "@/lib/format";

// Small "will it reach me?" box for the product page.
export default function DeliveryCheck() {
  const { areas, config } = useCatalog();
  const { area, setArea } = useCart();
  const { t } = useI18n();
  return (
    <div className="mt-2 max-w-sm rounded-xl bg-white p-3 text-xs">
      <p className="mb-1 font-semibold">{t("delivery_to")}</p>
      <select value={area.id} onChange={(e) => setArea(areas.find((a) => a.id === e.target.value))} aria-label={t("delivery_to")} className="w-full rounded-lg border border-accent/40 px-2 py-1.5 text-sm">
        {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      <p className="mt-1.5 text-ink/70">
        {money(area.charge)} · {area.courier ? `Courier ${area.eta}` : area.express ? "Slots or Express (~90 min)" : "Choose a slot at checkout"} · {t("free_delivery")} {money(config.freeDeliveryLimit)}+
      </p>
    </div>
  );
}
