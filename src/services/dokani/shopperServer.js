// SERVER ONLY. Shopper-side adapter: turns the Dokani backend's answers into the exact shapes Freshly's screens already use
// (see API_CONTRACT.md / the Freshly API Integration Plan). The Dokani backend is NOT changed.
//   * shopper token  -> forwarded for "my wishlist / my addresses / my orders ..." calls (the backend checks the owner)
//   * service token  -> only for shop-wide things (public reviews, customer link, creating the sale)
import { dokaniSend, resetSession } from "./client";
import { cfg } from "./config";
import { getCatalog, getRawProducts } from "./catalog";
import { getStoreExtras } from "./storefront";
import { computeTotals } from "@/lib/pricing";
import { buildSlots, slotDate } from "@/lib/delivery";
import { cleanPhone, isPhone, lineTotal, maxQty } from "@/lib/format";

export class ApiFail extends Error {
  constructor(message, status = 422, data = null) { super(message); this.name = "ApiFail"; this.status = status; this.data = data; }
}
const firstError = (d) => { const e = d?.errors; if (e && typeof e === "object") { const v = e[Object.keys(e)[0]]; return Array.isArray(v) ? v[0] : v ? String(v) : null; } return null; };

async function call(method, path, { json, token } = {}, retried = false) {
  const res = await dokaniSend(method, path, { json, shopperToken: token });
  if (!token && res.status === 401 && !retried) { resetSession(); return call(method, path, { json, token }, true); } // the shop's own login expired: log in again once
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    // A 401 on a SERVICE call is our own shop-login problem, never the shopper's: do not let it log the customer out.
    const status = !token && res.status === 401 ? 502 : res.status;
    throw new ApiFail(firstError(data) || data?.message || `Request failed (${res.status})`, status, data);
  }
  return { status: res.status, data };
}
const svc = (method, path, json) => call(method, path, { json });
const usr = (method, path, token, json) => call(method, path, { json, token });

