// Time slots for the delivery picker. Slots that start within `lead` hours (or already started) are disabled today;
// when nothing is left today the list switches to tomorrow. Courier areas have no slots.
export function buildSlots(slots, now = new Date(), lead = 1) {
  const h = now.getHours() + now.getMinutes() / 60;
  const today = slots.map((s) => ({ ...s, day: "today", full: !!s.disabled, disabled: !!s.disabled || s.startHour - lead < h }));
  if (today.some((s) => !s.disabled)) return { day: "today", dayLabel: "Today", list: today };
  return { day: "tomorrow", dayLabel: "Tomorrow", list: slots.map((s) => ({ ...s, day: "tomorrow", full: !!s.disabled, disabled: !!s.disabled })) };
}
export const slotDate = (day, now = new Date()) => { const d = new Date(now); if (day === "tomorrow") d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };
