"use client";
import { useEffect, useState } from "react";
import { isSoundEnabled, toggleSound } from "@/lib/sound";

// "Sound on / Sound off" pill with a text label, so visitors understand it at a glance.
// Controls the add-to-cart pop and the order-placed jingle (see lib/sound.js). Confetti still shows when muted.
export default function SoundToggle({ className = "" }) {
  const [on, setOn] = useState(true);   // true first so server and browser HTML match; real value is read after mount
  useEffect(() => {
    const sync = () => setOn(isSoundEnabled());
    sync();
    window.addEventListener("gs-sound-change", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("gs-sound-change", sync); window.removeEventListener("storage", sync); };
  }, []);
  return (
    <button type="button" onClick={toggleSound} aria-pressed={!on} aria-label={on ? "Mute shop sounds" : "Unmute shop sounds"} title={on ? "Mute shop sounds" : "Unmute shop sounds"}
      className={`flex items-center gap-1.5 rounded-full border border-primary/50 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary-light ${className}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5L6 9H3v6h3l5 4V5z" />
        {on ? <path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" /> : <path d="M22 9l-6 6M16 9l6 6" />}
      </svg>
      {on ? "Sound on" : "Sound off"}
    </button>
  );
}