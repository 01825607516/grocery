"use client";
import { useEffect, useState } from "react";

// Auto-playing slider: arrows + swipe, no pagination dots
export default function Slider({ slides, delay = 6000, paused = false, className = "rounded-3xl" }) {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const [startX, setStartX] = useState(0);
  const total = slides.length;
  const go = (k) => setI((k + total) % total);

  useEffect(() => {
    if (paused || hold) return;
    const t = setTimeout(() => setI((x) => (x + 1) % total), delay);
    return () => clearTimeout(t);
  }, [i, paused, hold, delay, total]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}
      onTouchStart={(e) => { setStartX(e.touches[0].clientX); setHold(true); }}
      onTouchEnd={(e) => { const d = e.changedTouches[0].clientX - startX; if (Math.abs(d) > 50) go(i + (d < 0 ? 1 : -1)); setHold(false); }}
    >
      <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, k) => <div key={k} className="w-full shrink-0" aria-hidden={k !== i}>{s}</div>)}
      </div>
      <button aria-label="Previous slide" onClick={() => go(i - 1)} className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 shadow">‹</button>
      <button aria-label="Next slide" onClick={() => go(i + 1)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 shadow">›</button>
    </div>
  );
}
