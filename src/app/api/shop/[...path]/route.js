import { NextResponse } from "next/server";
import { dokaniSend, DokaniError } from "@/services/dokani/client";
import { isEnabled } from "@/services/dokani/config";
import * as S from "@/services/dokani/shopperServer";

// Shopper proxy (SERVER ONLY).   Browser -> /api/shop/...  -> Dokani backend.
//   auth/*   : forwarded as is (register / login get the shop's service token, the rest use the shopper's own token)
//   the rest : handled in services/dokani/shopperServer.js, which also converts Dokani's answers to the shapes Freshly's screens use
// Only the routes listed below exist, so this can never be used to reach other Dokani (staff) APIs.
export const dynamic = "force-dynamic";

const AUTH = {
  "auth/register": { POST: "service" },
  "auth/login": { POST: "service" },
  "auth/me": { GET: "shopper" },
  "auth/profile": { PUT: "shopper" },
  "auth/password": { POST: "shopper" },
  "auth/logout": { POST: "shopper" },
};

// [method, path pattern, handler, needs shopper login?]
const ROUTES = [
  ["GET", /^wishlist$/, S.getWishlist, true],
  ["PUT", /^wishlist\/(\d+)$/, S.addWish, true],
  ["DELETE", /^wishlist\/(\d+)$/, S.removeWish, true],
  ["GET", /^cart$/, S.getCart, true],
  ["PUT", /^cart$/, S.saveCart, true],
  ["POST", /^offers\/(c?\d+)\/remind$/, S.setOfferRemind, true],
  ["DELETE", /^offers\/(c?\d+)\/remind$/, S.setOfferRemind, true],
  ["GET", /^addresses$/, S.getAddresses, true],
  ["POST", /^addresses$/, S.addAddress, true],
  ["PUT", /^addresses\/(\d+)$/, S.updateAddress, true],
  ["DELETE", /^addresses\/(\d+)$/, S.deleteAddress, true],
  ["GET", /^products\/(\d+)\/reviews$/, S.getReviews, false],
  ["POST", /^products\/(\d+)\/reviews$/, S.addReview, true],
  ["POST", /^products\/(\d+)\/reviews\/(\d+)\/helpful$/, S.voteReview, true],
  ["POST", /^coupons\/validate$/, S.validateCoupon, true],
  ["GET", /^orders$/, S.getOrders, true],
  ["POST", /^orders$/, S.placeOrder, true],
  ["GET", /^orders\/([\w-]+)$/, S.getOrder, true],
  ["POST", /^orders\/([\w-]+)\/cancel$/, S.cancelOrder, true],
  ["POST", /^orders\/([\w-]+)\/return$/, S.requestReturn, true],
  ["GET", /^me\/alerts$/, S.getAlerts, true],
  ["POST", /^products\/(\d+)\/notify$/, S.setNotify, true],
  ["DELETE", /^products\/(\d+)\/notify$/, S.setNotify, true],
  ["POST", /^products\/(\d+)\/price-alert$/, S.setPriceAlert, true],
  ["DELETE", /^products\/(\d+)\/price-alert$/, S.setPriceAlert, true],
];

const bearer = (req) => (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
const noStore = { "Cache-Control": "no-store" };

async function handle(req, { params }) {
  const path = ((await params).path || []).join("/");
  if (!isEnabled()) return NextResponse.json({ message: "Dokani is not configured on the server (.env.local)." }, { status: 503 });

  let body;
  if (req.method === "POST" || req.method === "PUT") body = await req.json().catch(() => ({}));

  try {
    // ---- auth: straight pass-through
    if (AUTH[path]) {
      const mode = AUTH[path][req.method];
      if (!mode) return NextResponse.json({ message: "Not found" }, { status: 404 });
      let shopperToken;
      if (mode === "shopper") {
        shopperToken = bearer(req);
        if (!shopperToken) return NextResponse.json({ message: "Please log in to continue." }, { status: 401 });
      }
      if (path === "auth/register") body = { ...body, source: process.env.DOKANI_SOURCE || "freshly" }; // the order flow finds the customer by this source
      const res = await dokaniSend(req.method, `/${path}`, { json: body, shopperToken });
      if (res.status === 204) return new Response(null, { status: 204 });
      const data = await res.json().catch(() => null);
      return NextResponse.json(data ?? { message: `Request failed (${res.status})` }, { status: res.status, headers: noStore });
    }

    // ---- everything else: adapted
    for (const [method, re, fn, needsLogin] of ROUTES) {
      const m = req.method === method && re.exec(path);
      if (!m) continue;
      let token;
      if (needsLogin) { token = bearer(req); if (!token) return NextResponse.json({ message: "Please log in to continue." }, { status: 401 }); }
      const url = new URL(req.url);
      const out = await fn({ token, body: body || {}, params: m.slice(1), method: req.method, query: Object.fromEntries(url.searchParams) });
      return out === undefined ? new Response(null, { status: 204 }) : NextResponse.json(out, { headers: noStore });
    }
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  } catch (e) {
    if (e instanceof S.ApiFail) return NextResponse.json({ message: e.message }, { status: e.status || 422, headers: noStore });
    if (e instanceof DokaniError) return NextResponse.json({ message: e.message }, { status: 502 });
    console.error("[shop]", req.method, path, e?.message || e);
    return NextResponse.json({ message: "Server error. Please try again." }, { status: 502 });
  }
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
