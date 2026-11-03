"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/services";
import { tokenStore } from "@/services/tokenStore";
import { adminFlag, adminMe, adminSignIn, adminSignOut } from "@/lib/adminSession";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const toast = (msg) => { try { window.dispatchEvent(new CustomEvent("gs:toast", { detail: msg })); } catch {} };

// Guests can browse everything. Adding to cart / wishlist / checkout call requireLogin(action):
// if nobody is logged in, the login popup opens and `action` runs automatically right after a successful login.
//
// ONE login form for everybody. The form first tries a customer login. If that fails it tries a staff login: a staff
// member with Website Control access becomes `admin` (a separate state, NOT `user`: customers' cart / wishlist / orders
// need a shopper token, which an admin does not have). The header then shows the admin menu with "Website Management".
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | guest | authed
  const [admin, setAdmin] = useState(null);        // { name, email, shop_id } while a Website Control admin is signed in
  const [adminChecked, setAdminChecked] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const pending = useRef(null);

  useEffect(() => {
    if (!tokenStore.get()) return setStatus("guest");
    api.me().then((u) => { setUser(u); setStatus("authed"); }).catch((error) => {
      // A temporary network/server error must not invalidate a saved login. The real-auth
      // adapter keeps the last verified profile in localStorage for this bootstrap case.
      if (error?.status === 401) {
        tokenStore.clear();
        setUser(null);
        setStatus("guest");
        return;
      }
      let cached = null;
      try { cached = JSON.parse(localStorage.getItem("gs_real_user") || "null"); } catch {}
      if (cached?.id) { setUser(cached); setStatus("authed"); }
      else setStatus("guest");
    });
  }, []);

  // Was an admin signed in on this browser? Only then is the server asked (visitors never make this request).
  useEffect(() => {
    if (!adminFlag.get()) return setAdminChecked(true);
    let live = true;
    adminMe().then((a) => { if (!live) return; if (a) setAdmin(a); else adminFlag.clear(); setAdminChecked(true); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const expired = () => { tokenStore.clear(); setUser(null); setStatus("guest"); setReason("Your session expired. Please log in again."); setAuthOpen(true); };
    const adminExpired = () => { adminFlag.clear(); setAdmin(null); setAdminMenuOpen(false); };
    window.addEventListener("gs:auth-expired", expired);
    window.addEventListener("gs:admin-expired", adminExpired);
    return () => { window.removeEventListener("gs:auth-expired", expired); window.removeEventListener("gs:admin-expired", adminExpired); };
  }, []);

  const finish = ({ user: u }) => { setUser(u); setStatus("authed"); setAuthOpen(false); };
  const login = useCallback(async (body) => {
    try { finish(await api.login(body)); return; }
    catch (customerError) {
      // Not a customer account (or wrong password): try the same details as a staff / Website Control account.
      let a = null;
      try { a = await adminSignIn(body.identifier || body.email || body.phone, body.password); } catch {}
      if (!a) throw customerError;
      setAdmin(a); setAdminChecked(true); setAuthOpen(false);
      pending.current = null; // a half-finished "add to cart" belongs to a customer, not to the admin
      toast(`Signed in as administrator, ${String(a.name || "").split(" ")[0] || "welcome"}. Open the admin menu for Website Management.`);
    }
  }, []);
  const register = useCallback(async (body) => finish(await api.register(body)), []);
  const logout = useCallback(async () => { await api.logout(); setUser(null); setStatus("guest"); setAccountOpen(false); pending.current = null; }, []);
  const adminLogout = useCallback(async () => { await adminSignOut(); setAdmin(null); setAdminMenuOpen(false); }, []);
  // Panel page: ask the server again (the admin may have signed in on another tab, or the session may have ended).
  const refreshAdmin = useCallback(async () => { const a = await adminMe(); setAdmin(a); setAdminChecked(true); if (a) adminFlag.set(); else adminFlag.clear(); return a; }, []);

  const refreshUser = useCallback(async () => { setUser(await api.me()); }, []); // used by the Account page after a profile change
  const requireLogin = useCallback((action, why = "") => { pending.current = action || null; setReason(why); setAuthOpen(true); }, []);
  const closeAuth = useCallback(() => { pending.current = null; setAuthOpen(false); }, []);
  const runPending = useCallback(() => { const f = pending.current; pending.current = null; if (f) f(); }, []);

  const value = useMemo(() => ({ user, status, admin, adminChecked, adminMenuOpen, setAdminMenuOpen, adminLogout, refreshAdmin, authOpen, reason, accountOpen, setAccountOpen, login, register, logout, refreshUser, requireLogin, closeAuth, runPending }),
    [user, status, admin, adminChecked, adminMenuOpen, adminLogout, refreshAdmin, authOpen, reason, accountOpen, login, register, logout, refreshUser, requireLogin, closeAuth, runPending]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
