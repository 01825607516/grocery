"use client";
import { useEffect, useState } from "react";

// The site is one long page: every section is one screen tall and they are stacked in this order.
// useView() is a scroll-spy: it returns the id of the section the visitor is looking at right now,
// so the nav can highlight it. Clicking a nav link just scrolls to that section (#id anchor).
export const VIEWS = ["home", "categories", "shop", "top-saver", "recommended", "reorder"];

export default function useView() {
  const [view, setView] = useState("home");
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const line = window.innerHeight * 0.4; // a section is "current" once its top passes this line
      let cur = VIEWS[0];
      for (const id of VIEWS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) cur = id;
      }
      setView(cur);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return view;
}