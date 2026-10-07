"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/services";
import { useAuth } from "./AuthContext";
import { useCatalog } from "./CatalogContext";
import { buildSlots } from "@/lib/delivery";
import { lineTotal, maxQty, qtyLabel, stepOf } from "@/lib/format";
import { computeTotals } from "@/lib/pricing";
import { burstFromElement } from "@/lib/confetti";

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const ls = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

export function CartProvider({ children }) {
  const cat = useCatalog();
  const { user, requireLogin, runPending } = useAuth();

  const [items, setItems] = useState({});            // { productId: qty }
  const [wishlist, setWishlist] = useState([]);
  const [viewed, setViewed] = useState([]);          // guests can browse, so this is kept per browser
  const [orders, setOrders] = useState([]);
  const [areaId, setAreaId] = useState(cat.areas[0].id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [method, setMethod] = useState("standard");
  const [slotId, setSlotId] = useState(null);
  const [subscribed, setSubscribed] = useState([]);
  const [subst, setSubst] = useState({});            // { productId: "brand" | "remove" | "call" }
  const [coupon, setCoupon] = useState(null);
  const [toast, setToast] = useState(null);
  const [quick, setQuick] = useState(null);          // product shown in the quick-view popup
  const [buyNow, setBuyNow] = useState(null);        // { id, qty }: "Buy now" = check out ONLY this product, the cart is left untouched
  const [hydrated, setHydrated] = useState(null);    // id of the user whose server data has been loaded

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const notify = useCallback((msg) => { setToast({ id: Date.now(), msg }); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }, [toast]);

  // browser-only preferences (after mount, so server and first client render match)
  useEffect(() => {
    setViewed(ls.get("gs_viewed", []));
    const saved = ls.get("gs_area", null);
    if (saved && cat.areas.some((a) => a.id === saved)) setAreaId(saved);
  }, [cat.areas]);

  // log in -> load that user's cart / wishlist / orders. log out -> clear everything personal.
  const reset = () => { setItems({}); setWishlist([]); setOrders([]); setSubscribed([]); setSubst({}); setCoupon(null); setHydrated(null); setDrawerOpen(false); };
  useEffect(() => {
    if (!user) return reset();
    let live = true;
    Promise.all([api.getCart(), api.getWishlist(), api.getOrders()])
      .then(([cart, wish, ords]) => {
        if (!live) return;
        setItems(cart.items || {}); setSubscribed(cart.subscribed || []); setSubst(cart.substitutions || {});
        setWishlist(wish); setOrders(ords); setHydrated(user.id);
      })
      .catch((e) => live && (notify(e.message || "Could not load your cart."), setHydrated(user.id)));
    return () => { live = false; };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // action the shopper wanted before the login popup (e.g. "add Tomato") runs once their cart is loaded
  useEffect(() => { if (user && hydrated === user.id) runPending(); }, [user, hydrated, runPending]);

  // keep the server cart in sync (debounced)
  const first = useRef(true);
  useEffect(() => {
    if (!user || hydrated !== user.id) { first.current = true; return; }
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => api.saveCart({ items, subscribed, substitutions: subst }).catch(() => {}), 500);
    return () => clearTimeout(t);
  }, [items, subscribed, subst, user, hydrated]);

  const gate = (fn, why) => (user ? fn() : requireLogin(fn, why));

  // ---- cart actions ----
  const setQty = (id, qty) => {
    const p = cat.getProduct(id); if (!p) return;
    const max = maxQty(p);
    if (qty > max) { notify(max ? `Only ${qtyLabel(p, max)} of ${p.name} available` : `${p.name} is out of stock`); qty = max; }
    setItems((prev) => { const next = { ...prev }; if (qty <= 0) delete next[id]; else next[id] = qty; return next; });
    if (qty <= 0) { setSubscribed((s) => s.filter((x) => x !== id)); }
  };
  const add = (p, qty = stepOf(p), el = null) => gate(() => { setQty(p.id, (itemsRef.current[p.id] || 0) + qty); if (el?.isConnected) burstFromElement(el); }, "Please log in to add items to your cart.");
  // `el` (optional) = the clicked button; when given, a small confetti burst pops from it once something was really added
  const addMany = (list, label = "items", el = null) => gate(() => {
    const ok = list.filter((p) => p.status !== "out");
    if (ok.length && el?.isConnected) burstFromElement(el, true);
    ok.forEach((p) => setQty(p.id, Math.min((itemsRef.current[p.id] || 0) + stepOf(p), maxQty(p))));
    if (ok.length < list.length) notify(`${list.length - ok.length} out-of-stock ${label} skipped`);
    setDrawerOpen(true);
  }, "Please log in to add these to your cart.");
  const reorder = (order, el = null) => gate(() => {
    let skipped = 0;
    order.items.forEach((i) => {
      const p = cat.getProduct(i.productId);
      if (!p || p.status === "out") return void (skipped += 1);
      setQty(p.id, Math.min((itemsRef.current[p.id] || 0) + i.qty, maxQty(p)));
    });
    if (el?.isConnected && skipped < order.items.length) burstFromElement(el, true);
    if (skipped) notify(`${skipped} unavailable item${skipped > 1 ? "s" : ""} skipped`);
    setDrawerOpen(true);
  }, "Please log in to reorder.");
  const toggleSub = (id) => setSubscribed((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const isWished = (id) => wishlist.some((w) => String(w) === String(id));
  const toggleWish = (id) => gate(async () => {
    const on = !wishlist.some((w) => String(w) === String(id));
    setWishlist((w) => (on ? [...w, id] : w.filter((x) => String(x) !== String(id))));
    try { setWishlist(await api.setWishlisted(id, on)); } catch (e) { setWishlist((w) => (on ? w.filter((x) => String(x) !== String(id)) : [...w, id])); notify(e.message || "Could not update wishlist"); }
  }, "Please log in to save items to your wishlist.");

  const markViewed = (id) => setViewed((v) => { const n = [id, ...v.filter((x) => x !== id)].slice(0, 10); ls.set("gs_viewed", n); return n; });
  const openProduct = (p) => { markViewed(p.id); setQuick(p); };
  // "Buy now": log in if needed, then open checkout with just this product (500 g / 1 piece to start; the shopper can change it there)
  const startBuyNow = (p) => gate(() => {
    if (p.status === "out") return notify(`${p.name} is out of stock`);
    setQuick(null); setDrawerOpen(false); setBuyNow({ id: p.id, qty: stepOf(p) });
  }, "Please log in to buy this item.");
  const setBuyNowQty = (qty) => setBuyNow((b) => { if (!b) return b; const p = cat.getProduct(b.id); const max = maxQty(p); if (qty > max) notify(`Only ${qtyLabel(p, max)} of ${p.name} available`); return { ...b, qty: Math.max(stepOf(p), Math.min(qty, max)) }; });
  const setArea = (a) => { setAreaId(a.id); ls.set("gs_area", a.id); };

  // ---- derived data ----
  const area = cat.areas.find((a) => a.id === areaId) || cat.areas[0];
  const lines = useMemo(() => Object.entries(items).map(([id, qty]) => { const product = cat.getProduct(id); return product ? { product, qty, total: lineTotal(product, qty) } : null; }).filter(Boolean), [items, cat]);
  // what the checkout popup shows / orders: the single "Buy now" product, or the whole cart
  const checkoutLines = useMemo(() => {
    if (!buyNow) return lines;
    const product = cat.getProduct(buyNow.id);
    return product ? [{ product, qty: buyNow.qty, total: lineTotal(product, buyNow.qty) }] : [];
  }, [buyNow, lines, cat]);
  const effMethod = method === "express" && area.express ? "express" : "standard";
  const slotsInfo = useMemo(() => (checkoutLines.length && !area.courier ? buildSlots(cat.slots, new Date(), cat.config.leadHours) : null), [checkoutLines.length > 0, drawerOpen, area, cat.slots, cat.config.leadHours]); // eslint-disable-line react-hooks/exhaustive-deps
  const slot = slotsInfo ? slotsInfo.list.find((s) => s.id === slotId && !s.disabled) || slotsInfo.list.find((s) => !s.disabled) || null : null;
  const totals = computeTotals({ lines, subscribed, coupon, area, method: effMethod, cfg: cat.config });
  const checkoutTotals = buyNow ? computeTotals({ lines: checkoutLines, subscribed: [], coupon: null, area, method: effMethod, cfg: cat.config }) : totals;
  const subtotalForCoupon = totals.subtotal - totals.subDiscount;

  const applyCoupon = async (code) => {
    if (!user) return requireLogin(null, "Please log in to use a coupon.");
    const c = await api.validateCoupon({ code, subtotal: subtotalForCoupon }); // throws with a readable message when invalid
    setCoupon(c); return c;
  };

  const placeOrder = async ({ address, payment }) => {
    const order = await api.placeOrder({
      items: checkoutLines.map((l) => ({ productId: l.product.id, qty: l.qty, subscribe: !buyNow && subscribed.includes(l.product.id), substitution: (!buyNow && subst[l.product.id]) || "brand" })),
      address, areaId: area.id, method: effMethod,
      slot: slot ? { id: slot.id, day: slot.day } : null,
      payment, couponCode: buyNow ? null : coupon?.code || null,
    });
    if (!buyNow) { setItems({}); setSubscribed([]); setSubst({}); setCoupon(null); } // "Buy now" orders never touch the cart
    api.getOrders().then(setOrders).catch(() => {});
    return order;
  };
  const refreshOrders = () => api.getOrders().then(setOrders).catch(() => {});

  const value = {
    cfg: cat.config,
    items, lines, count: lines.length, wishlist, isWished, viewed, orders, refreshOrders,
    area, setArea, drawerOpen, setDrawerOpen,
    method: effMethod, setMethod, slotsInfo, slot, setSlotId,
    subscribed, toggleSub, subst, setSubst, coupon, setCoupon, applyCoupon,
    totals, subtotal: totals.subtotal, savings: totals.savings,
    buyNow, startBuyNow, setBuyNowQty, closeBuyNow: () => setBuyNow(null), checkoutLines, checkoutTotals,
    setQty, add, addMany, reorder, toggleWish, markViewed, openProduct, quick, closeProduct: () => setQuick(null),
    placeOrder, notify, toast,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}