import { hay } from "@/lib/searchText";
import { lineTotal, maxQty, stepOf } from "@/lib/format";

// ---------------------------------------------------------------------------
// Smart grocery list: "peyaj, chal 2kg, dim, tel" or "পেঁয়াজ, চাল" -> products.
// Banglish / Bangla words are mapped to the English product words. "word|category" limits the match to one category.
// Add more words here any time - nothing else needs to change.
// ---------------------------------------------------------------------------
const ALIAS = {
  chal: "miniket,basmati|grains", chaal: "miniket,basmati|grains", চাল: "miniket,basmati|grains", চাউল: "miniket,basmati|grains", rice: "miniket,basmati|grains", miniket: "miniket|grains", polao: "basmati|grains",
  dal: "dal,lentils|grains", daal: "dal,lentils|grains", ডাল: "dal,lentils|grains", moog: "mung|grains", masoor: "red lentils|grains",
  atta: "flour|grains", আটা: "flour|grains", moida: "maida|grains", ময়দা: "maida|grains", chira: "flattened rice|grains", চিড়া: "flattened rice|grains",
  peyaj: "onion|veg", piyaj: "onion|veg", peyaz: "onion|veg", পেঁয়াজ: "onion|veg", পেয়াজ: "onion|veg", onion: "onion|veg",
  alu: "potato|veg", aloo: "potato|veg", আলু: "potato|veg", potato: "potato|veg",
  tomato: "tomato|veg", টমেটো: "tomato|veg", begun: "brinjal|veg", বেগুন: "brinjal|veg", gajor: "carrot|veg", গাজর: "carrot|veg",
  shosha: "cucumber|veg", শসা: "cucumber|veg", palong: "spinach|veg", পালংশাক: "spinach|veg", fulkopi: "cauliflower|veg", ফুলকপি: "cauliflower|veg",
  morich: "green chili|veg", lonka: "green chili|veg", মরিচ: "green chili|veg", কাঁচামরিচ: "green chili|veg", chili: "green chili|veg",
  kumra: "pumpkin|veg", কুমড়া: "pumpkin|veg",
  dim: "egg|dairy", ডিম: "egg|dairy", egg: "egg|dairy", eggs: "egg|dairy",
  dudh: "milk|dairy", দুধ: "milk|dairy", milk: "fresh milk|dairy", doi: "yogurt|dairy", দই: "yogurt|dairy",
  makhon: "butter|dairy", মাখন: "butter|dairy", ghee: "ghee|dairy", ghi: "ghee|dairy", ঘি: "ghee|dairy", cheese: "cheese|dairy", paneer: "paneer|dairy",
  murgi: "broiler,chicken|meat", মুরগি: "broiler,chicken|meat", murgir: "broiler,chicken|meat", chicken: "broiler,chicken|meat",
  gorur: "beef|meat", গরুর: "beef|meat", mangsho: "beef|meat", মাংস: "beef|meat", khashi: "mutton|meat", খাসি: "mutton|meat",
  mach: "fish,ilish|meat", মাছ: "fish,ilish|meat", fish: "fish,ilish|meat", ilish: "ilish,hilsa|meat", ইলিশ: "ilish,hilsa|meat",
  rui: "rohu|meat", রুই: "rohu|meat", chingri: "prawn|meat", চিংড়ি: "prawn|meat",
  tel: "oil|pantry", তেল: "oil|pantry", oil: "oil|pantry", soyabean: "soybean oil|pantry", sorisha: "mustard oil|pantry", সরিষা: "mustard oil|pantry",
  cheeni: "sugar|pantry", chini: "sugar|pantry", চিনি: "sugar|pantry", sugar: "sugar|pantry",
  lobon: "salt|pantry", nun: "salt|pantry", লবণ: "salt|pantry", নুন: "salt|pantry", salt: "salt|pantry",
  pauruti: "bread|bakery", পাউরুটি: "bread|bakery", bread: "bread|bakery",
  holud: "turmeric|spices", হলুদ: "turmeric|spices", jira: "cumin|spices", জিরা: "cumin|spices", dhone: "coriander|spices", ধনিয়া: "coriander|spices",
  morichgura: "chili powder|spices", gorommoshla: "garam masala|spices", গরমমসলা: "garam masala|spices", moshla: "masala|spices", মসলা: "masala|spices",
  cha: "tea|drinks", চা: "tea|drinks", tea: "tea|drinks", coffee: "coffee|drinks", pani: "water|drinks", পানি: "water|drinks",
  kola: "banana|fruits", কলা: "banana|fruits", aam: "mango|fruits", আম: "mango|fruits", apel: "apple|fruits", আপেল: "apple|fruits",
  komola: "orange|fruits", কমলা: "orange|fruits", angur: "grapes|fruits", আঙ্গুর: "grapes|fruits", pepe: "papaya|fruits", পেঁপে: "papaya|fruits",
  tormuj: "watermelon|fruits", তরমুজ: "watermelon|fruits", peyara: "guava|fruits", পেয়ারা: "guava|fruits", lichu: "litchi|fruits", লিচু: "litchi|fruits",
  anar: "pomegranate|fruits", আনার: "pomegranate|fruits",
  noodles: "noodles|noodles", nuddles: "noodles|noodles", biscuit: "biscuit|sweets", বিস্কুট: "biscuit|sweets",
};
const STOP = new Set(["of", "the", "a", "an", "some", "fresh", "pack", "packet", "ta", "ti", "tk", "taka", "and", "kg", "g", "gm", "pcs", "pc", "piece", "pieces", "টা", "টি", "কেজি", "গ্রাম", "পিস"]);
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const norm = (s) => String(s ?? "").replace(/[০-৯]/g, (d) => BN_DIGITS.indexOf(d)).toLowerCase().trim();
const QTY = /(\d+(?:\.\d+)?)\s*(kg|kilo|কেজি|gms?|grams?|g|গ্রাম|pcs?|pieces?|পিস)?(?![a-z])/i;
const GRAM = /^(g|gm|gms|gram|grams|গ্রাম)$/;
const KILO = /^(kg|kilo|কেজি)$/;

