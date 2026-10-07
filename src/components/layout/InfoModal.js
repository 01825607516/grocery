"use client";
import Modal from "@/components/ui/Modal";
import { useCatalog } from "@/context/CatalogContext";
import { INFO } from "@/lib/info";
import { money } from "@/lib/format";

export default function InfoModal({ page, onClose }) {
  const { areas, slots, config } = useCatalog();
  if (!page) return null;
  return (
    <Modal open onClose={onClose} title={page} size="md" z="z-[70]">
      <div className="space-y-3 text-sm text-ink/80">
        {INFO[page].map((t) => t === "@delivery" ? (
          <div key={t} className="space-y-3">
            <p>{`Free delivery on orders of ${money(config.freeDeliveryLimit)} or more (Standard delivery).`}</p>
            <ul className="divide-y divide-accent/20 rounded-xl bg-white px-3">
              {areas.map((a) => <li key={a.id} className="flex justify-between gap-3 py-2"><span>{a.name}</span><span className="whitespace-nowrap font-semibold">{money(a.charge)}{a.courier ? ` · ${a.eta}` : ""}</span></li>)}
            </ul>
            <p>{`Time slots: ${slots.map((s) => s.label).join(", ")}. Express delivery (within ~90 minutes) is available in selected areas for an extra charge.`}</p>
          </div>
        ) : <p key={t}>{t}</p>)}
      </div>
    </Modal>
  );
}
