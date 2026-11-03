"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { parseIdentifier } from "@/lib/format";

const INPUT = "w-full rounded-lg border border-accent/40 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary";

export default function AuthModal() {
  const { authOpen, closeAuth, reason, login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [adminMode, setAdminMode] = useState(false);
  const [f, setF] = useState({ name: "", identifier: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (authOpen) { setErr(""); setBusy(false); } else setAdminMode(false); }, [authOpen]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const signInAdmin = async (identifier, password) => {
    const page = await fetch("/admin/login", { credentials: "same-origin", cache: "no-store" });
    const html = await page.text();
    const csrf = html.match(/name="_token" value="([^"]+)"/)?.[1] || html.match(/name="csrf-token" content="([^"]+)"/)?.[1];
    if (!csrf) throw new Error("Could not start secure admin sign-in. Refresh and try again.");
    await fetch("/admin/login", { method: "POST", credentials: "same-origin", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "text/html" }, body: new URLSearchParams({ _token: csrf, login: identifier, password }) });
    const check = await fetch("/admin/api/me", { credentials: "same-origin", headers: { Accept: "application/json" }, cache: "no-store" });
    const data = await check.json().catch(() => ({}));
    if (!check.ok || !data.admin) throw new Error(data.message || "Staff sign-in failed, or this account does not have Website Control access.");
    window.dispatchEvent(new Event("gs:admin-session"));
    closeAuth();
  };

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (mode === "register" && !f.name.trim()) return setErr("Please enter your name.");
    const id = parseIdentifier(f.identifier);
    if (!id) return setErr("Enter a valid email address or mobile number, e.g. name@example.com or 01712345678.");
    if (f.password.length < 6) return setErr("Password must be at least 6 characters.");
    setBusy(true);
    const who = { identifier: id.value, [id.type]: id.value };
    try {
      if (adminMode && mode === "login") await signInAdmin(id.value, f.password);
      else await (mode === "login" ? login({ ...who, password: f.password }) : register({ ...who, name: f.name, password: f.password }));
    } catch (x) { setErr(x.message || "Something went wrong. Please try again."); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={authOpen} onClose={closeAuth} z="z-[80]" size="md" title={adminMode ? "Website admin sign in" : mode === "login" ? "Log in" : "Create your account"}>
      <p className="mb-4 text-sm text-ink/70">{adminMode ? "Use your Dokani staff account with Website Control access." : reason || "Browse as a guest anytime. Log in to add items, save favourites and order."}</p>
      <form onSubmit={submit} className="space-y-3" noValidate>
        {mode === "register" && <input value={f.name} onChange={set("name")} autoComplete="name" placeholder="Full name" aria-label="Full name" className={INPUT} />}
        <input value={f.identifier} onChange={set("identifier")} type="text" inputMode="email" autoComplete="username" placeholder="Email or mobile number" aria-label="Email or mobile number" className={INPUT} />
        <input value={f.password} onChange={set("password")} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Password (min 6 characters)" aria-label="Password" className={INPUT} />
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} className="btn w-full">{busy ? "Please wait…" : adminMode ? "Sign in to website management" : mode === "login" ? "Log in" : "Create account"}</button>
      </form>
      {mode === "login" && <button type="button" onClick={() => { setAdminMode((value) => !value); setErr(""); }} className="mt-3 w-full text-center text-sm font-semibold text-primary underline-offset-4 hover:underline">{adminMode ? "Use customer login" : "Website admin? Use this login form"}</button>}
      <p className="mt-4 text-center text-sm text-ink/70">
        {mode === "login" ? "New here?" : "Already have an account?"}{" "}
        <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setAdminMode(false); setErr(""); }} className="font-semibold text-primary underline-offset-4 hover:underline">{mode === "login" ? "Create an account" : "Log in"}</button>
      </p>
      <button onClick={closeAuth} className="mx-auto mt-2 block text-xs text-ink/50 hover:text-ink">Continue as guest</button>
    </Modal>
  );
}