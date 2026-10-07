"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { money } from "@/lib/format";

export const fmtDate = (t) => new Date(t).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
export const payStatus = (s) => ({ paid: "Paid", pending: "Pending", pay_on_delivery: "Pay on delivery" }[s] || s || "—");

export const Row = ({ k, v, neg, free }) => (
  <div className="flex justify-between text-sm"><span>{k}</span><span className={neg || free ? "text-primary" : ""}>{free ? "Free" : <>{neg ? "−" : ""}{money(v)}</>}</span></div>
);

export function Crumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-ink/60">
      {items.map((c, i) => (
        <span key={c.label} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden="true">/</span>}
          {c.href ? <Link href={c.href} className="hover:text-primary hover:underline">{c.label}</Link> : <span className="font-semibold text-ink">{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Missing({ title = "We couldn't find that page", text = "It may have moved, or the link is wrong." }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-md ring-1 ring-black/5">
      <p className="font-display text-xl font-semibold text-primary-dark">{title}</p>
      <p className="mt-1 text-sm text-ink/60">{text}</p>
      <div className="mt-5 flex justify-center gap-2"><Link href="/" className="btn">Go home</Link><Link href="/shop" className="rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary">Browse products</Link></div>
    </div>
  );
}

// Pages that need an account (orders, wishlist, account...). Guests get the normal login popup.
export function AuthGate({ why = "Please log in to continue.", children }) {
  const { user, status, requireLogin } = useAuth();
  if (status === "loading") return <p className="py-16 text-center text-ink/60">Loading…</p>;
  if (!user)
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-md ring-1 ring-black/5">
        <p className="font-display text-xl font-semibold text-primary-dark">Please log in</p>
        <p className="mt-1 text-sm text-ink/60">{why}</p>
        <button onClick={() => requireLogin(null, why)} className="btn mt-5">Log in / Sign up</button>
      </div>
    );
  return children;
}

export const EmptyState = ({ title, text, href = "/shop", cta = "Start shopping" }) => (
  <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-md ring-1 ring-black/5">
    <p className="font-display text-xl font-semibold text-primary-dark">{title}</p>
    {text && <p className="mt-1 text-sm text-ink/60">{text}</p>}
    <Link href={href} className="btn mt-5 inline-block">{cta}</Link>
  </div>
);
