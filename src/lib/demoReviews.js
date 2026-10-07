// DEMO ONLY - sample reviews so every product on the landing page shows a rating while there is no real backend.
// Used by services/mockApi.js (mock mode). The real API (httpApi.js) never touches this file.
// To switch off: set DEMO_REVIEWS = false (and clear browser storage key "gs_m_reviews" once), or delete this file + its import in mockApi.js.
export const DEMO_REVIEWS = true;
export const DEMO_VERSION = 1; // bump this number to re-generate the sample reviews

const FIRST = ["Rahim", "Karim", "Nusrat", "Tania", "Sabbir", "Farhana", "Imran", "Mim", "Rakib", "Sumaiya", "Tanvir", "Jannat", "Hasan", "Nabila", "Arif", "Shirin", "Mahin", "Sadia", "Rubel", "Tasnim", "Shakil", "Lamia", "Nayeem", "Ritu"];
const LAST = ["Uddin", "Ahmed", "Hossain", "Akter", "Khan", "Islam", "Rahman", "Chowdhury", "Begum", "Sarker", "Mia", "Das"];

const TEXT = {
  5: ["Very fresh and good quality. Will order again.", "Exactly as described. Packing was perfect.", "Best price for this quality. Highly recommended!", "Delivered fast and everything was in good condition.", "Excellent! My family loved it.", "Top quality, much better than the local shop."],
  4: ["Good quality and fair price.", "Nice product, packing could be a little better.", "Fresh and tasty. Delivery was on time.", "Happy with it. Will buy again.", "Worth the money."],
  3: ["Okay for the price. Nothing special.", "Average quality, but delivery was quick.", "Some pieces were not so fresh, rest was fine."],
  2: ["Quality was below my expectation.", "Packing was poor and the quantity felt less."],
  1: ["Not fresh at all. Disappointed.", "Did not match the photo. Would not order again."],
};

// small deterministic random generator, so the same product always gets the same reviews
function rng(seed) {
  let a = (seed * 2654435761) >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const pickStars = (r) => { const x = r(); return x < 0.45 ? 5 : x < 0.75 ? 4 : x < 0.9 ? 3 : x < 0.96 ? 2 : 1; };

// returns { [productId]: [review] } in the same shape the mock backend stores
export function buildDemoReviews(products) {
  const out = {};
  for (const p of products) {
    const r = rng(Number(p.id) || [...String(p.id)].reduce((s, c) => s + c.charCodeAt(0), 7));
    const n = 3 + Math.floor(r() * 10); // 3..12 reviews
    const used = new Set();
    out[p.id] = Array.from({ length: n }, (_, i) => {
      let name; do { name = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)][0]}.`; } while (used.has(name) && used.size < 40);
      used.add(name);
      const rating = pickStars(r);
      const pool = TEXT[rating];
      const votes = Math.floor(r() * r() * 14);
      return {
        id: `demo_${p.id}_${i}`, userId: `demo_u_${p.id}_${i}`, name, rating,
        text: r() < 0.2 ? "" : pool[Math.floor(r() * pool.length)],
        createdAt: Date.now() - Math.floor(r() * 90 * 864e5) - 36e5,
        verified: r() < 0.7,
        helpfulBy: Array.from({ length: votes }, (_, k) => `demo_v${k}`),
      };
    });
  }
  return out;
}