// "chal 2kg" -> { words: ["chal"], num: 2, unit: "kg" }
export function parseEntry(raw) {
  let s = norm(raw).replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "");
  let num = null, unit = "";
  const m = s.match(QTY);
  if (m) { num = parseFloat(m[1]); unit = (m[2] || "").toLowerCase(); s = s.replace(m[0], " "); }
  const words = s.split(/[^\p{L}\p{M}\p{N}]+/u).filter((w) => w && !STOP.has(w));
  return { words, num, unit };
}

// quantity for a chosen product: weight items go in 500 g steps, packs/pieces are counted
export function qtyFor(p, num, unit) {
  const step = stepOf(p);
  if (num == null) return step;
  let n = num;
  if (p.unit === "kg") { if (GRAM.test(unit)) n = num / 1000; else if (!KILO.test(unit) && unit) n = step; }
  else if (GRAM.test(unit) || KILO.test(unit)) return step; // "rice 5kg" = the 5 kg pack, not 5 packs
  n = Math.max(step, Math.round(n / step) * step);
  return Math.min(n, maxQty(p)) || step;
}

const groupFor = (w) => {
  const a = ALIAS[w];
  if (!a) return { any: [w] };
  const [list, cat] = a.split("|");
  return { any: list.split(","), cat };
};

// Turn the shopper's text into rows. Each row keeps up to 4 candidate products so the shopper can swap.
export function parseList(text, products) {
  const parts = String(text || "").split(/[,\n;،+]+|\s+and\s+|\s+আর\s+|\s+ও\s+/i).map((x) => x.trim()).filter(Boolean);
  const byName = products.map((p) => ({ p, txt: hay(p.name) }));
  const bySub = products.map((p) => ({ p, txt: hay(p.sub) })); // only used when no product NAME matches
  return parts.map((raw, key) => {
    const { words, num, unit } = parseEntry(raw);
    const whole = ALIAS[words.join("")] ? [groupFor(words.join(""))] : words.map(groupFor); // "morich gura" style phrases
    const hit = (g, x) => g.any.some((n) => x.txt.includes(n)) && (!g.cat || x.p.category === g.cat);
    const all = (idx) => (whole.length ? idx.filter((x) => whole.every((g) => hit(g, x))) : []);
    let found = all(byName);
    if (!found.length) found = all(bySub);
    if (!found.length && whole.length > 1) found = byName.filter((x) => whole.some((g) => hit(g, x)));
    const scored = found.map((x) => ({
      p: x.p,
      score: whole.reduce((s, g) => s + (g.any.some((n) => hay(x.p.name).startsWith(n)) ? 3 : 1), 0) + (x.p.status === "out" ? -10 : 0) + (x.p.status === "fresh" ? 0.5 : 0),
    })).sort((a, b) => b.score - a.score || a.p.price - b.p.price);
    const cands = scored.filter((s) => s.p.status !== "out").slice(0, 4).map((s) => s.p);
    const pick = cands[0] || null;
    return { key, raw, num, unit, cands, pick, qty: pick ? qtyFor(pick, num, unit) : 0, on: !!pick };
  });
}

export const rowTotal = (r) => (r.on && r.pick ? lineTotal(r.pick, r.qty) : 0);
export const listTotal = (rows) => rows.reduce((s, r) => s + rowTotal(r), 0);

