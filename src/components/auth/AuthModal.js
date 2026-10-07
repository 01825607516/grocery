"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { isEmail } from "@/lib/format";

const INPUT = "w-full rounded-lg border border-accent/40 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary";

// Login / Register popup. Opened whenever a guest tries to add, wishlist or check out.
export default function AuthModal() {
  const { authOpen, closeAuth, reason, login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (authOpen) { setErr(""); setBusy(false); } }, [authOpen]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (mode === "register" && !f.name.trim()) return setErr("Please enter your name.");
    if (!isEmail(f.email)) return setErr("Enter a valid email address, e.g. name@example.com.");
    if (f.password.length < 6) return setErr("Password must be at least 6 characters.");
    setBusy(true);
    try { await (mode === "login" ? login({ email: f.email, password: f.password }) : register({ name: f.name, email: f.email, password: f.password })); }
    catch (x) { setErr(x.message || "Something went wrong. Please try again."); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={authOpen} onClose={closeAuth} z="z-[80]" size="md" title={mode === "login" ? "Log in" : "Create your account"}>
      <p className="mb-4 text-sm text-ink/70">{reason || "Browse as a guest anytime. Log in to add items, save favourites and order."}</p>
      <form onSubmit={submit} className="space-y-3" noValidate>
        {mode === "register" && <input value={f.name} onChange={set("name")} autoComplete="name" placeholder="Full name" aria-label="Full name" className={INPUT} />}
        <input value={f.email} onChange={set("email")} type="email" inputMode="email" autoComplete="email" placeholder="Email address" aria-label="Email address" className={INPUT} />
        <input value={f.password} onChange={set("password")} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Password (min 6 characters)" aria-label="Password" className={INPUT} />
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} className="btn w-full">{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
      </form>
      <p className="mt-4 text-center text-sm text-ink/70">
        {mode === "login" ? "New here?" : "Already have an account?"}{" "}
        <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }} className="font-semibold text-primary underline-offset-4 hover:underline">{mode === "login" ? "Create an account" : "Log in"}</button>
      </p>
      <button onClick={closeAuth} className="mx-auto mt-2 block text-xs text-ink/50 hover:text-ink">Continue as guest</button>
    </Modal>
  );
}
