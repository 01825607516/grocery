// Minimal Dokani Cloud HTTP client: login once, keep the token on the server, add it to every call, log in again when it dies.
import { TOKEN_TTL_MS, cfg } from "./config";

export class DokaniError extends Error {
  constructor(message, { status = 0, data = null } = {}) { super(message); this.name = "DokaniError"; this.status = status; this.data = data; }
}

let session = null;       // { token, exp }
let pendingLogin = null;  // so ten parallel requests share ONE login call

export function resetSession() { session = null; pendingLogin = null; }

export function dokaniLogin() {
  if (pendingLogin) return pendingLogin;
  pendingLogin = (async () => {
    const c = cfg();
    if (!c.baseUrl || !c.login || !c.password) throw new DokaniError("Dokani is not configured: set DOKANI_BASE_URL, DOKANI_LOGIN and DOKANI_PASSWORD in .env.local");
    const body = new FormData(); // the API expects form-data: login, password
    body.set("login", c.login); body.set("password", c.password);
    let res;
    try { res = await fetch(`${c.baseUrl}/login`, { method: "POST", body, headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(15000) }); }
    catch (e) { throw new DokaniError(`Could not reach Dokani (${e?.message || "network error"})`); }
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.token) throw new DokaniError(json?.message || `Dokani login failed (HTTP ${res.status}). Check DOKANI_LOGIN and DOKANI_PASSWORD.`, { status: res.status, data: json });
    session = { token: json.token, exp: Date.now() + TOKEN_TTL_MS };
    return session;
  })().finally(() => { pendingLogin = null; });
  return pendingLogin;
}

async function token() {
  if (!session || Date.now() > session.exp) await dokaniLogin();
  return session.token;
}

// GET {baseUrl}{path}?{query} with the Bearer token. One automatic re-login if Dokani answers 401.
export async function dokaniGet(path, query = {}, { retried = false } = {}) {
  const c = cfg();
  const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => [k, String(v)])).toString();
  let res;
  try {
    res = await fetch(`${c.baseUrl}${path}${qs ? `?${qs}` : ""}`, { headers: { Accept: "application/json", Authorization: `Bearer ${await token()}` }, cache: "no-store", signal: AbortSignal.timeout(15000) });
  } catch (e) {
    if (e instanceof DokaniError) throw e;
    throw new DokaniError(`Could not reach Dokani (${e?.message || "network error"})`);
  }
  if (res.status === 401 && !retried) { resetSession(); return dokaniGet(path, query, { retried: true }); }
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.success === false) throw new DokaniError(json?.message || `Dokani request failed (HTTP ${res.status}) for ${path}`, { status: res.status, data: json, retryAfterMs: Number(res.headers.get("Retry-After")) * 1000 || 0 });
  return json;
}

// Safety net for a multi-shop platform: every Dokani row carries its shop_id. If it is not DOKANI_SHOP_ID we are logged in to the wrong shop.
export function assertShop(rows) {
  const want = cfg().shopId;
  if (!want) return;
  const bad = (rows || []).find((r) => r && r.shop_id != null && String(r.shop_id) !== want);
  if (bad) throw new DokaniError(`Wrong Dokani shop: the data belongs to shop ${bad.shop_id} but DOKANI_SHOP_ID is ${want}. Check DOKANI_LOGIN in .env.local.`);
}

// Any method + JSON body. Used by the shopper-auth proxy (src/app/api/shop). Returns the raw Response.
//   no shopperToken -> the service account (staff) token is used  (register / login: it only tells Dokani which shop to use)
//   shopperToken    -> that token is forwarded as is            (me / profile / password / logout)
// No automatic retry here: a 401 can be a normal "wrong password" answer and a retry would count as a second wrong attempt.
export async function dokaniSend(method, path, { json, shopperToken } = {}) {
  const c = cfg();
  const headers = { Accept: "application/json", Authorization: `Bearer ${shopperToken || (await token())}` };
  if (json !== undefined) headers["Content-Type"] = "application/json";
  try {
    return await fetch(`${c.baseUrl}${path}`, { method, headers, body: json !== undefined ? JSON.stringify(json) : undefined, cache: "no-store", signal: AbortSignal.timeout(15000) });
  } catch (e) {
    if (e instanceof DokaniError) throw e;
    throw new DokaniError(`Could not reach Dokani (${e?.message || "network error"})`);
  }
}
