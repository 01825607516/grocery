"use client";
import { useEffect, useState } from "react";
import { INFO } from "@/lib/info";
import { Btn, Card, Field, Input, Select, TextArea, clean, isHttpUrl, useAction } from "../ui";
import { SettingsGate, useStoreSettings } from "../settings";

const SUPPORT = [["phone", "Phone number"], ["phone_label", "Phone shown on site (e.g. 09 4932 4782)"], ["whatsapp", "WhatsApp number"], ["email", "Support email"], ["address", "Address"], ["hours_en", "Opening hours (English)"], ["hours_bn", "Opening hours (Bangla)"]];
const PLATFORMS = ["Facebook", "Instagram", "YouTube", "X (Twitter)", "TikTok", "LinkedIn", "WhatsApp", "Other"];
const PAGES = Object.keys(INFO);

const initInfo = (s, lang, page) => {
  const custom = s.info_pages?.[lang]?.[page];
  const paras = Array.isArray(custom) && custom.length ? custom : (INFO[page] || []);
  return paras.join("\n\n");
};

function Form() {
  const { settings: s, save } = useStoreSettings();
  const contact = useAction(), social = useAction(), footer = useAction(), pages = useAction();
  const [sup, setSup] = useState({});
  const [links, setLinks] = useState([]);
  const [foot, setFoot] = useState({ brand_description: "", copyright: "" });
  const [lang, setLang] = useState("en");
  const [page, setPage] = useState(PAGES[0]);
  const [text, setText] = useState("");

  useEffect(() => {
    setSup({ ...(s.support || {}) });
    setLinks(Array.isArray(s.social_links) ? s.social_links.map((l) => ({ platform: l.platform || "Other", name: l.name || "", url: l.url || "" })) : []);
    setFoot({ brand_description: s.footer_content?.brand_description || "", copyright: s.footer_content?.copyright || "" });
  }, [s]);
  useEffect(() => { setText(initInfo(s, lang, page)); }, [s, lang, page]);

  const saveContact = (e) => {
    e.preventDefault();
    const support = Object.fromEntries(SUPPORT.map(([k]) => [k, clean(sup[k])]));
    if (support.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(support.email)) return contact.setErr("Please enter a valid email address.");
    contact.run(() => save({ support }), "Contact details saved.");
  };
  const saveSocial = (e) => {
    e.preventDefault();
    const rows = links.filter((l) => l.url.trim());
    const bad = rows.find((l) => !isHttpUrl(l.url));
    if (bad) return social.setErr(`“${bad.url}” is not a full web address. Start it with https://`);
    social.run(() => save({ social_links: rows.map((l) => ({ platform: l.platform, name: l.name.trim() || l.platform, url: l.url.trim() })) }), "Social links saved.");
  };
  const saveFooter = (e) => {
    e.preventDefault();
    footer.run(() => save({ footer_content: { brand_description: clean(foot.brand_description) || "", copyright: clean(foot.copyright) || "" } }), "Footer text saved.");
  };
  const savePage = (e) => {
    e.preventDefault();
    const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    pages.run(() => save({ info_pages: { [lang]: { [page]: paras } } }), `“${page}” (${lang === "en" ? "English" : "Bangla"}) saved.`);
  };
  const resetPage = () => pages.run(() => save({ info_pages: { [lang]: { [page]: [] } } }), "Back to the built-in text.");

  return (
    <div className="grid gap-5">
      <form onSubmit={saveContact}>
        <Card title="Contact details" description="Shown in the header, footer and the Contact page.">
          {contact.box}
          <div className="grid gap-4 md:grid-cols-2">
            {SUPPORT.map(([k, label]) => <Field key={k} label={label}><Input value={sup[k] || ""} onChange={(e) => setSup((o) => ({ ...o, [k]: e.target.value }))} /></Field>)}
          </div>
          <div className="mt-4"><Btn type="submit" disabled={contact.busy}>{contact.busy ? "Saving…" : "Save contact details"}</Btn></div>
        </Card>
      </form>

      <form onSubmit={saveSocial}>
        <Card title="Social links" description="Shown in the footer. Use full addresses, for example https://facebook.com/yourshop.">
          {social.box}
          <div className="grid gap-3">
            {links.map((l, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
                <Select value={l.platform} onChange={(e) => setLinks((o) => o.map((x, j) => (j === i ? { ...x, platform: e.target.value } : x)))} aria-label="Platform">{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</Select>
                <Input placeholder="https://…" value={l.url} onChange={(e) => setLinks((o) => o.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} aria-label="Link address" />
                <Btn variant="secondary" onClick={() => setLinks((o) => o.filter((_, j) => j !== i))}>Remove</Btn>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {links.length < 20 && <Btn variant="secondary" onClick={() => setLinks((o) => [...o, { platform: "Facebook", name: "", url: "" }])}>+ Add link</Btn>}
              <Btn type="submit" disabled={social.busy}>{social.busy ? "Saving…" : "Save social links"}</Btn>
            </div>
          </div>
        </Card>
      </form>

      <form onSubmit={saveFooter}>
        <Card title="Footer text">
          {footer.box}
          <div className="grid gap-4">
            <Field label="Store description"><TextArea value={foot.brand_description} onChange={(e) => setFoot((o) => ({ ...o, brand_description: e.target.value }))} /></Field>
            <Field label="Copyright line" hint="Empty = “© year Store name. All rights reserved.”"><Input value={foot.copyright} onChange={(e) => setFoot((o) => ({ ...o, copyright: e.target.value }))} /></Field>
          </div>
          <div className="mt-4"><Btn type="submit" disabled={footer.busy}>{footer.busy ? "Saving…" : "Save footer"}</Btn></div>
        </Card>
      </form>

      <form onSubmit={savePage}>
        <Card title="Information pages" description="Edit Help Center, Return & Refund, Privacy, Terms and the other footer pages. Separate paragraphs with an empty line.">
          {pages.box}
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <Field label="Page"><Select value={page} onChange={(e) => setPage(e.target.value)}>{PAGES.map((p) => <option key={p}>{p}</option>)}</Select></Field>
            <Field label="Language"><Select value={lang} onChange={(e) => setLang(e.target.value)}><option value="en">English</option><option value="bn">Bangla</option></Select></Field>
          </div>
          <Field label="Page text" hint={page === "Delivery Information" ? "A line with only @delivery inserts the live delivery-charge table." : undefined}><TextArea rows={12} value={text} onChange={(e) => setText(e.target.value)} /></Field>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn type="submit" disabled={pages.busy}>{pages.busy ? "Saving…" : "Save page"}</Btn>
            <Btn variant="secondary" disabled={pages.busy} onClick={resetPage}>Use built-in text</Btn>
          </div>
        </Card>
      </form>
    </div>
  );
}
export default function Content() { return <SettingsGate><Form /></SettingsGate>; }
