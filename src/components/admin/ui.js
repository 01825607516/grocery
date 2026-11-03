"use client";
import { useCallback, useRef, useState } from "react";
import { adminApi, refreshStorefront } from "@/lib/adminSession";

// Small building blocks for the admin panel. They use the SAME colours, fonts, borders and buttons as the storefront
// (cream page, deep-green primary, brass accent, Playfair headings), so the panel looks like part of the website.

export const INPUT = "w-full rounded-lg border border-accent/40 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary disabled:opacity-60";
export const BTN_SECONDARY = "rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary-light disabled:opacity-40";
export const BTN_DANGER = "rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-40";

export function Card({ title, description, actions, children, className = "" }) {
  return (
    <section className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 md:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="font-display text-lg font-semibold text-primary-dark">{title}</h2>}
            {description && <p className="mt-1 text-sm text-ink/60">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`block text-sm font-medium text-ink/80 ${className}`}>
      {label}
      <span className="mt-1 block">{children}</span>
      {hint && <small className="mt-1 block text-xs font-normal text-ink/50">{hint}</small>}
    </label>
  );
}

export const Input = (props) => <input {...props} className={`${INPUT} ${props.className || ""}`} />;
export const TextArea = (props) => <textarea rows={3} {...props} className={`${INPUT} ${props.className || ""}`} />;
export const Select = ({ children, ...props }) => <select {...props} className={`${INPUT} ${props.className || ""}`}>{children}</select>;

export function Btn({ children, variant = "primary", className = "", ...props }) {
  const base = variant === "secondary" ? BTN_SECONDARY : variant === "danger" ? BTN_DANGER : "btn";
  return <button type="button" {...props} className={`${base} ${className}`}>{children}</button>;
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <button type="button" role="switch" aria-checked={!!checked} onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-primary" : "bg-ink/20"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
      <span className="min-w-0"><span className="font-medium text-ink/90">{label}</span>{hint && <small className="block text-xs text-ink/50">{hint}</small>}</span>
    </label>
  );
}

const TONES = {
  green: "bg-primary-light text-primary-dark",
  amber: "bg-amber-100 text-amber-900",
  red: "bg-red-100 text-red-800",
  blue: "bg-sky-100 text-sky-900",
  gray: "bg-ink/10 text-ink/70",
};
export const Badge = ({ tone = "gray", children }) => <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone] || TONES.gray}`}>{children}</span>;

export function Notice({ kind = "ok", children, onClose }) {
  if (!children) return null;
  const cls = kind === "error" ? "border-red-300 bg-red-50 text-red-800" : "border-primary/30 bg-primary-light text-primary-dark";
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`mb-4 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${cls}`}>
      <span>{children}</span>
      {onClose && <button type="button" onClick={onClose} aria-label="Dismiss" className="shrink-0 text-lg leading-none opacity-60 hover:opacity-100">×</button>}
    </div>
  );
}

export const Loading = ({ children = "Loading…" }) => <p className="py-12 text-center text-sm text-ink/60">{children}</p>;
export const Empty = ({ children }) => <p className="rounded-xl border border-dashed border-accent/50 px-4 py-8 text-center text-sm text-ink/60">{children}</p>;

export function Pager({ page, last, onPage }) {
  if (!last || last < 2) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm">
      <button type="button" className={BTN_SECONDARY} disabled={page <= 1} onClick={() => onPage(page - 1)}>← Previous</button>
      <span className="text-ink/60">Page {page} of {last}</span>
      <button type="button" className={BTN_SECONDARY} disabled={page >= last} onClick={() => onPage(page + 1)}>Next →</button>
    </div>
  );
}

// Image: paste a web address OR upload a file (stored by the backend). Shows a preview.
//   upload: async (File) => url   (omit to hide the upload button)
export function ImageField({ label, value, onChange, upload, hint, placeholder = "https://…", previewClass = "h-14" }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pick = async (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file || !upload) return;
    setBusy(true); setErr("");
    try { onChange(await upload(file)); }
    catch (x) { setErr(`${x.message || "Upload failed."} You can paste an image web address instead.`); }
    finally { setBusy(false); }
  };
  return (
    <div className="text-sm font-medium text-ink/80">
      {label}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <input className={`${INPUT} min-w-0 flex-1`} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        {upload && <label className={`${BTN_SECONDARY} cursor-pointer whitespace-nowrap ${busy ? "pointer-events-none opacity-50" : ""}`}>{busy ? "Uploading…" : "Upload"}<input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,image/x-icon,.ico" onChange={pick} disabled={busy} /></label>}
        {value && <button type="button" onClick={() => onChange("")} className="text-xs text-ink/50 underline hover:text-ink">Remove</button>}
      </div>
      {value && /^(https?:)?\/\//i.test(value) && <img src={value} alt="" className={`mt-2 max-w-full rounded-md bg-cream object-contain p-1 ring-1 ring-accent/30 ${previewClass}`} />}
      {hint && <small className="mt-1 block text-xs font-normal text-ink/50">{hint}</small>}
      {err && <small className="mt-1 block text-xs font-normal text-red-700">{err}</small>}
    </div>
  );
}

// "Saved." / "Could not save: …" messages + a busy flag for every section.
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const clear = useCallback(() => { setOk(""); setErr(""); }, []);
  // run(async () => {...}, "Saved.")  -> true when it worked
  const run = useCallback(async (fn, okMessage = "Saved.", { storefront = true } = {}) => {
    setBusy(true); setOk(""); setErr("");
    try {
      const out = await fn();
      if (storefront) refreshStorefront();
      setOk(okMessage);
      return out === undefined ? true : out;
    } catch (e) { setErr(e?.message || "Something went wrong."); return false; }
    finally { setBusy(false); }
  }, []);
  const box = <><Notice kind="error" onClose={() => setErr("")}>{err}</Notice><Notice onClose={() => setOk("")}>{ok}</Notice></>;
  return { busy, ok, err, run, clear, box, setErr, setOk };
}

// Upload helper used by the image fields: POST /admin/api/settings/assets
export async function uploadAsset(type, file, extra = {}) {
  const form = new FormData();
  form.append("type", type);
  form.append("asset", file);
  Object.entries(extra).forEach(([k, v]) => form.append(k, v));
  const data = await adminApi("/settings/assets", { method: "POST", form });
  if (!data?.url) throw new Error("The upload did not return an image address.");
  return data.url;
}

export const isHttpUrl = (v) => /^https?:\/\/\S+$/i.test(String(v || "").trim());
export const clean = (v) => { const t = String(v ?? "").trim(); return t === "" ? null : t; };
export const takaFmt = (n) => `৳${Math.round(Number(n) || 0).toLocaleString("en-US")}`;
export const dateFmt = (v) => { if (!v) return "—"; const d = new Date(String(v).replace(" ", "T")); return Number.isNaN(+d) ? String(v) : d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); };

// datetime-local needs "YYYY-MM-DDTHH:mm"
export const toLocalInput = (v) => (v ? String(v).replace(" ", "T").slice(0, 16) : "");
export const useDebounced = (fn, ms = 350) => { const t = useRef(null); return (...a) => { clearTimeout(t.current); t.current = setTimeout(() => fn(...a), ms); }; };
