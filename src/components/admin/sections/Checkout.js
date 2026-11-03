"use client";
import { useEffect, useState } from "react";
import { Btn, Card, Field, Input, useAction } from "../ui";
import { SettingsGate, useStoreSettings } from "../settings";

const FIELDS = [
  ["free_delivery_over", "Free delivery over (৳)", "Orders at or above this amount get free standard delivery. 0 = never free.", "0.01"],
  ["delivery_fee", "Default delivery fee (৳)", "Used when an area has no charge of its own. Area charges are set in “Delivery areas & slots”.", "0.01"],
  ["express_fee", "Express delivery fee (৳)", "Extra charge for express (about 90 minutes) delivery. 0 = no express.", "0.01"],
  ["max_qty_per_line", "Most pieces per product", "Highest quantity of one product in a single order.", "1"],
  ["return_window_days", "Return window (days)", "How many days after delivery a customer may ask for a return.", "1"],
];
const pick = (s) => Object.fromEntries(FIELDS.map(([k]) => [k, s[k] ?? ""]));

function Form() {
  const { settings, save } = useStoreSettings();
  const act = useAction();
  const [f, setF] = useState(() => pick(settings));
  useEffect(() => { setF(pick(settings)); }, [settings]);

  const submit = (e) => {
    e.preventDefault();
    const payload = {};
    for (const [k] of FIELDS) {
      if (f[k] === "" || f[k] === null) continue;
      const n = Number(f[k]);
      if (!Number.isFinite(n) || n < 0) return act.setErr("Please enter valid numbers (0 or more).");
      payload[k] = n;
    }
    if (payload.max_qty_per_line !== undefined && payload.max_qty_per_line < 1) return act.setErr("“Most pieces per product” must be at least 1.");
    if (!Object.keys(payload).length) return act.setErr("Enter at least one value.");
    act.run(() => save(payload), "Checkout rules saved.");
  };

  return (
    <form onSubmit={submit} className="grid gap-5">
      {act.box}
      <Card title="Delivery & order rules" description="These rules are applied when customers check out.">
        <div className="grid gap-4 md:grid-cols-2">
          {FIELDS.map(([k, label, hint, step]) => (
            <Field key={k} label={label} hint={hint}><Input type="number" min="0" step={step} value={f[k]} onChange={(e) => setF((o) => ({ ...o, [k]: e.target.value }))} /></Field>
          ))}
        </div>
      </Card>
      <div><Btn type="submit" disabled={act.busy}>{act.busy ? "Saving…" : "Save checkout rules"}</Btn></div>
    </form>
  );
}
export default function Checkout() { return <SettingsGate><Form /></SettingsGate>; }
