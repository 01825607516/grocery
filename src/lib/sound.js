// Small sound effects for the store, generated with the browser's Web Audio API (no audio files to download).
//
//   playPop(strong)         -> "Add to cart" pop       (strong = bigger version for "Add all" / "Reorder")
//   playCelebrate(volleys)  -> order placed / payment success jingle (timed to the confetti volleys)
//   setSoundEnabled(on)     -> optional on/off switch, remembered in localStorage ("gs_sound")
//
// Browsers only let a page make sound after the visitor has clicked / tapped / pressed a key at least once.
// The audio engine is therefore unlocked on the first such interaction. If a sound is requested while the browser is
// still blocking audio (e.g. the payment gateway just redirected back to us), it waits a few seconds for that first
// click and plays then; after that it gives up quietly instead of playing a "late" jingle.
// Everything is wrapped in try/catch: sound is a bonus and must never break the shop.

const KEY = "gs_sound";
const isClient = typeof window !== "undefined";

export const isSoundEnabled = () => { try { return localStorage.getItem(KEY) !== "off"; } catch { return true; } };
export const setSoundEnabled = (on) => { try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* private mode: ignore */ } };

let ctx = null;     // AudioContext (created once)
let out = null;     // master volume -> compressor -> speakers
let noise = null;   // 1 s of white noise, built once (used for the "whoosh")

function engine() {
  if (!isClient) return null;
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();      // stops overlapping sounds from clipping
    out = ctx.createGain();
    out.gain.value = 0.8;
    out.connect(comp);
    comp.connect(ctx.destination);
  } catch { ctx = null; }
  return ctx;
}

// Unlock audio on the first user gesture (pointer / touch / key / click all listed because iOS Safari is picky).
if (isClient) {
  const events = ["pointerdown", "touchend", "keydown", "click"];
  const unlock = () => {
    const c = engine();
    if (!c) return;
    const done = () => { if (c.state === "running") events.forEach((e) => window.removeEventListener(e, unlock, true)); };
    if (c.state === "suspended") c.resume().then(done).catch(() => {});   // resume() is async: check the state afterwards
    else done();
  };
  events.forEach((e) => window.addEventListener(e, unlock, { capture: true, passive: true }));
}

// Run `build(ctx)` as soon as the engine is running; wait at most `wait` ms for the browser to allow sound.
function run(build, wait = 1500) {
  if (!isSoundEnabled()) return;
  const c = engine();
  if (!c) return;
  const go = () => { try { build(c); } catch { /* ignore */ } };
  if (c.state === "running") return go();
  const t0 = Date.now();
  c.resume().then(() => { if (c.state === "running" && Date.now() - t0 <= wait) go(); }).catch(() => {});
}

const at = (c, t = 0) => c.currentTime + 0.02 + t;       // small lead-in so the first sample is never clipped

// One note / blip. `to` = glide to this frequency (a "bloop"); `t` = delay in seconds.
function tone(c, { f, to, t = 0, dur = 0.2, vol = 0.25, type = "sine", attack = 0.006 }) {
  const t0 = at(c, t);
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur * 0.7);
  g.gain.setValueAtTime(0.0001, t0);                       // exponential ramps can't start/end at exactly 0
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(out);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

// Soft rising "whoosh" (filtered noise).
function whoosh(c, { t = 0, dur = 0.4, vol = 0.1, from = 500, to = 4000 }) {
  if (!noise) {
    noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = at(c, t);
  const s = c.createBufferSource();
  s.buffer = noise;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 0.9;
  f.frequency.setValueAtTime(from, t0);
  f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f);
  f.connect(g);
  g.connect(out);
  s.start(t0);
  s.stop(t0 + dur + 0.05);
}

// note frequencies (Hz)
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5, G6 = 1567.98;
const TWINKLE = [1567.98, 1760, 2093, 2349.3];

// 1) Add to cart: a quick bubbly pop + tiny sparkle (~0.25 s). `strong` adds a little rising chime for "Add all" / "Reorder".
export function playPop(strong = false) {
  run((c) => {
    tone(c, { f: 380, to: 900, dur: 0.11, vol: 0.28 });
    tone(c, { f: G6, t: 0.07, dur: 0.14, vol: 0.1, type: "triangle" });
    if (strong) {
      whoosh(c, { dur: 0.25, vol: 0.05, from: 600, to: 3000 });
      [C6, E6, G6].forEach((f, i) => tone(c, { f, t: 0.08 + i * 0.07, dur: 0.22, vol: 0.13, type: "triangle" }));
    }
  });
}

// 2) Order placed: whoosh + pop, a rising arpeggio, a bright final chord, and little twinkles timed to the confetti volleys (~1.6 s).
export function playCelebrate(volleys = 8) {
  run((c) => {
    whoosh(c, { dur: 0.45, vol: 0.1, from: 300, to: 3500 });
    tone(c, { f: 300, to: 800, dur: 0.14, vol: 0.3 });
    [C5, E5, G5, C6, E6].forEach((f, i) => {
      tone(c, { f, t: 0.06 + i * 0.085, dur: 0.38, vol: 0.16, type: "triangle" });
      tone(c, { f: f * 2, t: 0.06 + i * 0.085, dur: 0.25, vol: 0.045 });
    });
    [C6, E6, G6].forEach((f) => tone(c, { f, t: 0.55, dur: 0.9, vol: 0.11, type: "triangle" }));
    for (let i = 1; i <= volleys; i++) tone(c, { f: TWINKLE[i % TWINKLE.length], t: i * 0.14, dur: 0.18, vol: 0.05 });
  }, 8000);
}

// Header mute button: flips the saved setting and tells other components (and other tabs, via "storage") to refresh.
export function toggleSound() {
  const next = !isSoundEnabled();
  setSoundEnabled(next);
  if (isClient) window.dispatchEvent(new Event("gs-sound-change"));
  if (next) playPop();   // tiny pop when turning ON so the visitor hears it worked
  return next;
}