"use client";
import { useCart } from "@/context/CartContext";
import { useI18n } from "@/context/I18nContext";
import { money } from "@/lib/format";
import { variantPrice, variantsOf } from "@/lib/variants";

// 500g / 1kg / 5kg chips. Tap a chip = set the cart quantity to that pack. Only shown for products that have variants.
export default function VariantChips({ p }) {
  const { items, setQty } = useCart();
  const { t } = useI18n();
  const list = variantsOf(p);
  if (!list.length || p.status === "out") return null;
  const cur = items[p.id] || 0;
  return (
    <div role="radiogroup" aria-label={t("pack_size")} className="mt-1">
      <p className="mb-1 text-xs font-semibold">{t("pack_size")}</p>
      <div className="flex flex-wrap gap-2">
        {list.map((v) => {
          const on = cur === v.qty;
          return (
            <button key={v.id} type="button" role="radio" aria-checked={on} onClick={() => setQty(p.id, v.qty)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${on ? "border-primary bg-primary text-white" : "border-accent/50 bg-white hover:border-primary"}`}>
              {v.label} <span className={on ? "text-white/80" : "text-ink/55"}>· {money(variantPrice(p, v))}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
