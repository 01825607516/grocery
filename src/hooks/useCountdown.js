"use client";
import { useEffect, useState } from "react";

// End of today (local time): "Top saver today" deals finish at midnight.
export const endOfToday = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d.getTime(); };

// Returns ["hh","mm","ss"] left until getTarget(). Shows "--" until mounted (server and first client render match).
export default function useCountdown(getTarget = endOfToday) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    let target = getTarget();
    const tick = () => {
      if (target - Date.now() <= 0) target = getTarget(); // a new day started: count down to the next midnight
      setLeft(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const pad = (n) => String(n).padStart(2, "0");
  if (left === null) return ["--", "--", "--"];
  return [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60].map(pad);
}
