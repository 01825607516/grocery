"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext({ theme: "light", toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

// Sets class "dark" on <html>. Pair with THEME_SCRIPT in layout.js <head> to avoid a flash on first paint.
export const THEME_SCRIPT = `try{var t=localStorage.getItem("gs_theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}`;

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  useEffect(() => { setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light"); }, []);
  const toggle = useCallback(() => setTheme((cur) => {
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try { localStorage.setItem("gs_theme", next); } catch {}
    return next;
  }), []);
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