const num = (v, d = 0) => { const x = Number(v); return Number.isFinite(x) ? x : d; };
const ms = (d) => { const t = Date.parse(String(d ?? "").replace(" ", "T")); return Number.isFinite(t) ? t : Date.now(); };
const shortName = (n) => { const p = String(n || "").trim().split(/\s+/).filter(Boolean); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0].toUpperCase()}.` : p[0] || "Customer"; };
const meOf = async (token) => (await usr("GET", "/auth/me", token)).data || {};

// ---------------------------------------------------------------- wishlist
const wishIds = async (token) => ((await usr("GET", "/wishlist", token)).data?.items || []).map((i) => num(i.product_id ?? i.id));
export const getWishlist = async ({ token }) => ({ productIds: await wishIds(token) });
export const addWish = async ({ token, params: [id] }) => { await usr("PUT", `/wishlist/${id}`, token); return { productIds: await wishIds(token) }; };
export const removeWish = async ({ token, params: [id] }) => {
  try { await usr("DELETE", `/wishlist/${id}`, token); } catch (e) { if (e.status !== 404) throw e; } // already gone = fine
  return { productIds: await wishIds(token) };
};

// ---------------------------------------------------------------- addresses
// Freshly { id, type: Home|Office, line, areaId }  <->  Dokani { id, label, name, phone, line, area_id, city }
// A non-numeric Freshly area id (demo areas like "dhaka") is kept in `city`, so it survives the round trip.
const toAddr = (a) => ({ id: a.id, type: /office/i.test(a.label || "") ? "Office" : "Home", line: a.line || "", areaId: a.area_id != null ? String(a.area_id) : a.city || "" });
async function addrBody(token, b, partial) {
  if (!partial || b.line != null) { if (!String(b.line || "").trim()) throw new ApiFail("Please enter the full address.", 422); }
  if (!partial || b.type != null) { if (!["Home", "Office"].includes(b.type)) throw new ApiFail("Address type must be Home or Office.", 422); }
  const body = {};
  if (b.type) body.label = b.type;
  if (b.line != null) body.line = String(b.line).trim();
  if (b.areaId != null && b.areaId !== "") { body.area_id = /^\d+$/.test(String(b.areaId)) ? Number(b.areaId) : null; body.city = String(b.areaId); }
  if (!partial) { const me = await meOf(token); body.name = me.name || "Customer"; body.phone = me.phone || "N/A"; } // Dokani wants a name + phone on every address
  return body;
}
export const getAddresses = async ({ token }) => ((await usr("GET", "/addresses", token)).data?.addresses || []).map(toAddr);
export const addAddress = async ({ token, body }) => { const { data } = await usr("POST", "/addresses", token, await addrBody(token, body, false)); return toAddr(data.address || data); };
export const updateAddress = async ({ token, body, params: [id] }) => { const { data } = await usr("PUT", `/addresses/${id}`, token, await addrBody(token, body, true)); return toAddr(data.address || data); };
export const deleteAddress = async ({ token, params: [id] }) => { await usr("DELETE", `/addresses/${id}`, token); };

// ---------------------------------------------------------------- reviews
const toReview = (r, x = {}) => ({ id: r.id, userId: x.userId ?? null, name: x.name || shortName(r.shopper?.name), rating: num(r.rating), text: r.text || "", createdAt: ms(r.created_at), verified: !!r.verified, helpful: num(r.helpful_count), voted: false });
export const getReviews = async ({ params: [pid] }) => ((await svc("GET", `/products/${pid}/reviews?per_page=100`)).data?.reviews || []).map((r) => toReview(r));
export const addReview = async ({ token, body, params: [pid] }) => {
  const rating = Math.round(Number(body.rating));
  if (!(rating >= 1 && rating <= 5)) throw new ApiFail("Please choose 1 to 5 stars.", 422);
  const text = String(body.text || "").trim().slice(0, 500) || `Rated ${rating} out of 5`; // Dokani requires some text
  const { data } = await usr("POST", `/products/${pid}/reviews`, token, { rating, text });
  const me = await meOf(token);
  return toReview(data.review || data, { userId: me.id, name: shortName(me.name) });
};
export const voteReview = async ({ token, params: [pid, rid] }) => {
  const { data } = await usr("POST", `/products/${pid}/reviews/${rid}/helpful`, token);
  return { id: num(data.review_id, num(rid)), helpful: num(data.helpful_count), voted: !!data.helpful };
};

// ---------------------------------------------------------------- coupons
// Dokani answers { valid, code, discount, discount_type, discount_value }. Freshly needs the RULE { code, type, value, max?, min?, label }.
async function checkCoupon(token, codeIn, subtotal) {
  const code = String(codeIn || "").trim();
  if (!code) throw new ApiFail("Enter a coupon code.", 422);
  const { data } = await usr("POST", "/coupons/validate", token, { code, subtotal });
  if (!data?.valid) {
    const m = data?.message || "This coupon code is not valid.";
    if (/minimum/i.test(m) && data?.minimum_amount != null) throw new ApiFail(`Add ৳${Math.ceil(num(data.minimum_amount) - subtotal)} more to use ${code.toUpperCase()} (minimum order ৳${Math.round(num(data.minimum_amount))}).`, 422);
    throw new ApiFail(/expired|used/i.test(m) ? m : "This coupon code is not valid.", /minimum/i.test(m) ? 422 : 404);
  }
  const percent = data.discount_type === "percent", value = num(data.discount_value), discount = num(data.discount);
  const raw = percent ? (subtotal * value) / 100 : value;
  const max = percent && discount < raw - 0.5 ? Math.round(discount) : undefined; // the cap shows up as "discount smaller than the plain percentage"
  const rule = { code: data.code || code.toUpperCase(), type: percent ? "percent" : "flat", value, ...(max ? { max } : {}), label: percent ? `${value}% off${max ? ` (max ৳${max})` : ""}` : `৳${Math.round(value)} off` };
  return { rule, discount };
}
export const validateCoupon = async ({ token, body }) => (await checkCoupon(token, body.code, num(body.subtotal))).rule;

// ---------------------------------------------------------------- orders
// Dokani status -> Freshly status. ("packed" is not a Dokani step: the shop moves processing -> shipped.)
const STATUS = { pending: "confirmed", confirmed: "confirmed", processing: "preparing", packed: "packed", shipped: "out_for_delivery", out_for_delivery: "out_for_delivery", delivered: "delivered", cancelled: "cancelled", canceled: "cancelled" };
const METHOD = { cash: "Cash on Delivery", cod: "Cash on Delivery", bkash: "bKash", nagad: "Nagad", rocket: "Rocket", bank: "Bank", card: "Card" };
const payName = (m) => METHOD[String(m || "").toLowerCase()] || m || "Cash on Delivery";
// The storefront uses friendly labels; Dokani's SaleRequest accepts lowercase enum values.
const paymentCode = (method) => ({
  cashondelivery: "cod", cod: "cod", cash: "cash", bkash: "bkash", nagad: "nagad",
  rocket: "rocket", bank: "bank", card: "card",
})[String(method || "").toLowerCase().replace(/[^a-z]/g, "")] || null;
const parseJson = (s) => { try { const v = JSON.parse(s || ""); return v && typeof v === "object" ? v : {}; } catch { return {}; } };
const parseSlot = (s) => { const p = String(s || "").split("|"); return p.length >= 4 ? { id: p[0], day: p[1], date: p[2], label: p.slice(3).join("|") } : null; };

// o = Dokani order summary (GET /orders), sale = full sale row (GET /sales/storefront/{no}, optional: slot / area / coupon / substitution)
function toOrder(o, sale, units) {
  const meta = parseJson(sale?.substitution_preference);
  const subscribed = new Set((meta.subscribed || []).map(String));
  const items = (o.items || []).map((i) => {
    const pid = i.product_id, price = num(i.unit_price), qty = num(i.qty);
    return { productId: pid, name: i.name || "", unit: units.get(String(pid)) || "pc", price, qty, total: Math.round(price * qty), subscribe: subscribed.has(String(pid)), substitution: meta.subst?.[pid] || "brand" };
  });
  const status = STATUS[String(o.status || "").toLowerCase()] || "confirmed";
  const method = payName(sale?.payment_method || o.payment_method);
  const paid = String(o.payment_status || "").toLowerCase() === "paid";
  const t = meta.totals;
  const subtotal = num(o.subtotal), delivery = num(o.delivery), total = num(o.total);
  return {
    id: o.order_number, createdAt: ms(o.created_at), status, items,
    address: { type: meta.addrType || "Home", line: o.address || "" },
    delivery: { method: sale?.delivery_type || meta.method || "standard", areaId: meta.areaId ?? (sale?.area_id != null ? String(sale.area_id) : ""), areaName: meta.areaName || "", slot: parseSlot(sale?.delivery_slot), eta: meta.eta || "" },
    payment: { method, phone: sale?.payment_ref || null, status: paid ? "paid" : method === "Cash on Delivery" ? "pay_on_delivery" : "pending" },
    coupon: sale?.coupon_code || null,
    totals: t || { subtotal, subDiscount: 0, couponDiscount: num(o.discount), delivery, free: delivery === 0, savings: num(o.discount), total },
  };
}
async function extra(orderNo) { try { return (await svc("GET", `/sales/storefront/${encodeURIComponent(orderNo)}`)).data?.sale || null; } catch { return null; } }
async function unitMap() { const c = await getCatalog(); return new Map(c.products.map((p) => [String(p.id), p.unit])); }


export const getOrders = async ({ token }) => {
  const [{ data }, units] = await Promise.all([usr("GET", "/orders?per_page=50", token), unitMap()]);
  const list = data?.items || [];
  const sales = await Promise.all(list.map((o) => extra(o.order_number)));
  return list.map((o, i) => toOrder(o, sales[i], units));
};
const loadOrder = async (token, id) => {
  const [{ data }, units] = await Promise.all([usr("GET", `/orders/${encodeURIComponent(id)}`, token), unitMap()]);
  const o = data?.order; if (!o) throw new ApiFail("Order not found.", 404);
  return toOrder(o, await extra(o.order_number), units);
};
export const getOrder = async ({ token, params: [id] }) => loadOrder(token, id);
export const cancelOrder = async ({ token, params: [id] }) => {
  try { await usr("POST", `/orders/${encodeURIComponent(id)}/cancel`, token); }
  catch (e) { if (e.status === 409) throw new ApiFail("This order is already packed and cannot be cancelled. Please call us.", 422); throw e; }
  return loadOrder(token, id);
};
// Freshly asks for a return of the whole order (reason + note); Dokani wants the list of items, so every line is sent.
export const requestReturn = async ({ token, body, params: [id] }) => {
  const reason = String(body.reason || "").trim();
  if (!reason) throw new ApiFail("Please choose a reason.", 422);
  const { data } = await usr("GET", `/orders/${encodeURIComponent(id)}`, token);
  const o = data?.order; if (!o) throw new ApiFail("Order not found.", 404);
  const items = (o.items || []).map((i) => ({ product_id: i.product_id, quantity: num(i.qty) }));
  try { await usr("POST", `/orders/${encodeURIComponent(id)}/returns`, token, { items, reason: reason.slice(0, 100), note: String(body.note || "").slice(0, 3000) }); }
  catch (e) { if (e.status === 422 && /delivered/i.test(e.message)) throw new ApiFail("Only delivered orders can be returned.", 422); if (e.status === 409) throw new ApiFail("A return was already requested for this order.", 409); throw e; }
  return { ...(await loadOrder(token, id)), returnRequest: { reason, note: String(body.note || ""), at: Date.now() } };
};

// ---------------------------------------------------------------- place order
// Dokani has no "place order" call; the website does what the POS does: new draft sale -> add every product -> check stock -> store the sale.
// One order at a time (a new draft closes the previous draft of the same service user).
let chain = Promise.resolve();
const serial = (fn) => { const run = chain.then(fn, fn); chain = run.catch(() => {}); return run; };
const dateDMY = () => { const d = new Date(Date.now() + 6 * 3600e3); return `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`; };

export const placeOrder = ({ token, body }) => serial(async () => {
  if (!Array.isArray(body.items) || !body.items.length) throw new ApiFail("Your cart is empty.", 422);
  const [catalog, raw, extras] = await Promise.all([getCatalog(), getRawProducts(), getStoreExtras()]);
  const byId = new Map(catalog.products.map((p) => [String(p.id), p]));
  const rawById = new Map(raw.map((r) => [String(r.id), r]));

  const lines = body.items.map((i) => {
    const prod = byId.get(String(i.productId));
    const qty = Number(i.qty);
    if (!prod) throw new ApiFail("A product in your cart is no longer available.", 422);
    if (prod.status === "out") throw new ApiFail(`${prod.name} is out of stock. Please remove it from your cart.`, 422);
    const maxLineQty = maxQty(prod, extras.config.maxQtyPerLine);
    if (!(qty > 0) || qty > maxLineQty) throw new ApiFail(`Only ${maxLineQty} of ${prod.name} available.`, 422);
    if (prod.unit === "kg" ? Math.round(qty * 2) / 2 !== qty : !Number.isInteger(qty)) throw new ApiFail(`Invalid quantity for ${prod.name}.`, 422);
    return { product: prod, qty, total: lineTotal(prod, qty), subscribe: !!i.subscribe && prod.subscribable, substitution: ["brand", "remove", "call"].includes(i.substitution) ? i.substitution : "brand" };
  });
  const area = extras.areas.find((a) => String(a.id) === String(body.areaId));
  if (!area) throw new ApiFail("Please choose a delivery area.", 422);
  const method = body.method === "express" ? "express" : "standard";
  if (method === "express" && !area.express) throw new ApiFail("Express delivery is not available in your area.", 422);
  const addrLine = String(body.address?.line || "").trim();
  if (!addrLine) throw new ApiFail("Please enter your delivery address.", 422);
  let slot = null;
  if (!area.courier && method === "standard") {
    const s = buildSlots(extras.slots, new Date(), extras.config.leadHours).list.find((x) => x.id === body.slot?.id && x.day === body.slot?.day);
    if (!s || s.disabled) throw new ApiFail("That delivery time slot is no longer available. Please pick another.", 422);
    slot = { id: s.id, label: s.label, day: s.day, date: slotDate(s.day) };
  }
  const payMethod = body.payment?.method;
  if (!extras.payments.includes(payMethod)) throw new ApiFail("Please choose a payment method.", 422);
  const apiPayMethod = paymentCode(payMethod);
  if (!apiPayMethod) throw new ApiFail("This payment method is not supported by the shop.", 422);
  const isCash = apiPayMethod === "cod" || apiPayMethod === "cash";
  const bankId = isCash ? null : Number(cfg().bankId);
  if (!isCash && (!Number.isInteger(bankId) || bankId <= 0)) throw new ApiFail("Online payment is not configured. Set DOKANI_BANK_ID in .env.local to a valid Dokani bank/account ID.", 503);
  const needsWallet = ["bkash", "nagad"].includes(apiPayMethod);
  const payPhone = needsWallet ? cleanPhone(body.payment?.phone || "") : "";
  if (needsWallet && !isPhone(payPhone)) throw new ApiFail(`Enter your ${payMethod} number.`, 422);

  // prices come from Dokani, never from the browser
  const subscribed = lines.filter((l) => l.subscribe).map((l) => l.product.id);
  const base = computeTotals({ lines, subscribed, coupon: null, area, method, cfg: extras.config });
  let couponOff = 0, couponCode = null;
  if (body.couponCode) {
    const c = await checkCoupon(token, body.couponCode, base.subtotal - base.subDiscount);
    couponOff = Math.min(Math.round(c.discount), base.subtotal - base.subDiscount); couponCode = c.rule.code;
  }
  const totals = { ...base, couponDiscount: couponOff, savings: base.savings + couponOff, total: Math.max(0, base.subtotal - base.subDiscount - couponOff + base.delivery) };

  // link the shopper to its Dokani customer (same call the sign-up uses, so no duplicate is made)
  const me = await meOf(token);
  const cust = await svc("POST", "/customers", { name: me.name || "Customer", ...(me.phone ? { phone: me.phone } : {}), ...(me.email ? { email: me.email } : {}), source: process.env.DOKANI_SOURCE || "freshly", external_user_id: me.id }).catch((e) => { throw new ApiFail(`Could not link your account to the shop (${e.message}).`, 502); });
  const customerId = cust.data?.data?.id;
  if (!customerId) throw new ApiFail("Could not link your account to the shop.", 502);

  const created = await svc("POST", "/temporary/sales/new", { sale_type: 1, source: "web" });
  const saleId = created.data?.data?.sale_id;
  if (!saleId) throw new ApiFail("The shop could not start your order. Please try again.", 502);
  try {
    for (const l of lines) {
      const r = rawById.get(String(l.product.id)) || {};
      try {
        await svc("POST", "/temporary/sales/add-product", { sale_id: saleId, product_id: l.product.id, quantity: l.qty, exact_sale_price: l.product.price, exact_buy_price: num(r.avg_buy_price) || num(r.last_buy_price), mrp: num(r.mrp) || l.product.mrp, is_service: false, source: "web" });
      } catch (e) {
        if (/insufficient stock/i.test(e.message)) throw new ApiFail(`Only ${num(e.data?.available)} of ${l.product.name} available.`, 422);
        throw e;
      }
    }
    const chk = (await svc("POST", "/temporary/sales/check-stock", { sale_id: saleId })).data;
    if (chk && chk.stock_ok === false) { const s = chk.short_items?.[0]; throw new ApiFail(s ? `Only ${num(s.available)} of ${s.name} available.` : "Some items are out of stock.", 422); }

    const orderNo = `ORD-${String(saleId).padStart(6, "0")}`;
    const exact = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
    const meta = { v: 1, totals, addrType: body.address?.type === "Office" ? "Office" : "Home", method, areaId: String(area.id), areaName: area.name, eta: area.eta || "", subscribed, subst: Object.fromEntries(lines.map((l) => [l.product.id, l.substitution])) };
    const sale = (price) => ({
      id: saleId, customer_id: customerId, payment_by: isCash ? 1 : 2, ...(bankId ? { bank_id: bankId } : {}), sale_date: dateDMY(), total_exact_sale_price: price,
      discount: base.subDiscount + couponOff, discount_type: "fixed", received: 0, round_amount: totals.total,
      source: "web", order_no: orderNo, order_status: "pending", payment_status: "pending",
      delivery_address: addrLine, area_id: /^\d+$/.test(String(area.id)) ? Number(area.id) : null, delivery_type: method, ...(area.optionId ? { delivery_option_id: area.optionId, delivery_city: area.city || "" } : {}),
      delivery_slot: slot ? `${slot.id}|${slot.day}|${slot.date}|${slot.label}` : null, delivery_charge: totals.delivery,
      payment_method: apiPayMethod, payment_ref: payPhone || null, coupon_code: couponCode,
      substitution_preference: JSON.stringify(meta), subscribe_flag: subscribed.length > 0, note: `${area.name}${slot ? ` · ${slot.label} (${slot.day})` : ""}`,
    });
    let res = (await svc("POST", "/sales", sale(Math.round(exact * 10000) / 10000))).data;
    if (res?.sale_price_not_match) res = (await svc("POST", "/sales", sale(Math.round(exact)))).data; // shop keeps 0 decimal places
    if (res?.stock_out) { const p = res.products?.[0]; throw new ApiFail(p?.name ? `Only ${num(p.stock_amount)} of ${p.name} available.` : "Some items are out of stock.", 422); }
    if (res?.sale_price_not_match) throw new ApiFail("The shop price changed. Please refresh and try again.", 409);
    if (!res?.sale) throw new ApiFail("The shop could not save your order. Please try again.", 502);
    return await loadOrder(token, orderNo);
  } catch (e) {
    await svc("PUT", `/temporary/sales/${saleId}/destroy`).catch(() => {}); // never leave a half-made draft in the POS
    throw e;
  }
});

// ---------------------------------------------------------------- cart (L2-19 / L2-20)
// Dokani cart line { product_id, quantity (0.5 kg steps), subscribe, substitution }  <->  Freshly { items: { id: qty }, subscribed: [id], substitutions: { id: "brand"|"remove"|"call" } }
export const getCart = async ({ token }) => {
  const lines = (await usr("GET", "/cart", token)).data?.cart?.items || [];
  const out = { items: {}, subscribed: [], substitutions: {} };
  for (const l of lines) {
    const id = num(l.product_id), q = num(l.quantity);
    if (!id || !(q > 0)) continue;
    out.items[id] = q;
    if (l.subscribe) out.subscribed.push(id);
    if (l.substitution) out.substitutions[id] = l.substitution;
  }
  return out;
};
export const saveCart = async ({ token, body }) => {
  const items = body.items && typeof body.items === "object" ? body.items : {};
  const sub = new Set((body.subscribed || []).map(String)), subst = body.substitutions || {};
  const lines = Object.entries(items).map(([id, q]) => ({ id: num(id), q: num(q) })).filter((l) => l.id > 0 && l.q > 0).slice(0, 100);
  const payload = lines.map((l) => ({ product_id: l.id, quantity: Math.round(l.q * 2) / 2 || 0.5, subscribe: sub.has(String(l.id)), ...([ "brand", "remove", "call" ].includes(subst[l.id]) ? { substitution: subst[l.id] } : {}) }));
  if (!payload.length) { await usr("DELETE", "/cart", token); return body; }  // empty cart = clear it
  await usr("PUT", "/cart", token, { items: payload });
  return body;
};

// ---------------------------------------------------------------- offer reminders (L3-14 / L3-15)
// Only real Dokani campaigns ("c12") are saved on the server; demo offers (w1, u1 ...) stay in the browser.
export const setOfferRemind = async ({ token, params: [id], method }) => {
  if (method === "DELETE") { try { await usr("DELETE", `/offers/${id}/remind`, token); } catch (e) { if (e.status !== 404) throw e; } return; }
  await usr("POST", `/offers/${id}/remind`, token);
};

// ---------------------------------------------------------------- alerts (notify me / price alert)
export const getAlerts = async ({ token }) => {
  const rows = ((await usr("GET", "/alerts", token)).data?.alerts || []).filter((a) => Number(a.status) !== 0);
  return { notify: rows.filter((a) => a.type === "back_in_stock").map((a) => num(a.product_id)), priceAlerts: rows.filter((a) => a.type === "price_drop").map((a) => num(a.product_id)), offerReminders: rows.filter((a) => a.type === "offer_reminder").map((a) => `c${num(a.campaign_id)}`) };
};
export const setNotify = async ({ token, params: [id], method }) => {
  try { await usr(method === "DELETE" ? "DELETE" : "POST", `/products/${id}/notify`, token); } catch (e) { if (![404, 409].includes(e.status)) throw e; }
};
export const setPriceAlert = async ({ token, params: [id], method }) => {
  if (method === "DELETE") { try { await usr("DELETE", `/products/${id}/price-alert`, token); } catch (e) { if (e.status !== 404) throw e; } return; }
  const p = (await getCatalog()).products.find((x) => String(x.id) === String(id));
  if (!p) throw new ApiFail("Product not found.", 404);
  await usr("POST", `/products/${id}/price-alert`, token, { target_price: Math.max(0, p.price - 1) }); // alert when it gets cheaper than today
};
