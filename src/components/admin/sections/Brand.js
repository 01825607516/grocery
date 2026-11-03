"use client";
import { useEffect, useState } from "react";
import { Btn, Card, Field, ImageField, Input, Select, TextArea, clean, isHttpUrl, uploadAsset, useAction } from "../ui";
import { SettingsGate, useStoreSettings } from "../settings";

const blank = (s) => {
  const c = s.site_content || {};
  const seo = s.seo || {};
  return {
    nameEn: s.brand_name_en || c.brand_name_en || c.brand_name || "",
    nameBn: s.brand_name_bn || c.brand_name_bn || "",
    mode: s.language_mode || (s.language === "bn" ? "bn" : "en"),
    logo: s.site_logo_url || c.logo_url || "",
    footerLogo: c.footer_logo_url || "",
    favicon: s.favicon_url || "",
    seo: { en: { title: "", description: "", keywords: "", ...(seo.en || {}) }, bn: { title: "", description: "", keywords: "", ...(seo.bn || {}) }, og_image: seo.og_image || "" },
  };
};

function Form() {
  const { settings, save } = useStoreSettings();
  const act = useAction();
  const [f, setF] = useState(() => blank(settings));
  const [start] = useState(() => blank(settings));
  useEffect(() => { setF(blank(settings)); }, [settings]);
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const setSeo = (lang, k) => (e) => setF((o) => ({ ...o, seo: { ...o.seo, [lang]: { ...o.seo[lang], [k]: e.target.value } } }));

  const submit = (e) => {
    e.preventDefault();
    for (const [label, v] of [["Header logo", f.logo], ["Footer logo", f.footerLogo], ["Favicon", f.favicon], ["Social preview image", f.seo.og_image]]) {
      if (v && !isHttpUrl(v)) return act.setErr(`${label} must be a full web address starting with https:// (or use Upload).`);
    }
    if (!f.nameEn.trim()) return act.setErr("The store name (English) is required.");
    const payload = {
      brand_name_en: f.nameEn.trim(),
      brand_name_bn: clean(f.nameBn),
      site_logo_url: clean(f.logo),
      favicon_url: clean(f.favicon),
      // the storefront header reads the logo and name from site_content
      site_content: { brand_name: f.nameEn.trim(), brand_name_en: f.nameEn.trim(), brand_name_bn: clean(f.nameBn) || "", logo_url: clean(f.logo), footer_logo_url: clean(f.footerLogo) },
      seo: { en: { title: clean(f.seo.en.title), description: clean(f.seo.en.description), keywords: clean(f.seo.en.keywords) }, bn: { title: clean(f.seo.bn.title), description: clean(f.seo.bn.description), keywords: clean(f.seo.bn.keywords) }, og_image: clean(f.seo.og_image) },
    };
    // The language is stored on the shop record: only send it when it was really changed.
    if (f.mode !== start.mode) { payload.language_mode = f.mode; payload.language = f.mode === "bn" ? "bn" : "en"; }
    act.run(() => save(payload), "Brand, language and SEO settings saved. The website shows them on the next page load.");
  };

  return (
    <form onSubmit={submit} className="grid gap-5">
      {act.box}
      <Card title="Store name, language & logos" description="The name and logo appear in the website header, footer and browser tab.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name (English) *"><Input required maxLength={100} value={f.nameEn} onChange={set("nameEn")} /></Field>
          <Field label="Store name (Bangla, optional)"><Input maxLength={100} value={f.nameBn} onChange={set("nameBn")} /></Field>
          <Field label="Website language" hint="“English and Bangla” adds the EN | বাংলা switch in the header.">
            <Select value={f.mode} onChange={set("mode")}>
              <option value="en">English only</option>
              <option value="bn">Bangla only</option>
              <option value="both">English and Bangla (visitors choose)</option>
            </Select>
          </Field>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <ImageField label="Header logo" value={f.logo} onChange={(v) => setF((o) => ({ ...o, logo: v }))} upload={(file) => uploadAsset("site_logo", file)} hint="PNG / JPG / WebP, up to 5 MB. Press Remove, then Save, to delete it and show the store name instead." previewClass="h-12" />
          <ImageField label="Footer logo" value={f.footerLogo} onChange={(v) => setF((o) => ({ ...o, footerLogo: v }))} upload={(file) => uploadAsset("brand_logo", file)} hint="Shown in the website footer. Leave empty to show the store name as text." previewClass="h-12" />
          <ImageField label="Favicon (browser tab icon)" value={f.favicon} onChange={(v) => setF((o) => ({ ...o, favicon: v }))} upload={(file) => uploadAsset("favicon", file)} hint="Small square image, .ico or .png." previewClass="h-10" />
        </div>
      </Card>

      <Card title="Search engine preview (SEO)" description="What Google and social apps show for your website. Fill English; Bangla is optional.">
        <div className="grid gap-4 md:grid-cols-2">
          {[["en", "English"], ["bn", "Bangla"]].map(([lang, title]) => (
            <fieldset key={lang} className="grid content-start gap-3 rounded-xl border border-accent/30 p-4">
              <legend className="px-1 font-display text-sm font-semibold text-primary-dark">{title}</legend>
              <Field label="Page title"><Input maxLength={191} value={f.seo[lang].title || ""} onChange={setSeo(lang, "title")} /></Field>
              <Field label="Description"><TextArea rows={3} maxLength={500} value={f.seo[lang].description || ""} onChange={setSeo(lang, "description")} /></Field>
              <Field label="Keywords" hint="Separate with commas."><Input maxLength={500} value={f.seo[lang].keywords || ""} onChange={setSeo(lang, "keywords")} /></Field>
            </fieldset>
          ))}
        </div>
        <div className="mt-4"><ImageField label="Social preview image" value={f.seo.og_image} onChange={(v) => setF((o) => ({ ...o, seo: { ...o.seo, og_image: v } }))} upload={(file) => uploadAsset("og_image", file)} hint="Shown when the link is shared on Facebook, WhatsApp, etc. (1200 × 630 works best)." previewClass="h-24" /></div>
      </Card>

      <div><Btn type="submit" disabled={act.busy}>{act.busy ? "Saving…" : "Save brand, language & SEO"}</Btn></div>
    </form>
  );
}

export default function Brand() { return <SettingsGate><Form /></SettingsGate>; }
