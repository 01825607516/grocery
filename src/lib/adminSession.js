// BROWSER ONLY. Admin ("Website Management") session helpers.
//
// The website has ONE login form. Customers sign in with it as before; a staff member who has
// Website Control access signs in with the very same form (see AuthContext.login). The admin
// session itself lives in Laravel (cookie "dokani_admin_session", path /admin) and reaches the
// browser through the /admin/* rewrites in next.config.js, so this site and the panel share one origin.

const FLAG = "gs_admin";
const ls = () => { try { return typeof window !== "undefined" ? window.localStorage : null; } catch { return null; } };

// A tiny "an admin was signed in on this browser" hint. It only decides whether the site asks the
// server about the admin session at start-up (so ordinary visitors never make that extra request).
export const adminFlag = {
  get: () => { try { return ls()?.getItem(FLAG) === "1"; } catch { return false; } },
  set: () => { try { ls()?.setItem(FLAG, "1"); } catch {} },
  clear: () => { try { ls()?.removeItem(FLAG); } catch {} },
};

export class AdminError extends Error {
  constructor(message, status = 0, data = null) { super(message); this.name = "AdminError"; this.status = status; this.data = data; }
}

let csrfToken = "";

// The CSRF token is printed in Laravel's admin login page (same session cookie the dashboard uses).
export async function fetchCsrf() {
  let res;
  try { res = await fetch("/admin/login", { credentials: "same-origin", cache: "no-store", headers: { Accept: "text/html" } }); }
  catch { throw new AdminError("Could not reach the admin service. Check that the Laravel backend is running."); }
  const html = await res.text();
  csrfToken = html.match(/name="_token" value="([^"]+)"/)?.[1] || html.match(/name="csrf-token" content="([^"]+)"/)?.[1] || "";
  if (!csrfToken) throw new AdminError("The admin service did not return a security token.", res.status);
  return csrfToken;
}
export const getCsrf = async (force = false) => (!force && csrfToken ? csrfToken : fetchCsrf());

// Who is signed in as admin right now? -> { name, email, shop_id } or null (never throws).
export async function adminMe() {
  try {
    const res = await fetch("/admin/api/me", { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.admin || null;
  } catch { return null; }
}

// Sign in with a staff email / mobile. Resolves to the admin profile, or throws.
// Laravel answers a login post with a redirect either way, so success is decided by asking /admin/api/me.
export async function adminSignIn(login, password) {
  const token = await getCsrf(true);
  try {
    await fetch("/admin/login", {
      method: "POST", credentials: "same-origin", redirect: "manual",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "text/html" },
      body: new URLSearchParams({ _token: token, login: String(login || ""), password: String(password || "") }),
    });
  } catch { throw new AdminError("Could not reach the admin service."); }
  const admin = await adminMe();
  if (!admin) throw new AdminError("This account cannot manage the website.", 403);
  csrfToken = ""; // the session was renewed: fetch a fresh token for the first save
  adminFlag.set();
  return admin;
}

export async function adminSignOut() {
  try {
    const token = await getCsrf(true);
    await fetch("/admin/logout", { method: "POST", credentials: "same-origin", redirect: "manual", headers: { "X-CSRF-TOKEN": token, Accept: "text/html" } });
  } catch {}
  csrfToken = "";
  adminFlag.clear();
}

// Call the dashboard JSON API:  adminApi("/orders", { query: { page: 2 } })  /  adminApi("/settings", { method: "PUT", json: {...} })
//   form: FormData for file uploads.  A 401 means the admin session ended: "gs:admin-expired" is fired so the UI can sign out.
export async function adminApi(path, { method = "GET", json, form, query } = {}) {
  const qs = query ? new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => [k, String(v)])).toString() : "";
  const url = `/admin/api${path}${qs ? `?${qs}` : ""}`;
  const attempt = async () => {
    const headers = { Accept: "application/json" };
    if (method !== "GET") headers["X-CSRF-TOKEN"] = await getCsrf();
    let body;
    if (json !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(json); }
    else if (form) body = form;
    try { return await fetch(url, { method, headers, body, credentials: "same-origin", cache: "no-store" }); }
    catch { throw new AdminError("Network error. Check your connection and try again."); }
  };
  let res = await attempt();
  if (res.status === 419) { csrfToken = ""; res = await attempt(); } // stale security token: refresh once and retry
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event("gs:admin-expired"));
    const detail = data?.errors ? Object.values(data.errors).flat().join(" ") : "";
    throw new AdminError(detail || data?.message || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}

// Tell the website server to forget its 60-second cache so a saved change shows up on the site straight away.
export const refreshStorefront = () => fetch("/api/store/refresh", { method: "POST", cache: "no-store" }).catch(() => {});
