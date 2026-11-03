"use client";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_THEME, FONTS, PRESETS, RADII, TEXT_SIZES, applyTheme, autoColor, isHex } from "@/lib/theme";
import { Btn, Card, Field, Input, Select, useAction } from "../ui";
import { SettingsGate, useStoreSettings } from "../settings";

// Main colours: always set.
const COLORS = [
  ["primary", "Main colour", "Buttons, headings, icons and links"],
  ["accent", "Accent colour", "Thin lines, highlights, small badges"],
  ["cream", "Page background", "The page behind everything"],
  ["card", "Card colour", "White boxes: product cards, pop-ups, forms"],
  ["ink", "Text colour", "Normal text everywhere"],
];
// Optional colours: leave on "Automatic" and the website works them out from the main colour, or pick your own.
const OPTIONAL = [
  ["primary_dark", "Header bar & footer colour", "The dark strip at the top and the footer"],
  ["primary_light", "Soft tint colour", "Light backgrounds behind icons, hover states"],
  ["accent_dark", "Accent (darker) colour", "Hover and pressed accent"],
];
const fromSaved = (s) => ({ ...DEFAULT_THEME, ...(s.site_content?.theme || {}) });

function ColorPick({ label, hint, value, onChange, auto, onAuto }) {
  const shown = isHex(value) ? value : (auto || "#000000");
  return (
    <div className="text-sm font-medium text-ink/80">
      {label}
      <div className="mt-1 flex items-center gap-2">
        <input type="color" value={shown} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-accent/40 bg-white p-1" aria-label={label} />
        <input value={value || ""} placeholder={auto ? "Automatic" : ""} onChange={(e) => onChange(e.target.value)} maxLength={7} className="w-28 rounded-lg border border-accent/40 bg-white px-3 py-2 text-sm uppercase outline-none focus:border-primary" aria-label={`${label} hex`} />
        {auto && <button type="button" onClick={onAuto} disabled={!value} className="text-xs font-semibold text-primary underline disabled:opacity-40 disabled:no-underline">Automatic</button>}
      </div>
      <small className="mt-1 block text-xs font-normal text-ink/50">{hint}</small>
    </div>
  );
}

