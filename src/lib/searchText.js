import { toBangla } from "@/components/layout/DomTranslate";

// Search helper: returns the text in lower-case English PLUS its Bangla form, so a shopper can type either
// "mango" or "আম" and find the same product (names are translated with src/lib/bnPhrases*.js).
export const hay = (s) => {
  const raw = String(s ?? "");
  const t = raw.toLowerCase();
  const b = toBangla(raw);
  return b === raw ? t : `${t} ${b}`;
};
