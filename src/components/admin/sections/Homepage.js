"use client";
import { useEffect, useState } from "react";
import { Btn, Card, Field, ImageField, Input, TextArea, Toggle, clean, isHttpUrl, uploadAsset, useAction } from "../ui";
import { SettingsGate, useStoreSettings } from "../settings";

const DEFAULT_NAV = [["home", "Home"], ["categories", "Categories"], ["shop", "Shop"], ["top-saver", "Top Saver"], ["recommended", "For You"], ["reorder", "Reorder & Recipes"]];
const BANNER = [["live_now_label", "“Live now” label"], ["coming_soon_label", "“Coming soon” label"], ["up_to_label", "“Up to” label"], ["off_label", "“Off” label"], ["shop_now_label", "“Shop now” button"], ["ends_in_label", "“Ends in” label"], ["starts_in_label", "“Starts in” label"], ["hurry_up_label", "“Hurry up” text"], ["remind_label", "“Remind me” button"], ["reminder_set_label", "“Reminder set” text"]];

const init = (s) => {
  const c = s.site_content || {};
  const hero = c.hero || {};
  const saved = Array.isArray(c.nav) && c.nav.length ? c.nav : null;
  return {
    hero: { kicker: hero.kicker || "", title: hero.title || "", text: hero.text || "", image_url: /^https?:/i.test(hero.image_url || "") ? hero.image_url : "" },
    perks: Array.isArray(c.perks) ? c.perks.slice(0, 8) : [],
    banner: { ...(c.banner || {}) },
    nav: DEFAULT_NAV.map(([id, label]) => { const m = saved?.find((n) => n.id === id); return { id, label: m?.label || label, show: saved ? !!m : true }; }),
  };
};

function Form() {
  const { settings, save } = useStoreSettings();
  const act = useAction();
  const [f, setF] = useState(() => init(settings));
  useEffect(() => { setF(init(settings)); }, [settings]);
  const setHero = (k) => (e) => setF((o) => ({ ...o, hero: { ...o.hero, [k]: e.target.value } }));

  const submit = (e) => {
    e.preventDefault();
    if (f.hero.image_url && !isHttpUrl(f.hero.image_url)) return act.setErr("The hero image must be a full web address starting with https:// (or use Upload).");
    const nav = f.nav.filter((n) => n.show).map((n) => ({ id: n.id, label: n.label.trim() || DEFAULT_NAV.find(([id]) => id === n.id)[1] }));
    if (!nav.length) return act.setErr("Keep at least one menu item visible.");
    const banner = Object.fromEntries(Object.entries(f.banner).map(([k, v]) => [k, clean(v)]));
    const payload = {
      site_content: {
        // never send the built-in demo picture path: the backend only accepts full web addresses
        hero: { kicker: clean(f.hero.kicker), title: clean(f.hero.title), text: clean(f.hero.text), image_url: clean(f.hero.image_url) },
        perks: f.perks.map((p) => p.trim()).filter(Boolean),
        banner,
        nav,
      },
    };
    act.run(() => save(payload), "Homepage and menu saved. The website shows them on the next page load.");
  };

  return (
    <form onSubmit={submit} className="grid gap-5">
      {act.box}
      <Card title="Hero section" description="The big picture and headline at the top of the home page. Empty fields use the built-in text.">
        <div className="grid gap-4">
          <Field label="Small heading"><Input maxLength={120} value={f.hero.kicker} onChange={setHero("kicker")} placeholder="Freshly Grocery" /></Field>
          <Field label="Headline"><Input maxLength={240} value={f.hero.title} onChange={setHero("title")} placeholder="Grocery Shopping Made Fast, Easy & Affordable" /></Field>
          <Field label="Description"><TextArea maxLength={500} value={f.hero.text} onChange={setHero("text")} placeholder="Fresh groceries delivered to your door step, anywhere in Bangladesh." /></Field>
          <ImageField label="Background image" value={f.hero.image_url} onChange={(v) => setF((o) => ({ ...o, hero: { ...o.hero, image_url: v } }))} upload={(file) => uploadAsset("hero_image", file)} hint="Wide photo, at least 1600 px. Leave empty for the default picture." previewClass="h-28" />
        </div>
      </Card>

      <Card title="Menu" description="Rename the header menu links or hide the ones you do not need.">
        <div className="grid gap-3">
          {f.nav.map((n, i) => (
            <div key={n.id} className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1 basis-48"><Input maxLength={80} value={n.label} onChange={(e) => setF((o) => ({ ...o, nav: o.nav.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) }))} aria-label={`Menu label ${n.id}`} /></div>
              <Toggle checked={n.show} onChange={(v) => setF((o) => ({ ...o, nav: o.nav.map((x, j) => (j === i ? { ...x, show: v } : x)) }))} label="Show" />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Highlights" description="Short selling points shown under the hero (for example “Free delivery over ৳999”). Up to 8.">
        <div className="grid gap-2">
          {f.perks.map((p, i) => (
            <div key={i} className="flex gap-2">
              <Input maxLength={80} value={p} onChange={(e) => setF((o) => ({ ...o, perks: o.perks.map((x, j) => (j === i ? e.target.value : x)) }))} aria-label={`Highlight ${i + 1}`} />
              <Btn variant="secondary" onClick={() => setF((o) => ({ ...o, perks: o.perks.filter((_, j) => j !== i) }))}>Remove</Btn>
            </div>
          ))}
          {f.perks.length < 8 && <div><Btn variant="secondary" onClick={() => setF((o) => ({ ...o, perks: [...o.perks, ""] }))}>+ Add highlight</Btn></div>}
        </div>
      </Card>

      <Card title="Offer banner wording" description="Change the small texts around offers. Empty = default wording.">
        <div className="grid gap-3 md:grid-cols-2">
          {BANNER.map(([k, label]) => <Field key={k} label={label}><Input maxLength={80} value={f.banner[k] || ""} onChange={(e) => setF((o) => ({ ...o, banner: { ...o.banner, [k]: e.target.value } }))} /></Field>)}
        </div>
      </Card>

      <div><Btn type="submit" disabled={act.busy}>{act.busy ? "Saving…" : "Save homepage & menu"}</Btn></div>
    </form>
  );
}
export default function Homepage() { return <SettingsGate><Form /></SettingsGate>; }