function Form() {
  const { settings, save } = useStoreSettings();
  const act = useAction();
  const saved = useRef(settings.site_content?.theme);
  const [t, setT] = useState(() => fromSaved(settings));
  useEffect(() => { saved.current = settings.site_content?.theme; setT(fromSaved(settings)); }, [settings]);
  // live preview: the whole panel (and its preview card) changes while you pick; leaving the page restores the saved look
  useEffect(() => { applyTheme(t); }, [t]);
  useEffect(() => () => applyTheme(saved.current), []);
  const set = (k) => (v) => setT((o) => ({ ...o, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    for (const [k, label] of COLORS) if (!isHex(t[k])) return act.setErr(`${label} must be a colour like #1f4d3a.`);
    for (const [k, label] of OPTIONAL) if (t[k] && !isHex(t[k])) return act.setErr(`${label} must be a colour like #1f4d3a, or leave it empty for Automatic.`);
    const theme = { font_display: t.font_display, font_body: t.font_body, font_custom_display: (t.font_custom_display || "").trim(), font_custom_body: (t.font_custom_body || "").trim(), text_size: t.text_size, radius: t.radius };
    for (const [k] of COLORS) theme[k] = t[k].toLowerCase();
    for (const [k] of OPTIONAL) theme[k] = t[k] ? t[k].toLowerCase() : "";
    act.run(() => save({ site_content: { theme } }), "Look & feel saved. The website shows it on the next page load.");
  };
  const reset = () => act.run(async () => { await save({ site_content: { theme: {} } }); }, "Back to the original look.");

  return (
    <form onSubmit={submit} className="grid gap-5">
      {act.box}
      <Card title="Ready-made looks" description="Pick one to start, then change any colour below. You see the change on this page straight away.">
        <div className="flex flex-wrap gap-3">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" onClick={() => setT((o) => ({ ...o, primary: p.primary, accent: p.accent, cream: p.cream, ink: p.ink, primary_dark: "", primary_light: "", accent_dark: "" }))} className="flex items-center gap-2 rounded-xl border border-accent/40 px-3 py-2 text-sm font-semibold transition hover:bg-primary-light">
              <span className="flex overflow-hidden rounded-full ring-1 ring-black/10"><i className="h-6 w-6" style={{ background: p.primary }} /><i className="h-6 w-6" style={{ background: p.accent }} /><i className="h-6 w-6" style={{ background: p.cream }} /></span>{p.label}
            </button>
          ))}
        </div>
      </Card>
      <Card title="Colours" description="Choose any colour you like, for every part of the website.">
        <div className="grid gap-5 sm:grid-cols-2">{COLORS.map(([k, label, hint]) => <ColorPick key={k} label={label} hint={hint} value={t[k]} onChange={set(k)} />)}</div>
      </Card>
      <Card title="More colours (optional)" description="Leave these on Automatic and they follow your main colour. Pick one only if you want a different shade.">
        <div className="grid gap-5 sm:grid-cols-2">{OPTIONAL.map(([k, label, hint]) => <ColorPick key={k} label={label} hint={hint} value={t[k]} onChange={set(k)} auto={autoColor(t, k)} onAuto={() => set(k)("")} />)}</div>
      </Card>
      <Card title="Text style & corners">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Headings font"><Select value={t.font_display} onChange={(e) => set("font_display")(e.target.value)}>{Object.entries(FONTS).map(([id, f]) => <option key={id} value={id}>{f.label}</option>)}</Select></Field>
          <Field label="Body text font"><Select value={t.font_body} onChange={(e) => set("font_body")(e.target.value)}>{Object.entries(FONTS).map(([id, f]) => <option key={id} value={id}>{f.label}</option>)}</Select></Field>
          <Field label="Text size (whole website)"><Select value={t.text_size} onChange={(e) => set("text_size")(e.target.value)}>{Object.entries(TEXT_SIZES).map(([id, f]) => <option key={id} value={id}>{f.label}</option>)}</Select></Field>
          <Field label="Corners (buttons, cards)"><Select value={t.radius} onChange={(e) => set("radius")(e.target.value)}>{Object.entries(RADII).map(([id, r]) => <option key={id} value={id}>{r.label}</option>)}</Select></Field>
          <Field label="Own headings font name (optional)" hint="A font installed on the visitor's device, e.g. Arial."><Input maxLength={60} value={t.font_custom_display || ""} onChange={(e) => set("font_custom_display")(e.target.value)} placeholder="e.g. Arial" /></Field>
          <Field label="Own body font name (optional)" hint="Used instead of the font chosen above."><Input maxLength={60} value={t.font_custom_body || ""} onChange={(e) => set("font_custom_body")(e.target.value)} placeholder="e.g. Verdana" /></Field>
        </div>
      </Card>
      <Card title="Preview">
        <div className="overflow-hidden rounded-2xl border border-accent/40 bg-cream">
          <div className="bg-primary-dark px-4 py-1.5 text-xs text-cream/90">Delivery area · Call 09 4932 4782</div>
          <div className="p-5">
            <p className="font-display text-2xl font-bold text-primary">Freshly<span className="text-accent">.</span></p>
            <p className="mt-2 max-w-md text-sm text-ink/80">Fresh groceries delivered to your door step. This is how normal text looks.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="btn">Add to cart</span>
              <span className="rounded-full bg-coffee px-6 py-2 font-display font-semibold text-cream ring-1 ring-accent">Section heading</span>
              <span className="rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-accent/40">A card</span>
            </div>
          </div>
        </div>
      </Card>
      <div className="flex flex-wrap gap-2"><Btn type="submit" disabled={act.busy}>{act.busy ? "Saving…" : "Save look & feel"}</Btn><Btn variant="secondary" disabled={act.busy} onClick={reset}>Reset to original look</Btn></div>
    </form>
  );
}
export default function Appearance() { return <SettingsGate><Form /></SettingsGate>; }
