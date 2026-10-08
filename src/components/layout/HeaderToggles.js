"use client";
import { useI18n } from "@/context/I18nContext";
import { useTheme } from "@/context/ThemeContext";

// Language switch (EN | বাংলা) + dark/light toggle, shown in the header.
export default function HeaderToggles() {
  const { lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const seg = (code, label) => (
    <button type="button" onClick={() => setLang(code)} aria-pressed={lang === code} data-no-translate
      className={`px-2.5 py-1 text-xs font-bold transition ${lang === code ? "bg-primary text-white" : "text-primary hover:bg-primary-light"}`}>{label}</button>
  );
  return (
    <span className="flex items-center gap-2" data-no-translate>
      <span role="group" aria-label="Language" className="flex overflow-hidden rounded-full border border-primary/50">{seg("en", "EN")}{seg("bn", "বাংলা")}</span>
      <button type="button" onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={dark}
        className="grid h-8 w-8 place-items-center rounded-full border border-primary/50 text-primary transition hover:bg-primary-light">
        {dark
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" /></svg>}
      </button>
    </span>
  );
}