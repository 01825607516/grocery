"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/services";
import { tokenStore } from "@/services/tokenStore";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Guests can browse everything. Adding to cart / wishlist / checkout call requireLogin(action):
// if nobody is logged in, the login popup opens and `action` runs automatically right after a successful login.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | guest | authed
  const [authOpen, setAuthOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const pending = useRef(null);

  useEffect(() => {
    if (!tokenStore.get()) return setStatus("guest");
    api.me().then((u) => { setUser(u); setStatus("authed"); }).catch(() => { tokenStore.clear(); setStatus("guest"); });
  }, []);

  useEffect(() => {
    const expired = () => { tokenStore.clear(); setUser(null); setStatus("guest"); setReason("Your session expired. Please log in again."); setAuthOpen(true); };
    window.addEventListener("gs:auth-expired", expired);
    return () => window.removeEventListener("gs:auth-expired", expired);
  }, []);

  const finish = ({ user: u }) => { setUser(u); setStatus("authed"); setAuthOpen(false); };
  const login = useCallback(async (body) => finish(await api.login(body)), []);
  const register = useCallback(async (body) => finish(await api.register(body)), []);
  const logout = useCallback(async () => { await api.logout(); setUser(null); setStatus("guest"); setAccountOpen(false); pending.current = null; }, []);

  const refreshUser = useCallback(async () => { setUser(await api.me()); }, []); // used by the Account page after a profile change
  const requireLogin = useCallback((action, why = "") => { pending.current = action || null; setReason(why); setAuthOpen(true); }, []);
  const closeAuth = useCallback(() => { pending.current = null; setAuthOpen(false); }, []);
  const runPending = useCallback(() => { const f = pending.current; pending.current = null; if (f) f(); }, []);

  const value = useMemo(() => ({ user, status, authOpen, reason, accountOpen, setAccountOpen, login, register, logout, refreshUser, requireLogin, closeAuth, runPending }),
    [user, status, authOpen, reason, accountOpen, login, register, logout, refreshUser, requireLogin, closeAuth, runPending]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