// Budget mode: swap the biggest lines to cheaper matches first; if it still does not fit, drop lines from the end of the list.
export function fitBudget(rows, budget) {
  const cur = rows.map((r) => ({ ...r, swapped: false, dropped: false }));
  let guard = 0;
  while (listTotal(cur) > budget && guard++ < 60) {
    const options = cur.filter((r) => r.on && r.pick).map((r) => {
      const now = lineTotal(r.pick, r.qty);
      const best = r.cands.map((c) => ({ c, q: qtyFor(c, r.num, r.unit) })).map((x) => ({ ...x, cost: lineTotal(x.c, x.q) })).filter((x) => x.cost < now).sort((a, b) => a.cost - b.cost)[0];
      return best ? { r, ...best, save: now - best.cost } : null;
    }).filter(Boolean).sort((a, b) => b.save - a.save);
    if (!options.length) break;
    const o = options[0];
    o.r.pick = o.c; o.r.qty = o.q; o.r.swapped = true;
  }
  for (let i = cur.length - 1; i >= 0 && listTotal(cur) > budget; i--) if (cur[i].on && cur[i].pick) { cur[i].on = false; cur[i].dropped = true; }
  return cur;
}

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------
// Search "biryani" -> recipes whose name (English or Bangla) contains it
export function recipeHits(q, recipes, byName) {
  const t = norm(q);
  if (t.length < 3) return [];
  return recipes.filter((r) => hay(r.name).includes(t)).map((r) => ({ ...r, products: byName(r.items) })).filter((r) => r.products.length);
}

// Cart has some ingredients of a dish -> offer the missing ones. Needs 2+ ingredients (or 40%) already in the cart.
export function completeRecipes(cartIds, recipes, byName, limit = 2) {
  const inCart = new Set(cartIds.map(String));
  return recipes.map((r) => {
    const products = byName(r.items);
    const have = products.filter((p) => inCart.has(String(p.id)));
    const missing = products.filter((p) => !inCart.has(String(p.id)) && p.status !== "out");
    return { r, products, have, missing };
  }).filter((x) => x.products.length && x.missing.length && (x.have.length >= 2 || x.have.length / x.products.length >= 0.4))
    .sort((a, b) => b.have.length / b.products.length - a.have.length / a.products.length || a.missing.length - b.missing.length)
    .slice(0, limit);
}

// "Add ৳120 more for free delivery" -> the smallest item that gets there + two good-value ones that stay under the gap.
const NOT_GROCERY = new Set(["beauty", "health", "baby", "pet"]);
export function deliveryFillers(products, cartIds, gap, limit = 3) {
  if (!(gap > 0)) return [];
  const inCart = new Set(cartIds.map(String));
  const cand = products.filter((p) => p.status !== "out" && !inCart.has(String(p.id)) && !NOT_GROCERY.has(p.category)).map((p) => ({ p, cost: lineTotal(p, stepOf(p)) }));
  const closer = cand.filter((x) => x.cost >= gap).sort((a, b) => a.cost - b.cost)[0];
  const under = cand.filter((x) => x.cost < gap && x.cost >= gap * 0.25).sort((a, b) => b.p.discount - a.p.discount || b.cost - a.cost).slice(0, limit - (closer ? 1 : 0));
  return [...(closer ? [closer] : []), ...under].slice(0, limit);
}

// ---------------------------------------------------------------------------
// Recipe for N people. spec = [amount per person, pack size, unit] (see PER_PERSON in data.js)
// ---------------------------------------------------------------------------
// "480" + "g" -> "480 g",  "1200" -> "1.2 kg",  8 + "pc" -> "8 pc"
export function fmtAmt(n, unit = "g") {
  if (unit === "g") return n >= 1000 ? `${+(n / 1000).toFixed(2)} kg` : `${Math.round(n)} g`;
  if (unit === "ml") return n >= 1000 ? `${+(n / 1000).toFixed(2)} L` : `${Math.round(n)} ml`;
  return `${+n.toFixed(1)} ${unit}`;
}
// how much of product p goes in the cart for `people`: kg-items in 500 g steps (rounded up), packs rounded up to whole packs
export function qtyForPeople(p, spec, people) {
  if (!spec) return Math.min(stepOf(p), maxQty(p));
  const need = spec[0] * people;
  const q = p.unit === "kg" ? Math.max(0.5, Math.ceil(need / 500 - 1e-9) * 0.5) : Math.max(1, Math.ceil(need / (spec[1] || 1) - 1e-9));
  return Math.min(q, maxQty(p));
}
// "Need 480 g"
export const needLabel = (spec, people) => (spec ? fmtAmt(spec[0] * people, spec[2] || "g") : "");
// what is added: "1 kg" / "1 pack" / "2 packs"
export const buyLabel = (p, q) => (p.unit === "kg" ? (q < 1 ? `${Math.round(q * 1000)} g` : `${+q.toFixed(2)} kg`) : p.unit === "pc" ? `${q} pc` : `${q} pack${q > 1 ? "s" : ""}`);
