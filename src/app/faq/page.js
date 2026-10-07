"use client";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { useCatalog } from "@/context/CatalogContext";
import { money } from "@/lib/format";
import { Crumbs } from "@/components/pages/common";

export default function FaqPage() {
  const { config, slots, payments } = useCatalog();
  const faq = [
    ["How do I order?", "Browse as a guest, log in when you add items, then check out from the cart."],
    ["How much is delivery?", `It depends on your area (see Delivery information). Delivery is free on Standard orders of ${money(config.freeDeliveryLimit)} or more.`],
    ["What delivery times are there?", `Pick a time slot at checkout: ${slots.map((s) => s.label).join(", ")}. In some areas Express delivery (within ~90 minutes) is available for an extra charge.`],
    ["How can I pay?", `${payments.join(", ")}.`],
    ["Where is my order?", "Open My orders to see live tracking: Confirmed, Preparing, Packed, Out for Delivery, Delivered."],
    ["Can I change or cancel my order?", "You can cancel from the order page until it is packed. After that, please call us on 09 4932 4782."],
    ["What if an item is out of stock?", "In your cart choose what we should do: replace with a similar brand, remove it, or call you."],
    ["Can I use a coupon?", "Yes. Enter the code in your cart. The minimum order and the maximum discount are shown when you apply it."],
    ["How do returns and refunds work?", "See the Return & refund page for the rules on fresh and packaged items."],
  ];
  return (
    <PageShell title="Frequently asked questions" narrow>
      <Crumbs items={[{ href: "/", label: "Home" }, { label: "FAQ" }]} />
      <div className="space-y-2">
        {faq.map(([q, a]) => (
          <details key={q} className="group rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">{q}<span aria-hidden="true" className="text-primary transition group-open:rotate-45">+</span></summary>
            <p className="mt-2 text-ink/70">{a}</p>
          </details>
        ))}
      </div>
      <p className="mt-5 text-center text-sm text-ink/60">Still need help? <Link href="/contact" className="font-semibold text-primary underline">Contact us</Link> · <Link href="/return-policy" className="font-semibold text-primary underline">Return & refund</Link></p>
    </PageShell>
  );
}
