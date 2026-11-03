"use client";
import { useEffect, useState } from "react";
import { HEADINGS, HOME_SECTIONS, mergeSections } from "@/lib/theme";
import { Btn, Card, Field, Input, Toggle, useAction } from "../ui";
import { SettingsGate, useStoreSettings } from "../settings";

const label = (id) => HOME_SECTIONS.find(([x]) => x === id)?.[1] || id;

function Form() {
  const { settings: s, save } = useStoreSettings();
  const c = s.site_content || {};
  const lay = useAction(), titles = useAction();
  const [sections, setSections] = useState(() => mergeSections(c.layout?.sections));
  const [hero, setHero] = useState(c.layout?.hero !== false);
  const [topbar, setTopbar] = useState(c.layout?.topbar !== false);
  const [heads, setHeads] = useState({ ...(c.section_titles || {}) });
  useEffect(() => {
    setSections(mergeSections(c.layout?.sections)); setHero(c.layout?.hero !== false); setTopbar(c.layout?.topbar !== false);
    setHeads({ ...(c.section_titles || {}) });
  }, [s]); // eslint-disable-line react-hooks/exhaustive-deps

  const move = (i, d) => setSections((o) => { const n = [...o]; const j = i + d; if (j < 0 || j >= n.length) return o; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const saveLayout = (e) => { e.preventDefault(); lay.run(() => save({ site_content: { layout: { hero, topbar, sections } } }), "Home layout saved."); };
  const saveTitles = (e) => {
    e.preventDefault();
    const out = Object.fromEntries(Object.entries(heads).map(([k, v]) => [k, String(v || "").trim()]).filter(([, v]) => v));
    titles.run(() => save({ site_content: { section_titles: out } }), "Headings saved.");
  };

  return (
    <div className="grid gap-5">
      <form onSubmit={saveLayout}>
        <Card title="Home page sections" description="Show or hide each section and change the order. A hidden section also loses its link in the header menu.">
          {lay.box}
          <div className="grid gap-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle checked={hero} onChange={setHero} label="Hero (big picture at the top)" />
              <Toggle checked={topbar} onChange={setTopbar} label="Header top bar" hint="Delivery area, sale countdown and phone." />
            </div>
            <ol className="grid gap-2">
              {sections.map((sec, i) => (
                <li key={sec.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-accent/30 px-3 py-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-light text-xs font-bold text-primary-dark">{i + 1}</span>
                  <span className={`min-w-0 flex-1 font-semibold ${sec.show ? "" : "text-ink/40 line-through"}`}>{label(sec.id)}</span>
                  <Toggle checked={sec.show} onChange={(v) => setSections((o) => o.map((x, j) => (j === i ? { ...x, show: v } : x)))} label="Show" />
                  <span className="flex gap-1"><Btn variant="secondary" className="!px-3 !py-1.5" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</Btn><Btn variant="secondary" className="!px-3 !py-1.5" disabled={i === sections.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</Btn></span>
                </li>
              ))}
            </ol>
            <div><Btn type="submit" disabled={lay.busy}>{lay.busy ? "Saving…" : "Save layout"}</Btn></div>
          </div>
        </Card>
      </form>

      <form onSubmit={saveTitles}>
        <Card title="Section headings" description="Change the title above each section. Empty = the original wording.">
          {titles.box}
          <div className="grid gap-4 sm:grid-cols-2">
            {HEADINGS.map((h) => <Field key={h} label={h}><Input maxLength={80} placeholder={h} value={heads[h] || ""} onChange={(e) => setHeads((o) => ({ ...o, [h]: e.target.value }))} /></Field>)}
          </div>
          <div className="mt-4"><Btn type="submit" disabled={titles.busy}>{titles.busy ? "Saving…" : "Save headings"}</Btn></div>
        </Card>
      </form>
    </div>
  );
}
export default function Layout() { return <SettingsGate><Form /></SettingsGate>; }
