"use client";
import { useEffect, useRef, useState } from "react";

// Remote photo (URLs come from src/lib/images.js / the item's `image`). If it fails, `fallback` is tried,
// then, as a last resort, a clean tinted tile with the item's initials is shown - no illustrations.
const tint = (hex, a) => {
  const n = parseInt((hex || "#4fa86b").slice(1), 16);
  const f = (c) => Math.round((255 - c) * a + c).toString(16).padStart(2, "0");
  return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`;
};

export default function Art({ src = "", fallback = "", color = "#4fa86b", className = "", label = "", round = false }) {
  const [tries, setTries] = useState(0); // 0 = src, 1 = fallback, 2 = placeholder tile
  const urls = [src, fallback].filter(Boolean);
  const bad = tries >= urls.length;
  const ref = useRef(null);
  // catches images that already failed before React hydrated
  useEffect(() => { const el = ref.current; if (el && el.complete && el.naturalWidth === 0) setTries((t) => t + 1); }, [tries]);
  const shape = round ? "rounded-full" : "";
  if (!bad) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img key={urls[tries]} ref={ref} src={urls[tries]} alt={label} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setTries((t) => t + 1)} style={{ backgroundColor: tint(color, 0.88) }} className={`${shape} object-cover ${className}`} />;
  }
  const initials = label.replace(/\(.*?\)/g, "").trim().split(/\s+/).filter((w) => /[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div role="img" aria-label={label} style={{ background: `linear-gradient(145deg, ${tint(color, 0.9)}, ${tint(color, 0.75)})` }} className={`grid place-items-center overflow-hidden ${shape} ${className}`}>
      <span className="select-none text-lg font-semibold tracking-wide opacity-50">{initials}</span>
    </div>
  );
}
