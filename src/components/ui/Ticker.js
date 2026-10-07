"use client";
import { useEffect, useRef, useState } from "react";

// Bangladesh weekend = Friday + Saturday, so the weekend offer ends Saturday 11:59 PM.
export const endOfWeekend = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};
const pad = (n) => String(n).padStart(2, "0");

// Seconds left until `getTarget()`; null until mounted (avoids server/client time mismatch).
function useSecondsLeft(getTarget) {
  const [left, setLeft] = useState(null);
  const fn = useRef(getTarget); // read once on mount, so re-renders never restart the countdown
  useEffect(() => {
    const target = fn.current();
    const tick = () => setLeft(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return left;
}

// Plain-text countdown: "2d 05h 12m 33s" - easy for anyone to read at a glance.
export function CountText({ getTarget, className = "" }) {
  const left = useSecondsLeft(getTarget);
  const s = left ?? 0;
  const d = Math.floor(s / 86400);
  const text = left === null ? "-- : -- : --" : `${d > 0 ? `${d}d ` : ""}${pad(Math.floor((s % 86400) / 3600))}h ${pad(Math.floor((s % 3600) / 60))}m ${pad(s % 60)}s`;
  return <span role="timer" className={`font-mono tabular-nums ${className}`}>{text}</span>;
}

// Live d / h / m / s countdown. `getTarget` runs once in the browser (avoids server/client time mismatch).
export default function Ticker({ getTarget, compact = false }) {
  const [left, setLeft] = useState(null);
  const fn = useRef(getTarget); // read once on mount, so re-renders never restart the countdown
  useEffect(() => {
    const target = fn.current();
    const tick = () => setLeft(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  const s = left ?? 0;
  const parts = [[Math.floor(s / 86400), "day"], [Math.floor((s % 86400) / 3600), "hr"], [Math.floor((s % 3600) / 60), "min"], [s % 60, "sec"]];
  return (
    <div className={`flex items-center ${compact ? "gap-1" : "gap-1.5"}`} role="timer">
      {parts.map(([v, u]) => (
        <span key={u} className={`overflow-hidden rounded-md bg-white/15 text-center font-mono font-bold leading-none text-white ${compact ? "min-w-[1.9rem] px-1 py-0.5 text-xs" : "min-w-[2.6rem] px-1.5 py-1 text-sm"}`}>
          <span key={left === null ? "x" : v} className="inline-block animate-tick motion-reduce:animate-none">{pad(v)}</span>
          <small className={`block font-semibold uppercase tracking-wide text-white/60 ${compact ? "text-[8px]" : "mt-0.5 text-[9px]"}`}>{u}</small>
        </span>
      ))}
    </div>
  );
}
