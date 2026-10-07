"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DICT } from "@/lib/i18n";
import DomTranslate from "@/components/layout/DomTranslate";

const I18nContext = createContext({ lang: "en", setLang: () => {}, t: (k) => k });
export const useI18n = () => useContext(I18nContext);

// Wrap the app once (app/layout.js). Choice is remembered; <html lang> follows it.
export function I18nProvider({ children }) {
  const [lang, setLangState] = useState("en");
  useEffect(() => { try { const s = localStorage.getItem("gs_lang"); if (s === "bn" || s === "en") setLangState(s); } catch {} }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = useCallback((l) => { setLangState(l); try { localStorage.setItem("gs_lang", l); } catch {} }, []);
  const t = useCallback((k) => DICT[lang]?.[k] ?? DICT.en[k] ?? k, [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}<DomTranslate lang={lang} /></I18nContext.Provider>;
}
