"use client";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { useCatalog } from "@/context/CatalogContext";
import { INFO } from "@/lib/info";
import { money } from "@/lib/format";
import { useI18n } from "@/context/I18nContext";
import { Crumbs } from "./common";

// Footer / policy pages as real pages. The wording stays in lib/info.js (same text the footer popups show).
export default function InfoPage({ name }) {
  const { areas, slots, config, infoPages, support } = useCatalog();
  const { lang } = useI18n();
  const customCopy = infoPages?.[lang]?.[name] || infoPages?.en?.[name];
  const configuredContact = Boolean(support?.phone || support?.email || support?.address);
  const paragraphs = Array.isArray(customCopy) && customCopy.length ? customCopy : name === "Contact" && configuredContact ? INFO.Contact.slice(2) : INFO[name];
  const phone = support?.phone || "0949324782";
  return (
    <PageShell title={name} narrow>
      <Crumbs items={[{ href: "/", label: "Home" }, { label: name }]} />
      <div className="space-y-3 rounded-2xl bg-white p-5 text-sm text-ink/80 shadow-sm ring-1 ring-black/5 md:p-8">
        {paragraphs.map((t) => t === "@delivery" ? (
          <div key={t} className="space-y-3">
            <p>{config.freeDeliveryLimit > 0 ? `Free delivery on orders of ${money(config.freeDeliveryLimit)} or more (Standard delivery).` : "Standard delivery charges apply to all orders."}</p>
            <ul className="divide-y divide-accent/20 rounded-xl bg-cream px-3">
              {areas.map((a) => <li key={a.id} className="flex justify-between gap-3 py-2"><span>{a.name}</span><span className="whitespace-nowrap font-semibold">{money(a.charge)}{a.courier ? ` · ${a.eta}` : ""}</span></li>)}
            </ul>
            <p>{`Time slots: ${slots.map((s) => s.label).join(", ")}. Express delivery (within ~90 minutes) is available in selected areas for an extra charge.`}</p>
          </div>
        ) : <p key={t}>{t}</p>)}
        {name === "Contact" && <div className="space-y-2 pt-2"><a href={`tel:${String(phone).replace(/[^\d+]/g, "")}`} className="btn inline-block">{support?.phone_label || (support?.phone ? `Call ${phone}` : "Call 09 4932 4782")}</a>{support?.email && <a href={`mailto:${support.email}`} className="ml-2 inline-block font-semibold text-primary underline">{support.email}</a>}{support?.address && <p>{support.address}</p>}</div>}
      </div>
      <p className="mt-4 text-center text-sm text-ink/60">Need more help? <Link href="/faq" className="font-semibold text-primary underline">Read the FAQ</Link></p>
    </PageShell>
  );
}
