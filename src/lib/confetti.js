import { playPop, playCelebrate } from "./sound";

// Organic confetti for the store: leaves + small berries in greens, fresh yellows and oranges.
//
//   burstFromElement(el)  -> tiny localized burst around a button     (Add to cart)
//   celebrateOrder()      -> full-screen celebration                 (order placed / payment success)
//   preloadConfetti()     -> optional warm-up so the first burst is instant
//
// Every burst comes with a matching sound effect (see ./sound.js). The sound is played straight away inside the click, so it is
// instant and the browser lets it through, even before the confetti library has finished loading.
//
// Design rules:
//  - canvas-confetti is imported lazily, so it never touches the initial bundle and never runs on the server.
//  - Everything is skipped for visitors who prefer reduced motion (and if the library fails to load, the app carries on silently).
//  - The leaf shape is built once and reused.

// A leaf outline (two curves, pointed tip, stem end bottom-left) in a 24 x 24 box.
const LEAF_PATH = "M4 20 C2 9 11 1 22 2 C23 13 15 22 4 20 Z";
// Pre-computed centring/scale matrix [scale, 0, 0, scale, -cx*scale, -cy*scale] for the path above (bounding box 18.36 x 18.36).
// Passing it stops the library from scanning a 1000x1000 grid on first use, which would cause a visible stutter at the click.
const LEAF_MATRIX = [0.5445, 0, 0, 0.5445, -7.0257, -6.0431];

const LEAF_COLORS = ["#1f4d3a", "#2e7d4f", "#4caf50", "#7bc67e", "#a8d672", "#ffd23f"];                    // greens, one fresh-yellow accent
const BERRY_COLORS = ["#ffd23f", "#f9c22e", "#ff9f1c", "#f77f00", "#a8d672"];                               // yellows + oranges, one light green
// Set to true to hide confetti for visitors whose system says "reduce motion" (on Windows: Settings > Accessibility > Visual effects > Animation effects OFF).
// It is false here because that Windows switch is often off by accident and then confetti silently never shows.
const RESPECT_REDUCED_MOTION = false;
const BASE = { zIndex: 100, disableForReducedMotion: RESPECT_REDUCED_MOTION };                                                // 100 = above modals (60-70) and toast (90)

const canAnimate = () => typeof window !== "undefined" && (!RESPECT_REDUCED_MOTION || !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

let loading = null;
function load() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!loading) {
    loading = import("canvas-confetti")
      .then(({ default: confetti }) => {
        let leaf = null;
        try { leaf = confetti.shapeFromPath({ path: LEAF_PATH, matrix: LEAF_MATRIX }); } catch { /* very old browser without Path2D: circles only */ }
        return { confetti, leaf };
      })
      .catch((err) => { console.warn("[confetti] could not load canvas-confetti - run: npm install canvas-confetti", err); return null; });
  }
  return loading;
}

export const preloadConfetti = () => { if (canAnimate()) load(); };

// ~60% leaves (bigger) + ~40% small flat circles. `scale` resizes both kinds together.
function shoot({ confetti, leaf }, count, opts, scale = 1) {
  const leaves = leaf ? Math.round(count * 0.6) : 0;
  if (leaves) confetti({ ...BASE, ...opts, particleCount: leaves, shapes: [leaf], colors: LEAF_COLORS, scalar: 1.15 * scale });
  confetti({ ...BASE, ...opts, particleCount: count - leaves, shapes: ["circle"], colors: BERRY_COLORS, scalar: 0.7 * scale, flat: true });
}

// 1) Add to cart: a visible pop of leaves + berries around the button (`strong` = bigger burst for "Add all" / "Reorder all").
//    Call it synchronously inside the click handler - the button is replaced by the +/- stepper right after the click.
export function burstFromElement(el, strong = false) {
  if (!el) return;
  playPop(strong);
  if (!canAnimate()) return;
  const r = el.getBoundingClientRect();
  const origin = { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height * 0.35) / window.innerHeight };
  load().then((api) => api && shoot(api, strong ? 60 : 30, { origin, angle: 90, spread: strong ? 100 : 85, startVelocity: strong ? 32 : 26, gravity: 0.85, decay: 0.9, ticks: strong ? 130 : 100 }, strong ? 1.5 : 1.25));
}

// 2) Order placed: one soft bloom from the upper middle, then a few gentle volleys from both sides (about 1.5 s in total).
export function celebrateOrder() {
  if (typeof window === "undefined") return;
  const small = window.innerWidth < 640;                         // fewer particles on phones
  const volleys = small ? 5 : 8;
  playCelebrate(volleys);
  if (!canAnimate()) return;
  load().then((api) => {
    if (!api) return;
    shoot(api, small ? 70 : 120, { origin: { x: 0.5, y: 0.4 }, spread: 110, startVelocity: 38, gravity: 0.9, decay: 0.92, ticks: 220 });
    for (let i = 1; i <= volleys; i++) {
      setTimeout(() => {
        const n = small ? 3 : 5;
        shoot(api, n, { angle: 60, spread: 55, origin: { x: 0, y: 0.75 }, startVelocity: 48, gravity: 0.9, ticks: 200 });
        shoot(api, n, { angle: 120, spread: 55, origin: { x: 1, y: 0.75 }, startVelocity: 48, gravity: 0.9, ticks: 200 });
      }, i * 140);
    }
  });
}
