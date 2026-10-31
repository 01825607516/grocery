// ---------------------------------------------------------------------------
// Backend switch.
//   NEXT_PUBLIC_API_URL empty  -> MOCK mode (everything is stored in the browser, no server needed)
//   NEXT_PUBLIC_API_URL=https://api.example.com/v1  -> real backend (see src/services/httpApi.js)
// ---------------------------------------------------------------------------
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
export const USE_MOCK = !API_URL;
// Real SHOPPER AUTH only (register / login / me / profile / password / logout) through our own Next.js server route (src/app/api/shop). Everything else stays on the mock.
export const AUTH_API_URL = (process.env.NEXT_PUBLIC_AUTH_API || "").replace(/\/$/, "");
