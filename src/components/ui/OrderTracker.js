import { ORDER_STEPS, stepIndex } from "@/lib/orders";

// Confirmed -> Preparing -> Packed -> Out for Delivery -> Delivered
export default function OrderTracker({ status, compact = false }) {
  const cur = stepIndex(status);
  return (
    <ol className={compact ? "flex items-start" : "space-y-3"}>
      {ORDER_STEPS.map((s, i) => (
        <li key={s.key} className={`${compact ? "flex flex-1 flex-col items-center gap-1 text-center text-[10px] leading-tight" : "flex items-center gap-3 text-sm"} ${i <= cur ? "font-semibold text-primary" : "text-ink/40"}`}>
          <span className={`grid shrink-0 place-items-center rounded-full text-white ${compact ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-xs"} ${i <= cur ? "bg-primary" : "bg-gray-300"} ${i === cur && cur < ORDER_STEPS.length - 1 ? "ring-4 ring-primary/20" : ""}`}>{i <= cur ? "✓" : ""}</span>{s.label}
        </li>
      ))}
    </ol>
  );
}
