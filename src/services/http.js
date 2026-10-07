import { API_URL } from "./config";
import { tokenStore } from "./tokenStore";

export class ApiError extends Error {
  constructor(message, status = 0, details = null) { super(message); this.status = status; this.details = details; }
}

// Thin fetch wrapper: JSON in/out, Bearer token, normalised errors.
// A 401 on an authenticated call fires "gs:auth-expired" so the app can log the user out and show the login popup.
export async function http(path, { method = "GET", body, auth = true, query } = {}) {
  const qs = query ? "?" + new URLSearchParams(Object.entries(query).filter(([, v]) => v != null)).toString() : "";
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}${qs}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError("Network error. Please check your connection and try again.");
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && auth && token && typeof window !== "undefined") window.dispatchEvent(new Event("gs:auth-expired"));
    throw new ApiError(data?.message || data?.error || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}
