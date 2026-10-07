"use client";
import { useEffect, useRef, useState } from "react";

// Image with a clean fallback (also catches images that failed before React hydrated)
export default function Img({ src, alt, className = "", hideOnError = false }) {
  const ref = useRef(null);
  const [bad, setBad] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setBad(true);
  }, []);
  if (bad) {
    if (hideOnError) return null;
    return <div role="img" aria-label={alt} className={`grid place-items-center bg-primary-light p-2 text-center text-xs text-primary ${className}`}>{alt}</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={alt} loading="lazy" onError={() => setBad(true)} className={className} />;
}
