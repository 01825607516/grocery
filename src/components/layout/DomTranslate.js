"use client";
import { useEffect } from "react";
import { FALLBACKS, PATTERNS, PHRASES } from "@/lib/bnPhrases";

// Turns the whole page into Bangla (and back) without editing every component:
// it swaps visible text, placeholders, aria-labels and titles using lib/bnPhrases.js, and keeps watching for new text (cart updates,
// popups, timers...). Numbers become Bangla digits. Mark something data-no-translate to skip it. English is restored exactly.
const BN = "০১২৩৪৫৬৭৮৯";
const ATTRS = ["placeholder", "aria-label", "title"];
const SKIP = "script,style,textarea,noscript,[data-no-translate]";
// kept at module level: switching back to English must still know the original text
const texts = new WeakMap();   // text node -> { src (English), out (Bangla we wrote) }
const attrs = new WeakMap();   // element -> { attr: { src, out } }
// digits -> Bangla digits, but leave codes like ORD-123456 / FRESH10 alone
const digits = (s) => s.replace(/[A-Za-z][A-Za-z-]*\d+|\d+/g, (m) => (/^\d+$/.test(m) ? m.replace(/\d/g, (d) => BN[d]) : m));

export function toBangla(raw) {
  const m = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const core = m[2];
  if (!core || !/[A-Za-z0-9]/.test(core)) return raw;
  let out = Object.prototype.hasOwnProperty.call(PHRASES, core) ? PHRASES[core] : undefined;
  if (out === undefined) for (const [re, fn] of PATTERNS) { const x = core.match(re); if (x) { out = fn(...x.slice(1)); break; } }
  if (out === undefined) out = core;
  if (/\d/.test(out)) for (const [re, fn] of FALLBACKS) out = out.replace(re, fn); // dates, units, times inside any sentence
  return m[1] + digits(out) + m[3];
}

export default function DomTranslate({ lang }) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const bn = lang === "bn";
    if (!window.__gsTitle) window.__gsTitle = document.title;
    document.title = bn ? toBangla(window.__gsTitle) : window.__gsTitle;

    const doText = (n) => {
      const cur = n.nodeValue, rec = texts.get(n);
      if (!bn) { if (rec && cur === rec.out) { n.nodeValue = rec.src; } texts.delete(n); return; }
      if (n.parentElement?.closest(SKIP)) return;
      const src = rec && cur === rec.out ? rec.src : cur;
      const out = toBangla(src);
      if (out !== cur) { texts.set(n, { src, out }); n.nodeValue = out; } else if (out !== src) texts.set(n, { src, out });
    };
    const doAttr = (el, a) => {
      const store = attrs.get(el) || {}; const rec = store[a]; const cur = el.getAttribute(a);
      if (cur == null) return;
      if (!bn) { if (rec && cur === rec.out) el.setAttribute(a, rec.src); delete store[a]; return; }
      if (el.closest(SKIP)) return;
      const src = rec && cur === rec.out ? rec.src : cur;
      const out = toBangla(src);
      if (out !== cur) { store[a] = { src, out }; attrs.set(el, store); el.setAttribute(a, out); }
    };
    const scan = (root) => {
      if (root.nodeType === 3) return doText(root);
      if (root.nodeType !== 1) return;
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n; const list = [];
      while ((n = tw.nextNode())) list.push(n);
      list.forEach(doText);
      const els = root.querySelectorAll ? [root, ...root.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(","))] : [];
      els.forEach((el) => ATTRS.forEach((a) => el.hasAttribute?.(a) && doAttr(el, a)));
    };

    let queue = new Set(), raf = 0;
    const mo = new MutationObserver((muts) => {
      if (!bn) return;
      for (const mu of muts) {
        if (mu.type === "characterData") queue.add(mu.target);
        else if (mu.type === "attributes") queue.add({ el: mu.target, a: mu.attributeName });
        else mu.addedNodes.forEach((x) => queue.add(x));
      }
      if (!raf) raf = requestAnimationFrame(flush);
    });
    const watch = () => mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    function flush() {
      raf = 0; mo.disconnect();
      const q = queue; queue = new Set();
      q.forEach((x) => (x.el ? doAttr(x.el, x.a) : x.isConnected && scan(x)));
      watch();
    }

    mo.disconnect(); scan(document.body); watch();
    return () => { mo.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [lang]);
  return null;
}
